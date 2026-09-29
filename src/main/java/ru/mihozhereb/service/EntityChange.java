package ru.mihozhereb.service;

/**
 * @param entity product, coordinates, organization, person, address или location
 * @param action created, updated, deleted или bulk (изменено много объектов сразу)
 * @param id     id объекта; null для bulk
 */
public record EntityChange(String entity, String action, Long id) {
    static EntityChange of(Object entity, String action, Object id) {
        return new EntityChange(entity.getClass().getSimpleName().toLowerCase(), action, ((Number) id).longValue());
    }
}
