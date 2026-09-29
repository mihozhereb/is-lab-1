import { useEffect, useState, type ReactNode } from 'react';
import { Button, ButtonGroup, Form, Table } from 'react-bootstrap';
import { UNITS_OF_MEASURE, type ProductDto } from '../api/types';
import { show } from '../format';

export type SortOrder = 'asc' | 'desc';

/** Строковые колонки: по ним работает фильтр (только полное совпадение). */
const FILTER_FIELDS = ['name', 'unitOfMeasure', 'manufacturer', 'partNumber', 'owner'] as const;
export type FilterField = (typeof FILTER_FIELDS)[number];
export type Filters = Partial<Record<FilterField, string>>;

interface Column {
  key: string;
  render: (product: ProductDto) => ReactNode;
  filter?: 'text' | 'unit';
}

/** Каждый атрибут Product — отдельная колонка. */
const COLUMNS: Column[] = [
  { key: 'id', render: (p) => p.id },
  { key: 'name', render: (p) => p.name, filter: 'text' },
  { key: 'coordinates', render: (p) => `(${p.coordinates.x}; ${p.coordinates.y})` },
  { key: 'creationDate', render: (p) => p.creationDate },
  { key: 'unitOfMeasure', render: (p) => show(p.unitOfMeasure), filter: 'unit' },
  { key: 'manufacturer', render: (p) => `${p.manufacturer.name} (#${p.manufacturer.id})`, filter: 'text' },
  { key: 'price', render: (p) => show(p.price) },
  { key: 'manufactureCost', render: (p) => p.manufactureCost },
  { key: 'rating', render: (p) => p.rating },
  { key: 'partNumber', render: (p) => show(p.partNumber), filter: 'text' },
  { key: 'owner', render: (p) => `${p.owner.name} (#${p.owner.id})`, filter: 'text' },
];

/** Поле фильтра: применяется после паузы в наборе. */
function FilterInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  useEffect(() => {
    if (draft === value) {
      return undefined;
    }
    const timer = window.setTimeout(() => onChange(draft), 400);
    return () => window.clearTimeout(timer);
  }, [draft, value, onChange]);
  return (
    <Form.Control size="sm" value={draft} placeholder="Фильтр" onChange={(event) => setDraft(event.target.value)} />
  );
}

interface ProductTableProps {
  products: ProductDto[];
  loading?: boolean;
  /** Серверная сортировка: щелчок по заголовку. */
  sortField?: string;
  sortOrder?: SortOrder;
  onSort?: (field: string) => void;
  /** Серверная фильтрация по строковым колонкам. */
  filters?: Filters;
  onFilterChange?: (field: FilterField, value: string) => void;
  onOpen?: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export function ProductTable({
  products,
  loading,
  sortField,
  sortOrder,
  onSort,
  filters = {},
  onFilterChange,
  onOpen,
  onEdit,
  onDelete,
}: ProductTableProps) {
  const hasActions = Boolean(onOpen || onEdit || onDelete);
  const sortIcon = (key: string) => {
    if (sortField !== key) {
      return 'bi-arrow-down-up text-body-tertiary';
    }
    return sortOrder === 'desc' ? 'bi-sort-down' : 'bi-sort-up';
  };

  return (
    <Table striped bordered hover size="sm" responsive className={`bg-body mb-3 ${onSort ? 'table-sortable' : ''}`}>
      <thead className="table-light">
        <tr>
          {COLUMNS.map((column) => (
            <th
              key={column.key}
              className={onSort ? 'sortable' : undefined}
              onClick={onSort ? () => onSort(column.key) : undefined}
              aria-sort={sortField === column.key ? (sortOrder === 'desc' ? 'descending' : 'ascending') : undefined}
            >
              {column.key}
              {onSort && <i className={`bi ${sortIcon(column.key)} ms-1`} />}
            </th>
          ))}
          {hasActions && <th className="text-end">Действия</th>}
        </tr>
        {onFilterChange && (
          <tr>
            {COLUMNS.map((column) => (
              <th key={column.key} className="fw-normal">
                {column.filter === 'text' && (
                  <FilterInput
                    value={filters[column.key as FilterField] ?? ''}
                    onChange={(value) => onFilterChange(column.key as FilterField, value)}
                  />
                )}
                {column.filter === 'unit' && (
                  <Form.Select
                    size="sm"
                    value={filters.unitOfMeasure ?? ''}
                    onChange={(event) => onFilterChange('unitOfMeasure', event.target.value)}
                  >
                    <option value="">Все</option>
                    {UNITS_OF_MEASURE.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </Form.Select>
                )}
              </th>
            ))}
            {hasActions && <th />}
          </tr>
        )}
      </thead>
      <tbody style={loading ? { opacity: 0.5 } : undefined}>
        {products.length === 0 && (
          <tr>
            <td colSpan={COLUMNS.length + (hasActions ? 1 : 0)} className="text-center text-body-secondary py-4">
              Нет объектов
            </td>
          </tr>
        )}
        {products.map((product) => (
          <tr key={product.id}>
            {COLUMNS.map((column) => (
              <td key={column.key}>
                {column.key === 'id' && onOpen ? (
                  <Button variant="link" size="sm" className="p-0" onClick={() => onOpen(product.id)}>
                    {product.id}
                  </Button>
                ) : (
                  column.render(product)
                )}
              </td>
            ))}
            {hasActions && (
              <td className="text-end text-nowrap">
                <ButtonGroup size="sm">
                  {onOpen && (
                    <Button variant="outline-secondary" title="Открыть" onClick={() => onOpen(product.id)}>
                      <i className="bi bi-eye" />
                    </Button>
                  )}
                  {onEdit && (
                    <Button variant="outline-primary" title="Изменить" onClick={() => onEdit(product.id)}>
                      <i className="bi bi-pencil" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button variant="outline-danger" title="Удалить" onClick={() => onDelete(product.id)}>
                      <i className="bi bi-trash" />
                    </Button>
                  )}
                </ButtonGroup>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
