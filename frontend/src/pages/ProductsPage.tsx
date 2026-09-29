import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Button, Card, Form, InputGroup } from 'react-bootstrap';
import { productApi } from '../api/endpoints';
import type { Page, ProductDto } from '../api/types';
import { ProductDetailsModal } from '../components/ProductDetailsModal';
import { ProductFormModal, type ProductFormTarget } from '../components/ProductFormModal';
import { ProductTable, type FilterField, type Filters, type SortOrder } from '../components/ProductTable';
import { useDeleteProduct } from '../components/useDeleteProduct';
import { useLiveUpdates } from '../live/LiveUpdates';
import { Paginator } from '../ui/Paginator';
import { useNotify } from '../ui/Notifications';

/** Колонка таблицы → поле на сервере: связанные объекты сортируются и фильтруются по имени (координаты — по x). */
const SERVER_PATHS: Record<string, string> = {
  coordinates: 'coordinates.x',
  manufacturer: 'manufacturer.name',
  owner: 'owner.name',
};
const serverPath = (column: string) => SERVER_PATHS[column] ?? column;

interface TableState {
  page: number;
  size: number;
  sortField?: string;
  sortOrder?: SortOrder;
  filters: Filters;
}

/**
 * Главный экран: таблица объектов Product (пагинация, сортировка и фильтрация на сервере),
 * поиск по ИД и создание нового объекта.
 */
export function ProductsPage() {
  const notify = useNotify();
  const [table, setTable] = useState<TableState>({ page: 1, size: 10, filters: {} });
  const [data, setData] = useState<Page<ProductDto> | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailsId, setDetailsId] = useState<number | null>(null);
  const [formTarget, setFormTarget] = useState<ProductFormTarget | null>(null);
  const [searchId, setSearchId] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    productApi
      .page({
        page: table.page,
        size: table.size,
        sort: table.sortField && serverPath(table.sortField),
        order: table.sortOrder,
        filters: Object.fromEntries(
          Object.entries(table.filters)
            .filter(([, value]) => value)
            .map(([field, value]) => [serverPath(field), value as string]),
        ),
      })
      .then((page) => {
        // Если на текущей странице ничего не осталось (объекты удалены), переходим на последнюю.
        const lastPage = Math.max(1, Math.ceil(page.total / table.size));
        if (page.items.length === 0 && table.page > lastPage) {
          setTable((current) => ({ ...current, page: lastPage }));
        } else {
          setData(page);
        }
      })
      .catch((error: Error) => notify.error(error.message))
      .finally(() => setLoading(false));
  }, [table, notify]);

  useEffect(load, [load]);
  // В таблице показаны имена и координаты связанных объектов, поэтому следим и за ними.
  useLiveUpdates(['product', 'coordinates', 'organization', 'person'], load);

  const deleteProduct = useDeleteProduct(load);

  // Щелчок по заголовку: по возрастанию → по убыванию → без сортировки.
  const sortBy = (field: string) =>
    setTable((current) => {
      if (current.sortField !== field) {
        return { ...current, sortField: field, sortOrder: 'asc' };
      }
      if (current.sortOrder === 'asc') {
        return { ...current, sortOrder: 'desc' };
      }
      return { ...current, sortField: undefined, sortOrder: undefined };
    });

  const filterBy = useCallback((field: FilterField, value: string) => {
    setTable((current) => ({ ...current, page: 1, filters: { ...current.filters, [field]: value || undefined } }));
  }, []);

  const search = (event: FormEvent) => {
    event.preventDefault();
    if (!/^\d+$/.test(searchId) || Number(searchId) < 1) {
      setSearchError('Введите id — целое положительное число');
      return;
    }
    setSearchError(null);
    setDetailsId(Number(searchId));
  };

  const edit = (id: number) => {
    setDetailsId(null);
    setFormTarget({ kind: 'edit', id });
  };

  return (
    <>
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-3">
        <h2 className="h3 mb-0">Продукция</h2>
        <div className="d-flex flex-wrap align-items-start gap-2">
          <Form noValidate onSubmit={search}>
            <InputGroup hasValidation>
              <InputGroup.Text>id</InputGroup.Text>
              <Form.Control
                value={searchId}
                inputMode="numeric"
                placeholder="Поиск по ID"
                aria-label="Поиск по ID"
                style={{ width: 150 }}
                isInvalid={searchError !== null}
                onChange={(event) => {
                  setSearchId(event.target.value.replace(/\D/g, ''));
                  setSearchError(null);
                }}
              />
              <Button type="submit" variant="outline-primary">
                <i className="bi bi-search me-1" />
                Найти
              </Button>
              <Form.Control.Feedback type="invalid">{searchError}</Form.Control.Feedback>
            </InputGroup>
          </Form>
          <Button onClick={() => setFormTarget({ kind: 'create' })}>
            <i className="bi bi-plus-lg me-1" />
            Создать продукт
          </Button>
        </div>
      </div>

      <Card body>
        <ProductTable
          products={data?.items ?? []}
          loading={loading}
          sortField={table.sortField}
          sortOrder={table.sortOrder}
          onSort={sortBy}
          filters={table.filters}
          onFilterChange={filterBy}
          onOpen={setDetailsId}
          onEdit={edit}
          onDelete={deleteProduct}
        />
        <Paginator
          page={table.page}
          size={table.size}
          total={data?.total ?? 0}
          onChange={(page, size) => setTable((current) => ({ ...current, page, size }))}
        />
      </Card>

      <ProductDetailsModal productId={detailsId} onClose={() => setDetailsId(null)} onEdit={edit} />
      <ProductFormModal target={formTarget} onClose={() => setFormTarget(null)} />
    </>
  );
}
