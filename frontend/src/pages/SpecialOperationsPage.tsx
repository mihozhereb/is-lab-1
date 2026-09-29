import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Alert, Button, Card, Form, InputGroup } from 'react-bootstrap';
import { ApiError } from '../api/client';
import { personApi, specialApi } from '../api/endpoints';
import { UNITS_OF_MEASURE, type PersonDto, type ProductDto } from '../api/types';
import { ProductDetails } from '../components/ProductDetails';
import { ProductTable } from '../components/ProductTable';
import { describePerson } from '../format';
import { percent as percentCheck } from '../forms/rules';
import { useLiveUpdates } from '../live/LiveUpdates';
import { useDialogs } from '../ui/Dialogs';
import { useNotify } from '../ui/Notifications';

function errorText(error: unknown): string {
  if (error instanceof ApiError) {
    const fields = Object.values(error.fieldErrors);
    return fields.length > 0 ? `${error.message}: ${fields.join('; ')}` : error.message;
  }
  return error instanceof Error ? error.message : String(error);
}

function Operation({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <Card className="mb-3">
      <Card.Header className="fw-semibold">{title}</Card.Header>
      <Card.Body>
        <Card.Text className="text-body-secondary">{description}</Card.Text>
        {children}
      </Card.Body>
    </Card>
  );
}

function ProductsResult({ products }: { products: ProductDto[] | null }) {
  if (products === null) {
    return null;
  }
  return (
    <div className="mt-3">
      <div className="text-body-secondary mb-2">Найдено: {products.length}</div>
      <ProductTable products={products} />
    </div>
  );
}

/** 1. Удалить один (любой) объект, значение поля partNumber которого эквивалентно заданному. */
function DeleteByPartNumber() {
  const notify = useNotify();
  const [partNumber, setPartNumber] = useState('');
  const [isNull, setIsNull] = useState(false);
  const [invalid, setInvalid] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const run = async (event: FormEvent) => {
    event.preventDefault();
    setResult(null);
    if (!isNull && partNumber === '') {
      setInvalid('введите partNumber');
      return;
    }
    try {
      const { deletedId } = await specialApi.deleteByPartNumber(isNull ? null : partNumber);
      setResult(deletedId === null ? 'Объект с таким partNumber не найден, ничего не удалено' : `Удалён Product #${deletedId}`);
    } catch (error) {
      notify.error(errorText(error));
    }
  };

  return (
    <Operation
      title="1. Удалить объект по partNumber"
      description="Удаляет один (любой) объект, значение поля partNumber которого эквивалентно заданному."
    >
      <Form noValidate onSubmit={run} style={{ maxWidth: 520 }}>
        <Form.Check
          id="part-number-null"
          className="mb-2"
          label="partNumber = null"
          checked={isNull}
          onChange={(event) => {
            setIsNull(event.target.checked);
            setInvalid(null);
          }}
        />
        <InputGroup hasValidation>
          <InputGroup.Text>partNumber</InputGroup.Text>
          <Form.Control
            value={partNumber}
            maxLength={100}
            disabled={isNull}
            isInvalid={invalid !== null}
            onChange={(event) => {
              setPartNumber(event.target.value);
              setInvalid(null);
            }}
          />
          <Button type="submit" variant="danger">
            Удалить
          </Button>
          <Form.Control.Feedback type="invalid">{invalid}</Form.Control.Feedback>
        </InputGroup>
      </Form>
      {result && (
        <Alert variant="info" className="mt-3 mb-0">
          {result}
        </Alert>
      )}
    </Operation>
  );
}

/** 2. Вернуть один (любой) объект, значение поля coordinates которого является минимальным. */
function MinCoordinates() {
  const notify = useNotify();
  const [product, setProduct] = useState<ProductDto | null | undefined>(undefined);

  const run = async () => {
    try {
      setProduct((await specialApi.minCoordinates()).product);
    } catch (error) {
      notify.error(errorText(error));
    }
  };

  return (
    <Operation
      title="2. Объект с минимальными coordinates"
      description="Возвращает один (любой) объект, значение поля coordinates которого минимально. Coordinates сравниваются по расстоянию до точки (0; 0), при равенстве — по x, затем по y."
    >
      <Button onClick={run}>Найти</Button>
      {product === null && (
        <Alert variant="info" className="mt-3 mb-0">
          В системе нет объектов
        </Alert>
      )}
      {product && (
        <div className="mt-3">
          <ProductDetails product={product} />
        </div>
      )}
    </Operation>
  );
}

