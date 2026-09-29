import { addressApi, coordinatesApi, locationApi, organizationApi, personApi, type CrudApi } from '../api/endpoints';
import type { AddressDto, CoordinatesDto, LocationDto, OrganizationDto, PersonDto } from '../api/types';
import {
  AddressFields,
  CoordinatesFields,
  LocationFields,
  OrganizationFields,
  PersonFields,
} from '../components/EntityFields';
import {
  addressToForm,
  coordinatesToForm,
  emptyAddress,
  emptyCoordinates,
  emptyLocation,
  emptyOrganization,
  emptyPerson,
  locationToForm,
  organizationToForm,
  personToForm,
  toAddressInput,
  toCoordinatesInput,
  toLocationInput,
  toOrganizationInput,
  toPersonInput,
} from '../forms/convert';
import { describeAddress, describeLocation, fieldLabel, show } from '../format';
import type { AuxiliaryConfig } from './AuxiliaryPage';

export const locationConfig: AuxiliaryConfig<LocationDto> = {
  className: 'Location',
  title: 'Локации',
  entity: 'location',
  watch: [],
  api: locationApi as CrudApi<LocationDto, unknown>,
  columns: [
    { title: 'id', render: (l) => l.id },
    { title: 'x', render: (l) => l.x },
    { title: 'y', render: (l) => l.y },
    { title: 'name', render: (l) => show(l.name) },
  ],
  details: (l) => [
    ['id', l.id],
    [fieldLabel('X', 'x'), l.x],
    [fieldLabel('Y', 'y'), l.y],
    [fieldLabel('Название', 'name'), show(l.name)],
  ],
  Fields: LocationFields,
  empty: emptyLocation,
  toForm: locationToForm,
  toInput: toLocationInput,
};

export const addressConfig: AuxiliaryConfig<AddressDto> = {
  className: 'Address',
  title: 'Адреса',
  entity: 'address',
  watch: ['location'],
  api: addressApi as CrudApi<AddressDto, unknown>,
  columns: [
    { title: 'id', render: (a) => a.id },
    { title: 'street', render: (a) => show(a.street) },
    { title: 'zipCode', render: (a) => show(a.zipCode) },
    { title: 'town', render: (a) => describeLocation(a.town) },
  ],
  details: (a) => [
    ['id', a.id],
    [fieldLabel('Улица', 'street'), show(a.street)],
    [fieldLabel('Индекс', 'zipCode'), show(a.zipCode)],
    [fieldLabel('Город', 'town'), describeLocation(a.town)],
  ],
  Fields: AddressFields,
  empty: emptyAddress,
  toForm: addressToForm,
  toInput: toAddressInput,
};

export const coordinatesConfig: AuxiliaryConfig<CoordinatesDto> = {
  className: 'Coordinates',
  title: 'Координаты',
  entity: 'coordinates',
  watch: [],
  api: coordinatesApi as CrudApi<CoordinatesDto, unknown>,
  columns: [
    { title: 'id', render: (c) => c.id },
    { title: 'x', render: (c) => c.x },
    { title: 'y', render: (c) => c.y },
  ],
  details: (c) => [
    ['id', c.id],
    [fieldLabel('X', 'x'), c.x],
    [fieldLabel('Y', 'y'), c.y],
  ],
  Fields: CoordinatesFields,
  empty: emptyCoordinates,
  toForm: coordinatesToForm,
  toInput: toCoordinatesInput,
};

export const organizationConfig: AuxiliaryConfig<OrganizationDto> = {
  className: 'Organization',
  title: 'Организации',
  entity: 'organization',
  watch: ['address', 'location'],
  api: organizationApi as CrudApi<OrganizationDto, unknown>,
  columns: [
    { title: 'id', render: (o) => o.id },
    { title: 'name', render: (o) => o.name },
    { title: 'fullName', render: (o) => show(o.fullName) },
    { title: 'annualTurnover', render: (o) => o.annualTurnover },
    { title: 'employeesCount', render: (o) => o.employeesCount },
    { title: 'type', render: (o) => show(o.type) },
    { title: 'officialAddress', render: (o) => (o.officialAddress ? describeAddress(o.officialAddress) : '—') },
    { title: 'postalAddress', render: (o) => describeAddress(o.postalAddress) },
  ],
  details: (o) => [
    ['id', o.id],
    [fieldLabel('Название', 'name'), o.name],
    [fieldLabel('Полное название', 'fullName'), show(o.fullName)],
    [fieldLabel('Годовой оборот', 'annualTurnover'), o.annualTurnover],
    [fieldLabel('Число сотрудников', 'employeesCount'), o.employeesCount],
    [fieldLabel('Тип', 'type'), show(o.type)],
    [fieldLabel('Юридический адрес', 'officialAddress'), o.officialAddress ? describeAddress(o.officialAddress) : 'null'],
    [fieldLabel('Почтовый адрес', 'postalAddress'), describeAddress(o.postalAddress)],
  ],
  Fields: OrganizationFields,
  empty: emptyOrganization,
  toForm: organizationToForm,
  toInput: toOrganizationInput,
};

export const personConfig: AuxiliaryConfig<PersonDto> = {
  className: 'Person',
  title: 'Люди',
  entity: 'person',
  watch: ['location'],
  api: personApi as CrudApi<PersonDto, unknown>,
  columns: [
    { title: 'id', render: (p) => p.id },
    { title: 'name', render: (p) => p.name },
    { title: 'eyeColor', render: (p) => show(p.eyeColor) },
    { title: 'hairColor', render: (p) => p.hairColor },
    { title: 'location', render: (p) => describeLocation(p.location) },
    { title: 'weight', render: (p) => p.weight },
    { title: 'nationality', render: (p) => p.nationality },
  ],
  details: (p) => [
    ['id', p.id],
    [fieldLabel('Имя', 'name'), p.name],
    [fieldLabel('Цвет глаз', 'eyeColor'), show(p.eyeColor)],
    [fieldLabel('Цвет волос', 'hairColor'), p.hairColor],
    [fieldLabel('Местоположение', 'location'), describeLocation(p.location)],
    [fieldLabel('Вес', 'weight'), p.weight],
    [fieldLabel('Гражданство', 'nationality'), p.nationality],
  ],
  Fields: PersonFields,
  empty: emptyPerson,
  toForm: personToForm,
  toInput: toPersonInput,
};
