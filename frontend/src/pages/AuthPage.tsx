import { useState } from 'react';
import { Button, Card, Form, Spinner } from 'react-bootstrap';
import { FormProvider, useForm } from 'react-hook-form';
import { Link, Navigate } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { applyServerErrors, SubmitErrorAlert, TextField, type SubmitError } from '../forms/fields';
import { required, type Check } from '../forms/rules';

interface Credentials {
  username: string;
  password: string;
  confirm?: string;
}

const usernameFormat: Check = (value) =>
  /^[A-Za-z0-9_.-]{3,64}$/.test(String(value ?? '')) ? true : 'от 3 до 64 символов: латинские буквы, цифры, «_», «.», «-»';
const passwordLength: Check = (value) => {
  const length = String(value ?? '').length;
  return length >= 6 && length <= 128 ? true : 'от 6 до 128 символов';
};

/** Вход или регистрация. */
export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { user, login, register } = useAuth();

  if (user) {
    return <Navigate to="/products" replace />;
  }
  return <AuthForm key={mode} mode={mode} onSubmit={mode === 'login' ? login : register} />;
}

function AuthForm({
  mode,
  onSubmit,
}: {
  mode: 'login' | 'register';
  onSubmit: (username: string, password: string) => Promise<void>;
}) {
  const form = useForm<Credentials>({ mode: 'onTouched' });
  const [error, setError] = useState<SubmitError | null>(null);
  const isRegister = mode === 'register';

  const submit = form.handleSubmit(async ({ username, password }) => {
    setError(null);
    try {
      await onSubmit(username, password);
    } catch (e) {
      setError(applyServerErrors(form.setError, e));
    }
  });

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-3">
      <Card style={{ width: 400 }} className="shadow-sm">
        <Card.Body className="p-4">
          <h1 className="h4 text-center mb-1">{isRegister ? 'Регистрация' : 'Вход'}</h1>
          <p className="text-center text-body-secondary mb-4">ИС «Продукция»</p>
          <SubmitErrorAlert error={error} />
          <FormProvider {...form}>
            <Form noValidate onSubmit={submit}>
              <TextField
                name="username"
                label="Логин"
                maxLength={64}
                autoComplete="username"
                checks={isRegister ? [required, usernameFormat] : [required]}
              />
              <TextField
                name="password"
                label="Пароль"
                type="password"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                checks={isRegister ? [required, passwordLength] : [required]}
              />
              {isRegister && (
                <TextField
                  name="confirm"
                  label="Пароль ещё раз"
                  type="password"
                  autoComplete="new-password"
                  checks={[required, (value) => (value === form.getValues('password') ? true : 'пароли не совпадают')]}
                />
              )}
              <Button type="submit" className="w-100" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Spinner size="sm" className="me-2" />}
                {isRegister ? 'Зарегистрироваться' : 'Войти'}
              </Button>
            </Form>
          </FormProvider>
          <div className="text-center mt-3">
            {isRegister ? (
              <Link to="/login">Уже есть учётная запись? Войти</Link>
            ) : (
              <Link to="/register">Нет учётной записи? Зарегистрироваться</Link>
            )}
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
