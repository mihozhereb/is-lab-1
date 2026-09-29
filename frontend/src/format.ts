import type { AddressDto, CoordinatesDto, LocationDto, OrganizationDto, PersonDto } from './api/types';

export const describeLocation = (l: LocationDto) => `#${l.id} ${l.name} (${l.x}; ${l.y})`;
export const describeAddress = (a: AddressDto) =>
  `#${a.id} ${[a.street, a.zipCode, a.town.name].map(show).join(', ')}`;
export const describeCoordinates = (c: CoordinatesDto) => `#${c.id} (${c.x}; ${c.y})`;
export const describeOrganization = (o: OrganizationDto) => `#${o.id} ${o.name}`;
export const describePerson = (p: PersonDto) => `#${p.id} ${p.name}`;

/** Значение для отображения: null/пустое показывается прочерком. */
export function show(value: unknown): string {
  return value === null || value === undefined || value === '' ? '—' : String(value);
}

/** Подпись поля: русское название и имя поля из задания. */
export function fieldLabel(title: string, field: string): string {
  return `${title} (${field})`;
}
