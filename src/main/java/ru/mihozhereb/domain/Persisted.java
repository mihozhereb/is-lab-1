package ru.mihozhereb.domain;

/**
 * Группа Bean Validation для значений, которые генерирует БД (id, creationDate).
 * До INSERT их ещё нет, поэтому группа проверяется только перед UPDATE
 * (см. jakarta.persistence.validation.group.pre-update в persistence.xml).
 */
public interface Persisted {
}
