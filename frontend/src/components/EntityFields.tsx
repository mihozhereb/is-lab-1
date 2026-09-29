// Поля форм для каждого класса предметной области. prefix — путь объекта в форме
// ('' для объекта верхнего уровня, 'manufacturer' для вложенного и т. д.).
import { Col, Row } from 'react-bootstrap';
import { addressApi, coordinatesApi, locationApi, organizationApi, personApi } from '../api/endpoints';
import { COLORS, COUNTRIES, ORGANIZATION_TYPES, UNITS_OF_MEASURE } from '../api/types';
import {
  describeAddress,
  describeCoordinates,
  describeLocation,
  describeOrganization,
  describePerson,
  fieldLabel,
} from '../format';
import { NumberField, SelectField, TextField } from '../forms/fields';
import {
  float32,
  float64,
  int32,
  int64,
  INT_MAX_TEXT,
  LONG_MAX_TEXT,
  maxLength,
  maxValue,
  notBlank,
  positive,
  required,
} from '../forms/rules';
import { RefField } from './RefField';

interface FieldsProps {
  prefix: string;
}

const path = (prefix: string, field: string) => (prefix ? `${prefix}.${field}` : field);

export function LocationFields({ prefix }: FieldsProps) {
  return (
    <>
      <Row>
        <Col md={6}>
          <NumberField
            name={path(prefix, 'x')}
            label={fieldLabel('X', 'x')}
            kind="decimal"
            required
            checks={[required, float32]}
            placeholder="float"
          />
        </Col>
        <Col md={6}>
          <NumberField
            name={path(prefix, 'y')}
            label={fieldLabel('Y', 'y')}
            kind="decimal"
            required
            checks={[required, float32]}
            placeholder="Float, не null"
          />
        </Col>
      </Row>
      <TextField
        name={path(prefix, 'name')}
        label={fieldLabel('Название', 'name')}
        help="Не может быть null; пустое поле сохраняется как пустая строка"
      />
    </>
  );
}

export function CoordinatesFields({ prefix }: FieldsProps) {
  return (
    <Row>
      <Col md={6}>
        <NumberField
          name={path(prefix, 'x')}
          label={fieldLabel('X', 'x')}
          kind="decimal"
          max="850"
          required
          checks={[required, float64, maxValue(850)]}
          placeholder="double, не больше 850"
        />
      </Col>
      <Col md={6}>
        <NumberField
          name={path(prefix, 'y')}
          label={fieldLabel('Y', 'y')}
          kind="decimal"
          max="842"
          required
          checks={[required, float32, maxValue(842)]}
          placeholder="float, не больше 842"
        />
      </Col>
    </Row>
  );
}

export function AddressFields({ prefix }: FieldsProps) {
  return (
    <>
      <TextField
        name={path(prefix, 'street')}
        label={fieldLabel('Улица', 'street')}
        maxLength={182}
        checks={[maxLength(182)]}
        help="Не может быть null, не длиннее 182 символов"
      />
      <TextField
        name={path(prefix, 'zipCode')}
        label={fieldLabel('Индекс', 'zipCode')}
        maxLength={12}
        checks={[maxLength(12)]}
        help="Не может быть null, не длиннее 12 символов"
      />
      <RefField
        name={path(prefix, 'town')}
        label={fieldLabel('Город', 'town')}
        entity="location"
        loadOptions={locationApi.all}
        describe={describeLocation}
        renderNew={(p) => <LocationFields prefix={p} />}
      />
    </>
  );
}

export function OrganizationFields({ prefix }: FieldsProps) {
  return (
    <>
      <Row>
        <Col md={6}>
          <TextField name={path(prefix, 'name')} label={fieldLabel('Название', 'name')} required checks={[notBlank]} />
        </Col>
        <Col md={6}>
          <TextField
            name={path(prefix, 'fullName')}
            label={fieldLabel('Полное название', 'fullName')}
            help="Не может быть null"
          />
        </Col>
      </Row>
      <Row>
        <Col md={6}>
          <NumberField
            name={path(prefix, 'annualTurnover')}
            label={fieldLabel('Годовой оборот', 'annualTurnover')}
            kind="int"
            min="1"
            max={LONG_MAX_TEXT}
            required
            checks={[required, int64, positive]}
            placeholder="long > 0"
          />
        </Col>
        <Col md={6}>
          <NumberField
            name={path(prefix, 'employeesCount')}
            label={fieldLabel('Число сотрудников', 'employeesCount')}
            kind="int"
            min="1"
            max={INT_MAX_TEXT}
            required
            checks={[required, int32, positive]}
            placeholder="int > 0"
          />
        </Col>
      </Row>
      <SelectField name={path(prefix, 'type')} label={fieldLabel('Тип', 'type')} options={ORGANIZATION_TYPES} nullable />
      <RefField
        name={path(prefix, 'officialAddress')}
        label={fieldLabel('Юридический адрес', 'officialAddress')}
        entity="address"
        optional
        loadOptions={addressApi.all}
        describe={describeAddress}
        renderNew={(p) => <AddressFields prefix={p} />}
      />
      <RefField
        name={path(prefix, 'postalAddress')}
        label={fieldLabel('Почтовый адрес', 'postalAddress')}
        entity="address"
        loadOptions={addressApi.all}
        describe={describeAddress}
        renderNew={(p) => <AddressFields prefix={p} />}
      />
    </>
  );
}

