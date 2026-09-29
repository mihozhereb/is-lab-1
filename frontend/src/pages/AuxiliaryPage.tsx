import { useCallback, useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react';
import { Alert, Button, ButtonGroup, Card, Form, Modal, Spinner, Table } from 'react-bootstrap';
import { FormProvider, useForm } from 'react-hook-form';
import type { CrudApi } from '../api/endpoints';
import type { EntityKey, Page } from '../api/types';
import { DetailsTable } from '../components/ProductDetails';
import type { FormValues } from '../forms/convert';
import { applyServerErrors, INVALID_FORM, SubmitErrorAlert, type SubmitError } from '../forms/fields';
import { useLiveUpdates } from '../live/LiveUpdates';
import { useDialogs } from '../ui/Dialogs';
import { Paginator } from '../ui/Paginator';
import { useNotify } from '../ui/Notifications';

interface AuxiliaryColumn<D> {
  title: string;
  render: (item: D) => ReactNode;
}

export interface AuxiliaryConfig<D extends { id: number }> {
  /** Имя класса из задания (Location). */
  className: string;
  title: string;
  entity: EntityKey;
  /** Типы объектов, изменения которых меняют отображение этой таблицы. */
  watch: EntityKey[];
  api: CrudApi<D, unknown>;
  columns: AuxiliaryColumn<D>[];
  details: (item: D) => [string, ReactNode][];
  Fields: ComponentType<{ prefix: string }>;
  empty: () => FormValues;
  toForm: (item: D) => FormValues;
  toInput: (values: FormValues) => unknown;
}

type Editor = { mode: 'create' } | { mode: 'edit'; id: number };

/** Раздел вспомогательного класса: таблица, просмотр, создание, изменение, удаление. */
export function AuxiliaryPage<D extends { id: number }>({ config }: { config: AuxiliaryConfig<D> }) {
  const { className, title, api, columns, details } = config;
  const notify = useNotify();
  const { confirm, showError } = useDialogs();
  const [page, setPage] = useState({ current: 1, size: 10 });
  const [data, setData] = useState<Page<D> | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewed, setViewed] = useState<D | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api
      .page(page.current, page.size)
      .then((result) => {
        const lastPage = Math.max(1, Math.ceil(result.total / page.size));
        if (result.items.length === 0 && page.current > lastPage) {
          setPage((current) => ({ ...current, current: lastPage }));
        } else {
          setData(result);
        }
      })
      .catch((error: Error) => notify.error(error.message))
      .finally(() => setLoading(false));
  }, [api, page, notify]);

  useEffect(load, [load]);
  useLiveUpdates([config.entity, ...config.watch], (change) => {
    load();
    if (viewed && change.entity === config.entity && change.id === viewed.id) {
      if (change.action === 'deleted') {
        setViewed(null);
        notify.warning(`${className} #${change.id} удалён другим пользователем`);
      } else {
        api.get(viewed.id).then(setViewed, () => setViewed(null));
      }
    }
  });

  const remove = async (id: number) => {
    const ok = await confirm({
      title: `Удалить ${className} #${id}?`,
      body: 'Если объект связан с другими объектами, удаление будет отменено.',
      confirmText: 'Удалить',
      variant: 'danger',
    });
    if (!ok) {
      return;
    }
    try {
      await api.remove(id);
      notify.success(`${className} #${id} удалён`);
    } catch (error) {
      showError({ title: 'Удаление невозможно', body: error instanceof Error ? error.message : String(error) });
    }
  };

  return (
    <>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
        <h2 className="h3 mb-0">
          {title} <span className="text-body-secondary fs-5">({className})</span>
        </h2>
        <Button onClick={() => setEditor({ mode: 'create' })}>
          <i className="bi bi-plus-lg me-1" />
          Создать
        </Button>
      </div>

      <Card body>
        <Table striped bordered hover size="sm" responsive className="bg-body mb-3">
          <thead className="table-light">
            <tr>
              {columns.map((column) => (
                <th key={column.title}>{column.title}</th>
              ))}
              <th className="text-end">Действия</th>
            </tr>
          </thead>
          <tbody style={loading ? { opacity: 0.5 } : undefined}>
            {(data?.items.length ?? 0) === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="text-center text-body-secondary py-4">
                  Нет объектов
                </td>
              </tr>
            )}
            {data?.items.map((item) => (
              <tr key={item.id}>
                {columns.map((column) => (
                  <td key={column.title}>{column.render(item)}</td>
                ))}
                <td className="text-end text-nowrap">
                  <ButtonGroup size="sm">
                    <Button variant="outline-secondary" title="Открыть" onClick={() => setViewed(item)}>
                      <i className="bi bi-eye" />
                    </Button>
                    <Button variant="outline-primary" title="Изменить" onClick={() => setEditor({ mode: 'edit', id: item.id })}>
                      <i className="bi bi-pencil" />
                    </Button>
                    <Button variant="outline-danger" title="Удалить" onClick={() => remove(item.id)}>
                      <i className="bi bi-trash" />
                    </Button>
                  </ButtonGroup>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        <Paginator
          page={page.current}
          size={page.size}
          total={data?.total ?? 0}
          onChange={(current, size) => setPage({ current, size })}
        />
      </Card>

      <Modal show={viewed !== null} onHide={() => setViewed(null)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title as="h5">{viewed ? `${className} #${viewed.id}` : ''}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{viewed && <DetailsTable items={details(viewed)} />}</Modal.Body>
        <Modal.Footer>
          {viewed && (
            <Button
              onClick={() => {
                setEditor({ mode: 'edit', id: viewed.id });
                setViewed(null);
              }}
            >
              <i className="bi bi-pencil me-1" />
              Изменить
            </Button>
          )}
          <Button variant="outline-secondary" onClick={() => setViewed(null)}>
            Закрыть
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={editor !== null} onHide={() => setEditor(null)} size="lg" scrollable backdrop="static">
        {editor && (
          <AuxiliaryFormLoader
            key={editor.mode === 'edit' ? `edit-${editor.id}` : 'create'}
            config={config}
            editId={editor.mode === 'edit' ? editor.id : null}
            onClose={() => setEditor(null)}
          />
        )}
      </Modal>
    </>
  );
}

interface AuxiliaryFormProps<D extends { id: number }> {
  config: AuxiliaryConfig<D>;
  editId: number | null;
  onClose: () => void;
}

/** Для изменения сначала загружает объект: форма создаётся сразу с его значениями. */
function AuxiliaryFormLoader<D extends { id: number }>(props: AuxiliaryFormProps<D>) {
  const { config, editId, onClose } = props;
  const [initial, setInitial] = useState<FormValues | null>(editId === null ? config.empty() : null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const toForm = useRef(config.toForm);

  useEffect(() => {
    if (editId !== null) {
      config.api.get(editId).then(
        (item) => setInitial(toForm.current(item)),
        (error: Error) => setLoadError(error.message),
      );
    }
  }, [config.api, editId]);

  if (initial) {
    return <AuxiliaryForm {...props} initial={initial} />;
  }
  return (
    <>
      <Modal.Header closeButton>
        <Modal.Title as="h5">
          Изменение {config.className} #{editId}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loadError ? (
          <Alert variant="danger" className="mb-0">
            {loadError}
          </Alert>
        ) : (
          <div className="text-center py-5">
            <Spinner animation="border" />
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>
          Отмена
        </Button>
      </Modal.Footer>
    </>
  );
}

function AuxiliaryForm<D extends { id: number }>({
  config,
  editId,
  onClose,
  initial,
}: AuxiliaryFormProps<D> & { initial: FormValues }) {
  const { className, api, Fields } = config;
  const notify = useNotify();
  const form = useForm<FormValues>({ shouldUnregister: true, mode: 'onTouched', defaultValues: initial });
  const [submitError, setSubmitError] = useState<SubmitError | null>(null);

  const submit = form.handleSubmit(
    async (values) => {
      setSubmitError(null);
      try {
        const input = config.toInput(values);
        const saved = editId === null ? await api.create(input) : await api.update(editId, input);
        notify.success(`${className} #${saved.id} сохранён`);
        onClose();
      } catch (error) {
        setSubmitError(applyServerErrors(form.setError, error));
      }
    },
    () => setSubmitError(INVALID_FORM),
  );

  return (
    <>
      <Modal.Header closeButton>
        <Modal.Title as="h5">{editId === null ? `Новый ${className}` : `Изменение ${className} #${editId}`}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {editId === null && (
          <Alert variant="info" className="py-2">
            id генерируется автоматически
          </Alert>
        )}
        <SubmitErrorAlert error={submitError} />
        <FormProvider {...form}>
          <Form id="auxiliary-form" noValidate onSubmit={submit}>
            <Fields prefix="" />
          </Form>
        </FormProvider>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>
          Отмена
        </Button>
        <Button type="submit" form="auxiliary-form" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Spinner size="sm" className="me-2" />}
          Сохранить
        </Button>
      </Modal.Footer>
    </>
  );
}
