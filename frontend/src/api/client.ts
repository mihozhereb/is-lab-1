// HTTP-клиент REST API. Пути относительные: фронтенд открыт по /islab/, API — /islab/api/.

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string>;

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

type UnauthorizedListener = () => void;
const unauthorizedListeners = new Set<UnauthorizedListener>();

/** Подписка на ответ 401: сессия истекла или пользователь вышел в другой вкладке. */
export function onUnauthorized(listener: UnauthorizedListener): () => void {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
}

export async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`api/${path}`, {
      method,
      credentials: 'same-origin',
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Сервер недоступен. Проверьте подключение.');
  }

  if (response.status === 204) {
    return undefined as T;
  }
  const text = await response.text();
  let data: unknown = undefined;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = undefined;
    }
  }

  if (!response.ok) {
    const error = (data ?? {}) as { message?: string; fieldErrors?: Record<string, string> };
    if (response.status === 401 && !path.startsWith('auth/')) {
      unauthorizedListeners.forEach((listener) => listener());
    }
    throw new ApiError(response.status, error.message || text || `Ошибка ${response.status}`, error.fieldErrors ?? {});
  }
  return data as T;
}

export function query(params: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      value.forEach((item) => search.append(key, String(item)));
    } else if (value !== undefined && value !== null && value !== '') {
      search.append(key, String(value));
    }
  }
  const result = search.toString();
  return result ? `?${result}` : '';
}
