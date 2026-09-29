// Преобразования между значениями форм и DTO API.
// Связанный объект в форме: { mode: 'existing' | 'new' | 'none', id?, ...поля нового объекта }.
import type {
  AddressDto,
  AddressInput,
  CoordinatesDto,
  CoordinatesInput,
  LocationDto,
  LocationInput,
  OrganizationDto,
  OrganizationInput,
  PersonDto,
  PersonInput,
  ProductDto,
  ProductInput,
  Ref,
} from '../api/types';

export type FormValues = Record<string, any>;

/** Число или необязательное значение → строка; пусто → null. */
const num = (value: unknown): string | null =>
  value === undefined || value === null || value === '' ? null : String(value).trim();

/** Строка, которая не может быть null: пустое поле отправляется как "". */
const text = (value: unknown): string => (value === undefined || value === null ? '' : String(value));

const option = (value: unknown): string | null => (value === undefined || value === null || value === '' ? null : String(value));

function ref<T>(value: FormValues | undefined, build: (v: FormValues) => T): Ref<T> | null {
  if (!value || !value.mode || value.mode === 'none') {
    return null;
  }
  if (value.mode === 'existing') {
    return value.id === undefined || value.id === null ? null : { id: value.id };
  }
  return build(value);
}

export const toLocationInput = (v: FormValues): LocationInput => ({ x: num(v.x), y: num(v.y), name: text(v.name) });

export const toCoordinatesInput = (v: FormValues): CoordinatesInput => ({ x: num(v.x), y: num(v.y) });

export const toAddressInput = (v: FormValues): AddressInput => ({
  street: text(v.street),
  zipCode: text(v.zipCode),
  town: ref(v.town, toLocationInput),
});

export const toOrganizationInput = (v: FormValues): OrganizationInput => ({
  name: text(v.name),
  officialAddress: ref(v.officialAddress, toAddressInput),
  annualTurnover: num(v.annualTurnover),
  employeesCount: num(v.employeesCount),
  fullName: text(v.fullName),
  type: option(v.type),
  postalAddress: ref(v.postalAddress, toAddressInput),
});

export const toPersonInput = (v: FormValues): PersonInput => ({
  name: text(v.name),
  eyeColor: option(v.eyeColor),
  hairColor: option(v.hairColor),
  location: ref(v.location, toLocationInput),
  weight: num(v.weight),
  nationality: option(v.nationality),
});

export const toProductInput = (v: FormValues): ProductInput => ({
  name: text(v.name),
  coordinates: ref(v.coordinates, toCoordinatesInput),
  unitOfMeasure: option(v.unitOfMeasure),
  manufacturer: ref(v.manufacturer, toOrganizationInput),
  price: num(v.price),
  manufactureCost: num(v.manufactureCost),
  rating: num(v.rating),
  // Пустой partNumber означает «не задан» (null).
  partNumber: v.partNumber === undefined || v.partNumber === null || v.partNumber === '' ? null : String(v.partNumber),
  owner: ref(v.owner, toPersonInput),
});

// ---------- начальные значения форм ----------

const existing = (id: number) => ({ mode: 'existing' as const, id });
const newLocation = () => ({ mode: 'new' as const });
const newAddress = () => ({ mode: 'new' as const, town: newLocation() });

export const emptyLocation = (): FormValues => ({});
export const emptyCoordinates = (): FormValues => ({});
export const emptyAddress = (): FormValues => ({ town: newLocation() });
export const emptyOrganization = (): FormValues => ({ officialAddress: { mode: 'none' }, postalAddress: newAddress() });
export const emptyPerson = (): FormValues => ({ location: newLocation() });
export const emptyProduct = (): FormValues => ({
  coordinates: { mode: 'new' },
  manufacturer: { mode: 'new', ...emptyOrganization() },
  owner: { mode: 'new', ...emptyPerson() },
});

export const locationToForm = (l: LocationDto): FormValues => ({ x: String(l.x), y: String(l.y), name: l.name });

export const coordinatesToForm = (c: CoordinatesDto): FormValues => ({ x: String(c.x), y: String(c.y) });

export const addressToForm = (a: AddressDto): FormValues => ({
  street: a.street,
  zipCode: a.zipCode,
  town: existing(a.town.id),
});

export const organizationToForm = (o: OrganizationDto): FormValues => ({
  name: o.name,
  officialAddress: o.officialAddress ? existing(o.officialAddress.id) : { mode: 'none' },
  annualTurnover: o.annualTurnover,
  employeesCount: String(o.employeesCount),
  fullName: o.fullName,
  type: o.type ?? '',
  postalAddress: existing(o.postalAddress.id),
});

export const personToForm = (p: PersonDto): FormValues => ({
  name: p.name,
  eyeColor: p.eyeColor ?? '',
  hairColor: p.hairColor,
  location: existing(p.location.id),
  weight: p.weight,
  nationality: p.nationality,
});

export const productToForm = (p: ProductDto): FormValues => ({
  name: p.name,
  coordinates: existing(p.coordinates.id),
  unitOfMeasure: p.unitOfMeasure ?? '',
  manufacturer: existing(p.manufacturer.id),
  price: p.price === null ? '' : String(p.price),
  manufactureCost: String(p.manufactureCost),
  rating: String(p.rating),
  partNumber: p.partNumber ?? '',
  owner: existing(p.owner.id),
});
