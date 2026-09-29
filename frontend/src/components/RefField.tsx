import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Card, Form, ToggleButton, ToggleButtonGroup } from 'react-bootstrap';
import { Controller, get, useFormContext, useWatch } from 'react-hook-form';
import type { EntityKey } from '../api/types';
import { required } from '../forms/rules';
import { useLiveUpdates } from '../live/LiveUpdates';

interface RefFieldProps<D extends { id: number }> {
  /** Путь в форме: здесь хранятся mode, id (существующий объект) и поля нового объекта. */
  name: string;
  label: string;
  entity: EntityKey;
  /** Можно ли оставить поле пустым (null). */
  optional?: boolean;
  loadOptions: () => Promise<D[]>;
  describe: (item: D) => string;
  renderNew: (prefix: string) => ReactNode;
}

/**
 * Поле-связь: создать новый объект или выбрать объект, который уже есть в системе.
 * Список существующих объектов обновляется, когда их меняют другие пользователи.
 */
export function RefField<D extends { id: number }>({
  name,
  label,
  entity,
  optional,
  loadOptions,
  describe,
  renderNew,
}: RefFieldProps<D>) {
  const {
    control,
    formState: { errors },
  } = useFormContext();
  const mode = useWatch({ name: `${name}.mode` }) as string | undefined;
  const [options, setOptions] = useState<D[]>([]);

  const load = useCallback(() => {
    loadOptions().then(setOptions, () => setOptions([]));
    // loadOptions — стабильная функция API, перезагружать список при её смене не нужно.
  }, []);
  useEffect(load, [load]);
  useLiveUpdates([entity], load);

  // Ошибка самой связи (например, «обязательное поле») и ошибка выбора существующего объекта.
  const ownError = get(errors, name)?.message as string | undefined;
  const idError = get(errors, `${name}.id`)?.message as string | undefined;

  const modes = [
    { value: 'new', label: 'Создать новый' },
    { value: 'existing', label: 'Выбрать существующий' },
    ...(optional ? [{ value: 'none', label: 'Не задано (null)' }] : []),
  ];

  return (
    <Card className="mb-3 ref-card" border={ownError ? 'danger' : undefined}>
      <Card.Header>
        <span className="fw-semibold">{label}</span>
        <Controller
          name={`${name}.mode`}
          control={control}
          render={({ field }) => (
            <ToggleButtonGroup
              type="radio"
              size="sm"
              name={`${name}-mode`}
              value={field.value as string | undefined}
              onChange={field.onChange}
            >
              {modes.map((option) => (
                <ToggleButton
                  key={option.value}
                  id={`${name}-mode-${option.value}`}
                  value={option.value}
                  variant="outline-primary"
                >
                  {option.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          )}
        />
      </Card.Header>
      <Card.Body>
        {ownError && <div className="text-danger small mb-2">{ownError}</div>}
        {mode === 'existing' && (
          <Form.Group controlId={`${name}.id`}>
            <Form.Label>Объект</Form.Label>
            <Controller
              name={`${name}.id`}
              control={control}
              rules={{ validate: required }}
              render={({ field }) => (
                <Form.Select
                  ref={field.ref}
                  value={field.value === undefined || field.value === null ? '' : String(field.value)}
                  onChange={(event) => field.onChange(event.target.value === '' ? undefined : Number(event.target.value))}
                  onBlur={field.onBlur}
                  isInvalid={idError !== undefined}
                >
                  <option value="">{options.length === 0 ? '— нет объектов —' : '— выберите объект —'}</option>
                  {options.map((item) => (
                    <option key={item.id} value={item.id}>
                      {describe(item)}
                    </option>
                  ))}
                </Form.Select>
              )}
            />
            <Form.Control.Feedback type="invalid">{idError}</Form.Control.Feedback>
          </Form.Group>
        )}
        {mode === 'new' && renderNew(name)}
        {mode === 'none' && <span className="text-body-secondary">Значение не задано (null)</span>}
      </Card.Body>
    </Card>
  );
}
