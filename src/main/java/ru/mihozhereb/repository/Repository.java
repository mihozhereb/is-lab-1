package ru.mihozhereb.repository;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.Column;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Order;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.metamodel.EntityType;
import jakarta.persistence.metamodel.SingularAttribute;
import ru.mihozhereb.domain.Product;
import ru.mihozhereb.domain.UnitOfMeasure;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@ApplicationScoped
public class Repository {
    @PersistenceContext(unitName = "islab")
    EntityManager em;

    public Repository() {
    }

    public Repository(EntityManager em) {
        this.em = em;
    }

    public record Page<T>(List<T> items, long total, int page, int size) {
    }

    public <T> Optional<T> find(Class<T> type, long id) {
        return Optional.ofNullable(em.find(type, id));
    }

    public <T> Optional<T> findBy(Class<T> type, String field, Object value) {
        return em.createQuery("SELECT e FROM " + type.getSimpleName() + " e WHERE e." + field + " = :value", type)
                .setParameter("value", value)
                .getResultStream()
                .findFirst();
    }

    public Object id(Object entity) {
        return em.getEntityManagerFactory().getPersistenceUnitUtil().getIdentifier(entity);
    }

    public <T> List<T> all(Class<T> type) {
        return em.createQuery("SELECT e FROM " + type.getSimpleName() + " e ORDER BY e.id", type).getResultList();
    }

    public void persist(Object entity) {
        em.persist(entity);
        em.flush();
    }

    public void flush() {
        em.flush();
    }

    public void remove(Object entity) {
        em.remove(entity);
        em.flush();
    }

    /**
     * Страница таблицы. Фильтры это точное совпадение по строковым полям, сортировка - по любому полю.
     * Поля задаются путями: name, manufacturer.name. page начинается с 1.
     *
     * @throws IllegalArgumentException если поля нет или по нему нельзя фильтровать
     */
    public <T> Page<T> page(Class<T> type, int page, int size, String sort, boolean descending, Map<String, String> filters) {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery<T> query = cb.createQuery(type);
        Root<T> root = query.from(type);
        List<Order> order = new ArrayList<>();
        if (sort != null && !sort.isEmpty()) {
            order.add(descending ? cb.desc(path(root, sort)) : cb.asc(path(root, sort)));
        }
        order.add(cb.asc(root.get("id")));
        List<T> items = em.createQuery(query.select(root).where(filters(cb, root, filters)).orderBy(order))
                .setFirstResult((page - 1) * size)
                .setMaxResults(size)
                .getResultList();

        CriteriaQuery<Long> count = cb.createQuery(Long.class);
        Root<T> countRoot = count.from(type);
        long total = em.createQuery(count.select(cb.count(countRoot)).where(filters(cb, countRoot, filters))).getSingleResult();
        return new Page<>(items, total, page, size);
    }

    private static Predicate[] filters(CriteriaBuilder cb, Root<?> root, Map<String, String> filters) {
        return filters.entrySet().stream().map(filter -> {
            Path<?> path = path(root, filter.getKey());
            Class<?> type = path.getJavaType();
            if (type == String.class) {
                return cb.equal(path, filter.getValue());
            }
            if (type.isEnum()) {
                return cb.equal(path, enumValue(type, filter.getValue()));
            }
            throw new IllegalArgumentException("Фильтр возможен только по строковым колонкам, а не по " + filter.getKey());
        }).toArray(Predicate[]::new);
    }

    @SuppressWarnings({"unchecked", "rawtypes"})
    private static Object enumValue(Class<?> type, String value) {
        return Enum.valueOf((Class<? extends Enum>) type, value);
    }

    private static Path<?> path(Root<?> root, String dotted) {
        Path<?> path = root;
        for (String part : dotted.split("\\.")) {
            path = path.get(part);
        }
        return path;
    }

