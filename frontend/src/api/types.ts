// Типы данных REST API: сервер отдаёт сущности (ru.mihozhereb.domain) как есть.
// long-поля (annualTurnover, weight) приходят строками, чтобы не терять точность.

export const UNITS_OF_MEASURE = ['KILOGRAMS', 'METERS', 'CENTIMETERS', 'SQUARE_METERS'] as const;
export const ORGANIZATION_TYPES = ['COMMERCIAL', 'PUBLIC', 'TRUST', 'PRIVATE_LIMITED_COMPANY'] as const;
export const COLORS = ['GREEN', 'BLUE', 'ORANGE', 'BROWN'] as const;
export const COUNTRIES = ['RUSSIA', 'THAILAND', 'SOUTH_KOREA', 'NORTH_KOREA'] as const;

export interface LocationDto {
  id: number;
  x: number;
  y: number;
  name: string;
}

export interface AddressDto {
  id: number;
  street: string;
  zipCode: string;
  town: LocationDto;
}

export interface CoordinatesDto {
  id: number;
  x: number;
  y: number;
}

export interface OrganizationDto {
  id: number;
  name: string;
  officialAddress: AddressDto | null;
  annualTurnover: string;
  employeesCount: number;
  fullName: string;
  type: string | null;
  postalAddress: AddressDto;
}

export interface PersonDto {
  id: number;
  name: string;
  eyeColor: string | null;
  hairColor: string;
  location: LocationDto;
  weight: string;
  nationality: string;
}

export interface ProductDto {
  id: number;
  name: string;
  coordinates: CoordinatesDto;
  creationDate: string;
  unitOfMeasure: string | null;
  manufacturer: OrganizationDto;
  price: number | null;
  manufactureCost: number;
  rating: number;
  partNumber: string | null;
  owner: PersonDto;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

export interface User {
  username: string;
}

/** Ссылка на существующий объект или данные нового. Числа передаются строками. */
export type Ref<T> = { id: number } | T;

export interface LocationInput {
  x: string | null;
  y: string | null;
  name: string | null;
}

export interface AddressInput {
  street: string | null;
  zipCode: string | null;
  town: Ref<LocationInput> | null;
}

export interface CoordinatesInput {
  x: string | null;
  y: string | null;
}

export interface OrganizationInput {
  name: string | null;
  officialAddress: Ref<AddressInput> | null;
  annualTurnover: string | null;
  employeesCount: string | null;
  fullName: string | null;
  type: string | null;
  postalAddress: Ref<AddressInput> | null;
}

export interface PersonInput {
  name: string | null;
  eyeColor: string | null;
  hairColor: string | null;
  location: Ref<LocationInput> | null;
  weight: string | null;
  nationality: string | null;
}

export interface ProductInput {
  name: string | null;
  coordinates: Ref<CoordinatesInput> | null;
  unitOfMeasure: string | null;
  manufacturer: Ref<OrganizationInput> | null;
  price: string | null;
  manufactureCost: string | null;
  rating: string | null;
  partNumber: string | null;
  owner: Ref<PersonInput> | null;
}


/** Событие об изменении объекта, приходит по WebSocket. */
export interface EntityChange {
  entity: EntityKey;
  action: 'created' | 'updated' | 'deleted' | 'bulk';
  id: number | null;
}

export type EntityKey = 'product' | 'coordinates' | 'organization' | 'person' | 'address' | 'location';
