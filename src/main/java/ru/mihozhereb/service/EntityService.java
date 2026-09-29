package ru.mihozhereb.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Event;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import ru.mihozhereb.domain.Product;
import ru.mihozhereb.repository.Repository;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/**
 * Управление объектами любого класса модели (Product, Coordinates, Organization, Person, Address, Location).
 */
@ApplicationScoped
@Transactional
public class EntityService {
    public static final int MAX_PAGE_SIZE = 100;

    @Inject
    Repository repository;
    @Inject
    Validator validator;
    @Inject
    Event<EntityChange> events;

    public <T> Repository.Page<T> page(Class<T> type, int page, int size, String sort, boolean descending,
                                       Map<String, String> filters) {
        try {
            return repository.page(type, Math.max(1, page), Math.min(MAX_PAGE_SIZE, Math.max(1, size)), sort, descending, filters);
        } catch (IllegalArgumentException e) {
            throw AppException.badRequest("Неверный параметр сортировки или фильтра: " + e.getMessage());
        }
    }

    public <T> List<T> all(Class<T> type) {
        return repository.all(type);
    }

    public <T> T get(Class<T> type, long id) {
        return repository.find(type, id)
                .orElseThrow(() -> AppException.notFound(type.getSimpleName() + " с id " + id + " не найден"));
    }

    public <T> T create(T entity) {
        List<Object> created = prepare(entity, null);
        repository.persist(entity);
        fireCreated(created);
        events.fire(EntityChange.of(entity, "created", repository.id(entity)));
        return entity;
    }

    public <T> T update(Class<T> type, long id, T input) {
        T entity = get(type, id);
        List<Object> created = prepare(input, id);
        created.forEach(repository::persist);
        repository.copyState(input, entity);
        repository.flush();
        fireCreated(created);
        events.fire(EntityChange.of(entity, "updated", id));
        return entity;
    }

    public void delete(Class<?> type, long id) {
        Object entity = get(type, id);
        List<String> usages = repository.usages(entity);
        if (!usages.isEmpty()) {
            throw AppException.conflict("Удаление отменено: с " + type.getSimpleName() + " #" + id
                    + " связаны другие объекты (" + String.join("; ", usages) + ")");
        }
        repository.remove(entity);
        events.fire(EntityChange.of(entity, "deleted", id));
    }

    /**
     * @return новые связанные объекты
     */
    private List<Object> prepare(Object entity, Long id) {
        if (entity == null) {
            throw AppException.badRequest("Тело запроса не может быть пустым");
        }
        Map<String, Object> missing = new LinkedHashMap<>();
        List<Object> created = repository.resolveReferences(entity, "", missing);
        if (!missing.isEmpty()) {
            Map<String, String> errors = new LinkedHashMap<>();
            missing.forEach((path, missingId) -> errors.put(path, "объект с id " + missingId + " не найден"));
            throw AppException.badRequest("Связанный объект не найден", errors);
        }
        if (entity instanceof Product product && "".equals(product.getPartNumber())) {
            product.setPartNumber(null); // пустой partNumber — «не задан»
        }
        Map<String, String> errors = new TreeMap<>();
        for (ConstraintViolation<Object> violation : validator.validate(entity)) {
            errors.putIfAbsent(violation.getPropertyPath().toString(), violation.getMessage());
        }
        if (!errors.isEmpty()) {
            throw AppException.badRequest("Проверьте введённые значения", errors);
        }
        if (entity instanceof Product product && product.getPartNumber() != null) {
            repository.findBy(Product.class, "partNumber", product.getPartNumber())
                    .filter(other -> id == null || other.getId() != id)
                    .ifPresent(other -> {
                        throw AppException.badRequest("Проверьте введённые значения", Map.of("partNumber",
                                "значение должно быть уникальным: уже используется у Product #" + other.getId()));
                    });
        }
        return created;
    }

    private void fireCreated(List<Object> created) {
        created.forEach(entity -> events.fire(EntityChange.of(entity, "created", repository.id(entity))));
    }
}