    public List<Object> resolveReferences(Object entity, String prefix, Map<String, Object> missing) {
        List<Object> created = new ArrayList<>();
        for (SingularAttribute<?, ?> attribute : entityType(entity).getSingularAttributes()) {
            Object reference = attribute.isAssociation() ? read(attribute, entity) : null;
            if (reference == null) {
                continue;
            }
            String path = prefix.isEmpty() ? attribute.getName() : prefix + "." + attribute.getName();
            Object id = id(reference);
            if (id == null) {
                created.add(reference);
                created.addAll(resolveReferences(reference, path, missing));
            } else {
                Object existing = em.find(reference.getClass(), id);
                if (existing == null) {
                    missing.put(path + ".id", id);
                }
                write(attribute, entity, existing);
            }
        }
        return created;
    }

    public void copyState(Object from, Object to) {
        for (SingularAttribute<?, ?> attribute : entityType(to).getSingularAttributes()) {
            Column column = ((Field) attribute.getJavaMember()).getAnnotation(Column.class);
            if (!attribute.isId() && (column == null || column.updatable())) {
                write(attribute, to, read(attribute, from));
            }
        }
    }

    public List<String> usages(Object target) {
        List<String> usages = new ArrayList<>();
        for (EntityType<?> owner : em.getMetamodel().getEntities()) {
            for (SingularAttribute<?, ?> attribute : owner.getSingularAttributes()) {
                if (attribute.isAssociation() && attribute.getJavaType() == target.getClass()) {
                    List<?> ids = em.createQuery("SELECT e.id FROM " + owner.getName() + " e WHERE e."
                                    + attribute.getName() + " = :target ORDER BY e.id")
                            .setParameter("target", target)
                            .getResultList();
                    if (!ids.isEmpty()) {
                        usages.add(owner.getName() + "." + attribute.getName() + ": "
                                + ids.stream().map(id -> "#" + id).collect(Collectors.joining(", ")));
                    }
                }
            }
        }
        return usages;
    }

    private EntityType<?> entityType(Object entity) {
        return em.getMetamodel().entity(entity.getClass());
    }

    private static Object read(SingularAttribute<?, ?> attribute, Object entity) {
        try {
            Field field = (Field) attribute.getJavaMember();
            field.setAccessible(true);
            return field.get(entity);
        } catch (IllegalAccessException e) {
            throw new IllegalStateException(e);
        }
    }

    private static void write(SingularAttribute<?, ?> attribute, Object entity, Object value) {
        try {
            Field field = (Field) attribute.getJavaMember();
            field.setAccessible(true);
            field.set(entity, value);
        } catch (IllegalAccessException e) {
            throw new IllegalStateException(e);
        }
    }

    /** @return id удалённого Product или null */
    public Long deleteProductByPartNumber(String partNumber) {
        return toLong(em.createNativeQuery("SELECT delete_product_by_part_number(CAST(:partNumber AS VARCHAR))")
                .setParameter("partNumber", partNumber)
                .getSingleResult());
    }

    public List<Product> productWithMinCoordinates() {
        return products("SELECT id FROM get_product_with_min_coordinates()", Map.of());
    }

    public List<Product> productsWithOwnerGreaterThan(long personId) {
        return products("SELECT id FROM get_products_with_owner_greater_than(:personId)", Map.of("personId", personId));
    }

    public List<Product> productsByUnitsOfMeasure(Collection<UnitOfMeasure> units) {
        String joined = units.stream().map(Enum::name).collect(Collectors.joining(","));
        return products("SELECT id FROM get_products_by_units_of_measure(string_to_array(:units, ','))",
                Map.of("units", joined));
    }

    /** @return число Product, у которых изменена цена */
    public int decreasePrices(BigDecimal percent) {
        return ((Number) em.createNativeQuery("SELECT decrease_prices(CAST(:percent AS NUMERIC))")
                .setParameter("percent", percent)
                .getSingleResult()).intValue();
    }

    /** Функция возвращает id, объекты загружаются в том же порядке. */
    private List<Product> products(String sql, Map<String, Object> parameters) {
        var query = em.createNativeQuery(sql);
        parameters.forEach(query::setParameter);
        List<Product> products = new ArrayList<>();
        for (Object id : query.getResultList()) {
            products.add(em.find(Product.class, toLong(id)));
        }
        return products;
    }

    private static Long toLong(Object value) {
        return value == null ? null : ((Number) value).longValue();
    }
}
