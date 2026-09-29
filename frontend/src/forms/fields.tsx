// Поля форм на React Bootstrap, подключённые к react-hook-form (через FormProvider).
import type { ReactNode } from 'react';
import { Alert, Form } from 'react-bootstrap';
import { Controller, get, useFormContext, type FieldValues, type UseFormSetError } from 'react-hook-form';
import { ApiError } from '../api/client';
import { rules as combine, type Check } from './rules';

interface FieldProps {
  name: string;
  label: string;
  help?: ReactNode;
  /** Показать звёздочку обязательного поля. */
  required?: boolean;
  checks?: Check[];
  placeholder?: string;
}

function useFieldError(name: string): string | undefined {
  const {
    formState: { errors },
  } = useFormContext();
  return get(errors, name)?.message as string | undefined;
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <Form.Label>
      {label}
      {required && <span className="text-danger"> *</span>}
    </Form.Label>
  );
}

interface TextFieldProps extends FieldProps {
  maxLength?: number;
  type?: 'text' | 'password';
  autoComplete?: string;
}

export function TextField({ name, label, help, required, checks = [], placeholder, maxLength, type, autoComplete }: TextFieldProps) {
  const { register } = useFormContext();
  const error = useFieldError(name);
  return (
    <Form.Group className="mb-3" controlId={name}>
      <FieldLabel label={label} required={required} />
      <Form.Control
        {...register(name, combine(...checks))}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        maxLength={maxLength}
        isInvalid={error !== undefined}
      />
      <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
      {help && <Form.Text muted>{help}</Form.Text>}
    </Form.Group>
  );
}

interface NumberFieldProps extends FieldProps {
  /** int — только цифры и минус; decimal — ещё точка и экспонента. */
  kind: 'int' | 'decimal';
  /** Границы, к которым значение приводится при потере фокуса. */
  min?: string;
  max?: string;
}

function sanitize(raw: string, kind: 'int' | 'decimal'): string {
  if (kind === 'int') {
    return raw.replace(/[^\d-]/g, '').replace(/(?!^)-/g, '');
  }
  return raw.replace(',', '.').replace(/[^\d.eE+-]/g, '');
}

function clamp(value: string, kind: 'int' | 'decimal', min?: string, max?: string): string {
  if (kind === 'int') {
    if (!/^-?\d+$/.test(value)) {
      return value;
    }
    const number = BigInt(value);
    if (min !== undefined && number < BigInt(min)) {
      return min;
    }
    if (max !== undefined && number > BigInt(max)) {
      return max;
    }
    return value;
  }
  const number = Number(value);
  if (value === '' || Number.isNaN(number)) {
    return value;
  }
  if (min !== undefined && number < Number(min)) {
    return min;
  }
  if (max !== undefined && number > Number(max)) {
    return max;
  }
  return value;
}

/**
 * Числовое поле. Значение хранится строкой (long не теряет точность); недопустимые символы
 * не вводятся, а выход за границы исправляется при потере фокуса.
 */
export function NumberField({ name, label, help, required, checks = [], placeholder, kind, min, max }: NumberFieldProps) {
  const { control } = useFormContext();
  const error = useFieldError(name);
  return (
    <Form.Group className="mb-3" controlId={name}>
      <FieldLabel label={label} required={required} />
      <Controller
        name={name}
        control={control}
        rules={combine(...checks)}
        render={({ field }) => (
          <Form.Control
            ref={field.ref}
            name={field.name}
            value={(field.value as string | undefined) ?? ''}
            inputMode={kind === 'int' ? 'numeric' : 'decimal'}
            placeholder={placeholder}
            isInvalid={error !== undefined}
            onChange={(event) => field.onChange(sanitize(event.target.value, kind))}
            onBlur={() => {
              const value = (field.value as string | undefined) ?? '';
              const clamped = clamp(value, kind, min, max);
              if (clamped !== value) {
                field.onChange(clamped);
              }
              field.onBlur();
            }}
          />
        )}
      />
      <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
      {help && <Form.Text muted>{help}</Form.Text>}
    </Form.Group>
  );
}

interface SelectFieldProps extends FieldProps {
  options: readonly string[];
  /** Можно не выбирать значение (null). */
  nullable?: boolean;
}

export function SelectField({ name, label, help, required, checks = [], options, nullable }: SelectFieldProps) {
  const { register } = useFormContext();
  const error = useFieldError(name);
  return (
    <Form.Group className="mb-3" controlId={name}>
      <FieldLabel label={label} required={required} />
      <Form.Select {...register(name, combine(...checks))} isInvalid={error !== undefined}>
        <option value="">{nullable ? '— не задано (null) —' : '— выберите —'}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Form.Select>
      <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
      {help && <Form.Text muted>{help}</Form.Text>}
    </Form.Group>
  );
}

// ---------- ошибки отправки ----------

export interface SubmitError {
  message: string;
  details: string[];
}

export const INVALID_FORM: SubmitError = { message: 'Исправьте ошибки в отмеченных полях', details: [] };

/**
 * Показывает ошибки сервера у полей формы (путь поля в ответе совпадает с именем поля формы)
 * и возвращает их списком для общего сообщения над формой.
 */
export function applyServerErrors<T extends FieldValues>(setError: UseFormSetError<T>, error: unknown): SubmitError {
  if (!(error instanceof ApiError)) {
    return { message: error instanceof Error ? error.message : String(error), details: [] };
  }
  const entries = Object.entries(error.fieldErrors);
  for (const [path, message] of entries) {
    setError(path as Parameters<UseFormSetError<T>>[0], { type: 'server', message });
  }
  return { message: error.message, details: entries.map(([path, message]) => `${path}: ${message}`) };
}

export function SubmitErrorAlert({ error }: { error: SubmitError | null }) {
  if (!error) {
    return null;
  }
  return (
    <Alert variant="danger">
      <div className="fw-semibold">{error.message}</div>
      {error.details.length > 0 && (
        <ul className="mb-0 mt-1 ps-3">
          {error.details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      )}
    </Alert>
  );
}
