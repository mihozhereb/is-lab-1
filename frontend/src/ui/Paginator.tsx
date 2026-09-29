import { Form, Pagination } from 'react-bootstrap';

const PAGE_SIZES = [5, 10, 20, 50, 100];

interface PaginatorProps {
  page: number;
  size: number;
  total: number;
  onChange: (page: number, size: number) => void;
}

/** Номера страниц (с многоточиями), выбор размера страницы и общее число объектов. */
export function Paginator({ page, size, total, onChange }: PaginatorProps) {
  const pages = Math.max(1, Math.ceil(total / size));
  const numbers: (number | 'gap')[] = [];
  for (let n = 1; n <= pages; n += 1) {
    if (n === 1 || n === pages || Math.abs(n - page) <= 2) {
      numbers.push(n);
    } else if (numbers[numbers.length - 1] !== 'gap') {
      numbers.push('gap');
    }
  }

  return (
    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
      <span className="text-body-secondary">Всего объектов: {total}</span>
      <div className="d-flex align-items-center gap-3">
        <Pagination className="mb-0" size="sm">
          <Pagination.Prev disabled={page <= 1} onClick={() => onChange(page - 1, size)} />
          {numbers.map((n, index) =>
            n === 'gap' ? (
              <Pagination.Ellipsis key={`gap-${index}`} disabled />
            ) : (
              <Pagination.Item key={n} active={n === page} onClick={() => onChange(n, size)}>
                {n}
              </Pagination.Item>
            ),
          )}
          <Pagination.Next disabled={page >= pages} onClick={() => onChange(page + 1, size)} />
        </Pagination>
        <Form.Select
          size="sm"
          style={{ width: 'auto' }}
          value={size}
          aria-label="Объектов на странице"
          onChange={(event) => onChange(1, Number(event.target.value))}
        >
          {PAGE_SIZES.map((option) => (
            <option key={option} value={option}>
              {option} на странице
            </option>
          ))}
        </Form.Select>
      </div>
    </div>
  );
}
