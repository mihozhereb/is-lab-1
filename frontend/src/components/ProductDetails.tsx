import type { ReactNode } from 'react';
import { Card, Col, Row, Table } from 'react-bootstrap';
import type { AddressDto, LocationDto, ProductDto } from '../api/types';
import { fieldLabel, show } from '../format';

type Item = [label: string, value: ReactNode];

/** Таблица «поле — значение». */
export function DetailsTable({ items }: { items: Item[] }) {
  return (
    <Table size="sm" bordered className="details-table mb-0">
      <tbody>
        {items.map(([label, value]) => (
          <tr key={label}>
            <th scope="row">{label}</th>
            <td>{value}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

function Section({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <Card className="mb-3">
      <Card.Header className="fw-semibold">{title}</Card.Header>
      <Card.Body>{children}</Card.Body>
    </Card>
  );
}

const locationItems = (location: LocationDto): Item[] => [
  ['id', location.id],
  [fieldLabel('X', 'x'), location.x],
  [fieldLabel('Y', 'y'), location.y],
  [fieldLabel('Название', 'name'), show(location.name)],
];

function AddressDetails({ title, address }: { title: string; address: AddressDto | null }) {
  return (
    <Col lg={6} className="mb-3 mb-lg-0">
      <h6>{title}</h6>
      {address ? (
        <>
          <DetailsTable
            items={[
              ['id', address.id],
              [fieldLabel('Улица', 'street'), show(address.street)],
              [fieldLabel('Индекс', 'zipCode'), show(address.zipCode)],
            ]}
          />
          <div className="small text-body-secondary mt-2 mb-1">{fieldLabel('Город', 'town')}</div>
          <DetailsTable items={locationItems(address.town)} />
        </>
      ) : (
        <span className="text-body-secondary">null</span>
      )}
    </Col>
  );
}

/** Полная информация о Product и всех связанных с ним объектах. */
export function ProductDetails({ product }: { product: ProductDto }) {
  const { coordinates, manufacturer, owner } = product;
  return (
    <>
      <Section title={`Product #${product.id}`}>
        <Row>
          <Col lg={6}>
            <DetailsTable
              items={[
                ['id', product.id],
                [fieldLabel('Название', 'name'), product.name],
                [fieldLabel('Дата создания', 'creationDate'), product.creationDate],
                [fieldLabel('Единица измерения', 'unitOfMeasure'), show(product.unitOfMeasure)],
              ]}
            />
          </Col>
          <Col lg={6}>
            <DetailsTable
              items={[
                [fieldLabel('Цена', 'price'), show(product.price)],
                [fieldLabel('Себестоимость', 'manufactureCost'), product.manufactureCost],
                [fieldLabel('Рейтинг', 'rating'), product.rating],
                [fieldLabel('Артикул', 'partNumber'), show(product.partNumber)],
              ]}
            />
          </Col>
        </Row>
      </Section>

      <Section title={`${fieldLabel('Координаты', 'coordinates')}: Coordinates #${coordinates.id}`}>
        <DetailsTable
          items={[
            ['id', coordinates.id],
            [fieldLabel('X', 'x'), coordinates.x],
            [fieldLabel('Y', 'y'), coordinates.y],
          ]}
        />
      </Section>

      <Section title={`${fieldLabel('Производитель', 'manufacturer')}: Organization #${manufacturer.id}`}>
        <DetailsTable
          items={[
            ['id', manufacturer.id],
            [fieldLabel('Название', 'name'), manufacturer.name],
            [fieldLabel('Полное название', 'fullName'), show(manufacturer.fullName)],
            [fieldLabel('Годовой оборот', 'annualTurnover'), manufacturer.annualTurnover],
            [fieldLabel('Число сотрудников', 'employeesCount'), manufacturer.employeesCount],
            [fieldLabel('Тип', 'type'), show(manufacturer.type)],
          ]}
        />
        <Row className="mt-3">
          <AddressDetails title={fieldLabel('Юридический адрес', 'officialAddress')} address={manufacturer.officialAddress} />
          <AddressDetails title={fieldLabel('Почтовый адрес', 'postalAddress')} address={manufacturer.postalAddress} />
        </Row>
      </Section>

      <Section title={`${fieldLabel('Владелец', 'owner')}: Person #${owner.id}`}>
        <Row>
          <Col lg={6} className="mb-3 mb-lg-0">
            <DetailsTable
              items={[
                ['id', owner.id],
                [fieldLabel('Имя', 'name'), owner.name],
                [fieldLabel('Цвет глаз', 'eyeColor'), show(owner.eyeColor)],
                [fieldLabel('Цвет волос', 'hairColor'), owner.hairColor],
                [fieldLabel('Вес', 'weight'), owner.weight],
                [fieldLabel('Гражданство', 'nationality'), owner.nationality],
              ]}
            />
          </Col>
          <Col lg={6}>
            <h6>{fieldLabel('Местоположение', 'location')}</h6>
            <DetailsTable items={locationItems(owner.location)} />
          </Col>
        </Row>
      </Section>
    </>
  );
}
