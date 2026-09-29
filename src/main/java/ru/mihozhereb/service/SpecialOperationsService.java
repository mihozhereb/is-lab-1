package ru.mihozhereb.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Event;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import ru.mihozhereb.domain.Person;
import ru.mihozhereb.domain.Product;
import ru.mihozhereb.domain.UnitOfMeasure;
import ru.mihozhereb.repository.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@ApplicationScoped
@Transactional
public class SpecialOperationsService {
    @Inject
    Repository repository;
    @Inject
    Event<EntityChange> events;

    /** Удалить один (любой) объект, значение поля partNumber которого эквивалентно заданному. */
    public Long deleteByPartNumber(String partNumber) {
        Long id = repository.deleteProductByPartNumber(partNumber);
        if (id != null) {
            events.fire(new EntityChange("product", "deleted", id));
        }
        return id;
    }

    /** Вернуть один (любой) объект, значение поля coordinates которого является минимальным. */
    public Product withMinCoordinates() {
        return repository.productWithMinCoordinates().stream().findFirst().orElse(null);
    }

    /** Вернуть массив объектов, значение поля owner которых больше заданного. */
    public List<Product> withOwnerGreaterThan(Long personId) {
        if (personId == null) {
            throw AppException.badRequest("Выберите Person", Map.of("personId", "обязательное поле"));
        }
        repository.find(Person.class, personId)
                .orElseThrow(() -> AppException.notFound("Person с id " + personId + " не найден"));
        return repository.productsWithOwnerGreaterThan(personId);
    }

    /** Выбрать всю продукцию, характеристики которой определяются заданными единицами измерения. */
    public List<Product> byUnitsOfMeasure(List<UnitOfMeasure> units) {
        if (units == null || units.isEmpty()) {
            throw AppException.badRequest("Выберите хотя бы одну единицу измерения",
                    Map.of("units", "выберите хотя бы одну единицу измерения"));
        }
        return repository.productsByUnitsOfMeasure(units);
    }

    /** Снизить цену всей продукции на указанный процент. */
    public int decreasePrices(BigDecimal percent) {
        if (percent == null || percent.signum() <= 0 || percent.compareTo(BigDecimal.valueOf(100)) >= 0) {
            throw AppException.badRequest("Проверьте введённые значения", Map.of("percent", "должно быть больше 0 и меньше 100"));
        }
        int updated = repository.decreasePrices(percent);
        if (updated > 0) {
            events.fire(new EntityChange("product", "bulk", null));
        }
        return updated;
    }
}