/** 3. Вернуть массив объектов, значение поля owner которых больше заданного. */
function OwnerGreaterThan() {
  const notify = useNotify();
  const [persons, setPersons] = useState<PersonDto[]>([]);
  const [personId, setPersonId] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [products, setProducts] = useState<ProductDto[] | null>(null);

  const loadPersons = useCallback(() => {
    personApi.all().then(setPersons, () => setPersons([]));
  }, []);
  useEffect(loadPersons, [loadPersons]);
  useLiveUpdates(['person'], loadPersons);

  const run = async (event: FormEvent) => {
    event.preventDefault();
    if (personId === '') {
      setInvalid(true);
      return;
    }
    try {
      setProducts(await specialApi.ownerGreaterThan(Number(personId)));
    } catch (error) {
      notify.error(errorText(error));
    }
  };

  return (
    <Operation
      title="3. Объекты с owner больше заданного"
      description="Возвращает объекты, значение поля owner которых больше заданного Person. Person сравниваются по weight, при равном весе — по name."
    >
      <Form noValidate onSubmit={run} style={{ maxWidth: 520 }}>
        <InputGroup hasValidation>
          <InputGroup.Text>owner</InputGroup.Text>
          <Form.Select
            value={personId}
            isInvalid={invalid}
            onChange={(event) => {
              setPersonId(event.target.value);
              setInvalid(false);
            }}
          >
            <option value="">{persons.length === 0 ? '— нет объектов —' : '— выберите Person —'}</option>
            {persons.map((person) => (
              <option key={person.id} value={person.id}>
                {describePerson(person)}, weight = {person.weight}
              </option>
            ))}
          </Form.Select>
          <Button type="submit">Найти</Button>
          <Form.Control.Feedback type="invalid">выберите Person</Form.Control.Feedback>
        </InputGroup>
      </Form>
      <ProductsResult products={products} />
    </Operation>
  );
}

/** 4. Выбрать всю продукцию, характеристики которой определяются заданными единицами измерения. */
function ByUnitsOfMeasure() {
  const notify = useNotify();
  const [units, setUnits] = useState<string[]>([]);
  const [invalid, setInvalid] = useState(false);
  const [products, setProducts] = useState<ProductDto[] | null>(null);

  const toggle = (unit: string, checked: boolean) => {
    setInvalid(false);
    setUnits((current) => (checked ? [...current, unit] : current.filter((item) => item !== unit)));
  };

  const run = async (event: FormEvent) => {
    event.preventDefault();
    if (units.length === 0) {
      setInvalid(true);
      return;
    }
    try {
      setProducts(await specialApi.byUnitsOfMeasure(units));
    } catch (error) {
      notify.error(errorText(error));
    }
  };

  return (
    <Operation
      title="4. Продукция по единицам измерения"
      description="Выбирает всю продукцию, характеристики которой определяются заданными единицами измерения (unitOfMeasure)."
    >
      <Form noValidate onSubmit={run}>
        <div className="d-flex flex-wrap align-items-center gap-3">
          {UNITS_OF_MEASURE.map((unit) => (
            <Form.Check
              key={unit}
              id={`unit-${unit}`}
              inline
              label={unit}
              checked={units.includes(unit)}
              isInvalid={invalid}
              onChange={(event) => toggle(unit, event.target.checked)}
            />
          ))}
          <Button type="submit">Выбрать</Button>
        </div>
        {invalid && <div className="text-danger small mt-1">выберите хотя бы одну единицу измерения</div>}
      </Form>
      <ProductsResult products={products} />
    </Operation>
  );
}

/** 5. Снизить цену всей продукции на указанный процент. */
function DecreasePrices() {
  const notify = useNotify();
  const { confirm } = useDialogs();
  const [value, setValue] = useState('');
  const [invalid, setInvalid] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const run = async (event: FormEvent) => {
    event.preventDefault();
    setResult(null);
    const check = value === '' ? 'обязательное поле' : percentCheck(value);
    if (check !== true) {
      setInvalid(check);
      return;
    }
    const ok = await confirm({ title: `Снизить цену всей продукции на ${value}%?`, confirmText: 'Снизить' });
    if (!ok) {
      return;
    }
    try {
      const { updated } = await specialApi.decreasePrices(value);
      setResult(`Цена снижена у ${updated} объектов`);
    } catch (error) {
      notify.error(errorText(error));
    }
  };

  return (
    <Operation
      title="5. Снизить цену на процент"
      description="Снижает цену всей продукции на указанный процент (больше 0 и меньше 100). Новая цена округляется до целого и остаётся больше 0; продукция без цены не меняется."
    >
      <Form noValidate onSubmit={run} style={{ maxWidth: 360 }}>
        <InputGroup hasValidation>
          <Form.Control
            value={value}
            inputMode="decimal"
            placeholder="0 < % < 100"
            isInvalid={invalid !== null}
            onChange={(event) => {
              setValue(event.target.value.replace(',', '.').replace(/[^\d.]/g, ''));
              setInvalid(null);
            }}
          />
          <InputGroup.Text>%</InputGroup.Text>
          <Button type="submit">Снизить</Button>
          <Form.Control.Feedback type="invalid">{invalid}</Form.Control.Feedback>
        </InputGroup>
      </Form>
      {result && (
        <Alert variant="success" className="mt-3 mb-0">
          {result}
        </Alert>
      )}
    </Operation>
  );
}

/** Отдельный интерфейс для специальных операций (выполняются функциями БД на сервере). */
export function SpecialOperationsPage() {
  return (
    <>
      <h2 className="h3 mb-3">Специальные операции</h2>
      <DeleteByPartNumber />
      <MinCoordinates />
      <OwnerGreaterThan />
      <ByUnitsOfMeasure />
      <DecreasePrices />
    </>
  );
}
