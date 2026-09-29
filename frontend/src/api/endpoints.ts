import { query, request } from './client';
import type {
  AddressDto,
  AddressInput,
  CoordinatesDto,
  CoordinatesInput,
  LocationDto,
  LocationInput,
  OrganizationDto,
  OrganizationInput,
  Page,
  PersonDto,
  PersonInput,
  ProductDto,
  ProductInput,
  User,
} from './types';

export const authApi = {
  me: () => request<User>('GET', 'auth/me'),
  login: (username: string, password: string) => request<User>('POST', 'auth/login', { username, password }),
  register: (username: string, password: string) => request<User>('POST', 'auth/register', { username, password }),
  logout: () => request<void>('POST', 'auth/logout'),
};

export const productApi = {
  /** sort — путь поля (manufacturer.name), filters — путь поля → значение (полное совпадение). */
  page: (params: { page: number; size: number; sort?: string; order?: 'asc' | 'desc'; filters: Record<string, string> }) =>
    request<Page<ProductDto>>(
      'GET',
      `products${query({ page: params.page, size: params.size, sort: params.sort, order: params.order, ...params.filters })}`,
    ),
  get: (id: number) => request<ProductDto>('GET', `products/${id}`),
  create: (input: ProductInput) => request<ProductDto>('POST', 'products', input),
  update: (id: number, input: ProductInput) => request<ProductDto>('PUT', `products/${id}`, input),
  remove: (id: number) => request<void>('DELETE', `products/${id}`),
};

/** CRUD вспомогательного класса. */
export interface CrudApi<D, I> {
  page: (page: number, size: number) => Promise<Page<D>>;
  all: () => Promise<D[]>;
  get: (id: number) => Promise<D>;
  create: (input: I) => Promise<D>;
  update: (id: number, input: I) => Promise<D>;
  remove: (id: number) => Promise<void>;
}

function crudApi<D, I>(path: string): CrudApi<D, I> {
  return {
    page: (page, size) => request<Page<D>>('GET', `${path}${query({ page, size })}`),
    all: () => request<D[]>('GET', `${path}/all`),
    get: (id) => request<D>('GET', `${path}/${id}`),
    create: (input) => request<D>('POST', path, input),
    update: (id, input) => request<D>('PUT', `${path}/${id}`, input),
    remove: (id) => request<void>('DELETE', `${path}/${id}`),
  };
}

export const locationApi = crudApi<LocationDto, LocationInput>('locations');
export const addressApi = crudApi<AddressDto, AddressInput>('addresses');
export const coordinatesApi = crudApi<CoordinatesDto, CoordinatesInput>('coordinates');
export const organizationApi = crudApi<OrganizationDto, OrganizationInput>('organizations');
export const personApi = crudApi<PersonDto, PersonInput>('persons');

export const specialApi = {
  deleteByPartNumber: (partNumber: string | null) =>
    request<{ deletedId: number | null }>('POST', 'special/delete-by-part-number', { partNumber }),
  minCoordinates: () => request<{ product: ProductDto | null }>('GET', 'special/min-coordinates'),
  ownerGreaterThan: (personId: number) =>
    request<ProductDto[]>('GET', `special/owner-greater-than${query({ personId })}`),
  byUnitsOfMeasure: (units: string[]) =>
    request<ProductDto[]>('GET', `special/by-units-of-measure${query({ units })}`),
  decreasePrices: (percent: string) => request<{ updated: number }>('POST', 'special/decrease-prices', { percent }),
};