export function PersonFields({ prefix }: FieldsProps) {
  return (
    <>
      <Row>
        <Col md={6}>
          <TextField name={path(prefix, 'name')} label={fieldLabel('Имя', 'name')} required checks={[notBlank]} />
        </Col>
        <Col md={6}>
          <NumberField
            name={path(prefix, 'weight')}
            label={fieldLabel('Вес', 'weight')}
            kind="int"
            min="1"
            max={LONG_MAX_TEXT}
            required
            checks={[required, int64, positive]}
            placeholder="long > 0"
          />
        </Col>
      </Row>
      <Row>
        <Col md={4}>
          <SelectField name={path(prefix, 'eyeColor')} label={fieldLabel('Цвет глаз', 'eyeColor')} options={COLORS} nullable />
        </Col>
        <Col md={4}>
          <SelectField
            name={path(prefix, 'hairColor')}
            label={fieldLabel('Цвет волос', 'hairColor')}
            options={COLORS}
            required
            checks={[required]}
          />
        </Col>
        <Col md={4}>
          <SelectField
            name={path(prefix, 'nationality')}
            label={fieldLabel('Гражданство', 'nationality')}
            options={COUNTRIES}
            required
            checks={[required]}
          />
        </Col>
      </Row>
      <RefField
        name={path(prefix, 'location')}
        label={fieldLabel('Местоположение', 'location')}
        entity="location"
        loadOptions={locationApi.all}
        describe={describeLocation}
        renderNew={(p) => <LocationFields prefix={p} />}
      />
    </>
  );
}

/** Поля Product (объект верхнего уровня). */
export function ProductFields() {
  return (
    <>
      <Row>
        <Col md={6}>
          <TextField name="name" label={fieldLabel('Название', 'name')} required checks={[notBlank]} />
        </Col>
        <Col md={6}>
          <TextField
            name="partNumber"
            label={fieldLabel('Артикул', 'partNumber')}
            maxLength={100}
            checks={[maxLength(100)]}
            help="Уникальный, не длиннее 100 символов; пустое поле — null"
          />
        </Col>
      </Row>
      <Row>
        <Col md={6}>
          <NumberField
            name="price"
            label={fieldLabel('Цена', 'price')}
            kind="int"
            min="1"
            max={INT_MAX_TEXT}
            checks={[int32, positive]}
            placeholder="Integer > 0 или пусто (null)"
          />
        </Col>
        <Col md={6}>
          <SelectField
            name="unitOfMeasure"
            label={fieldLabel('Единица измерения', 'unitOfMeasure')}
            options={UNITS_OF_MEASURE}
            nullable
          />
        </Col>
      </Row>
      <Row>
        <Col md={6}>
          <NumberField
            name="manufactureCost"
            label={fieldLabel('Себестоимость', 'manufactureCost')}
            kind="decimal"
            required
            checks={[required, float64]}
            placeholder="double"
          />
        </Col>
        <Col md={6}>
          <NumberField
            name="rating"
            label={fieldLabel('Рейтинг', 'rating')}
            kind="decimal"
            required
            checks={[required, float32, positive]}
            placeholder="float > 0"
          />
        </Col>
      </Row>
      <RefField
        name="coordinates"
        label={fieldLabel('Координаты', 'coordinates')}
        entity="coordinates"
        loadOptions={coordinatesApi.all}
        describe={describeCoordinates}
        renderNew={(p) => <CoordinatesFields prefix={p} />}
      />
      <RefField
        name="manufacturer"
        label={fieldLabel('Производитель', 'manufacturer')}
        entity="organization"
        loadOptions={organizationApi.all}
        describe={describeOrganization}
        renderNew={(p) => <OrganizationFields prefix={p} />}
      />
      <RefField
        name="owner"
        label={fieldLabel('Владелец', 'owner')}
        entity="person"
        loadOptions={personApi.all}
        describe={describePerson}
        renderNew={(p) => <PersonFields prefix={p} />}
      />
    </>
  );
}
