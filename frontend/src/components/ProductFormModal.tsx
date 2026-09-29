import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Form, Modal, Spinner } from 'react-bootstrap';
import { FormProvider, useForm } from 'react-hook-form';
import { ApiError } from '../api/client';
import { productApi } from '../api/endpoints';
import type { ProductDto } from '../api/types';
import { emptyProduct, productToForm, toProductInput, type FormValues } from '../forms/convert';
import { applyServerErrors, INVALID_FORM, SubmitErrorAlert, type SubmitError } from '../forms/fields';
import { useLiveUpdates } from '../live/LiveUpdates';
import { useNotify } from '../ui/Notifications';
import { ProductFields } from './EntityFields';

/** Что открыто в окне формы: создание нового Product или изменение существующего. */
export type ProductFormTarget = { kind: 'create' } | { kind: 'edit'; id: number };

interface ProductFormModalProps {
  target: ProductFormTarget | null;
  onClose: () => void;
  onSaved?: (product: ProductDto) => void;
}

/** Отдельное диалоговое окно создания или модификации объекта Product. */
export function ProductFormModal({ target, onClose, onSaved }: ProductFormModalProps) {
  return (
    <Modal show={target !== null} onHide={onClose} size="xl" scrollable backdrop="static">
      {target && (
        <ProductFormLoader
          key={target.kind === 'edit' ? `edit-${target.id}` : 'create'}
          editId={target.kind === 'edit' ? target.id : null}
          onClose={onClose}
          onSaved={onSaved}
        />
      )}
    </Modal>
  );
}

interface FormProps {
  editId: number | null;
  onClose: () => void;
  onSaved?: (product: ProductDto) => void;
}

/** Для изменения сначала загружает объект: форма создаётся сразу с его значениями. */
function ProductFormLoader(props: FormProps) {
  const { editId, onClose } = props;
  const [initial, setInitial] = useState<FormValues | null>(editId === null ? emptyProduct() : null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (editId !== null) {
      productApi.get(editId).then(
        (product) => setInitial(productToForm(product)),
        (error: Error) => setLoadError(error.message),
      );
    }
  }, [editId]);

  if (initial) {
    return <ProductForm {...props} initial={initial} />;
  }
  return (
    <>
      <Modal.Header closeButton>
        <Modal.Title as="h5">Изменение Product #{editId}</Modal.Title>
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

function ProductForm({ editId, onClose, onSaved, initial }: FormProps & { initial: FormValues }) {
  const notify = useNotify();
  const form = useForm<FormValues>({ shouldUnregister: true, mode: 'onTouched', defaultValues: initial });
  const [submitError, setSubmitError] = useState<SubmitError | null>(null);
  const [changedByOthers, setChangedByOthers] = useState<'updated' | 'deleted' | null>(null);
  const saving = useRef(false);

  useLiveUpdates(['product'], (change) => {
    if (editId === null || saving.current) {
      return;
    }
    if (change.action === 'bulk' || change.id === editId) {
      setChangedByOthers(change.action === 'deleted' ? 'deleted' : 'updated');
    }
  });

  const submit = form.handleSubmit(
    async (values) => {
      setSubmitError(null);
      saving.current = true;
      try {
        const input = toProductInput(values);
        const saved = editId === null ? await productApi.create(input) : await productApi.update(editId, input);
        notify.success(editId === null ? `Product #${saved.id} создан` : `Product #${saved.id} сохранён`);
        onSaved?.(saved);
        onClose();
      } catch (error) {
        setSubmitError(applyServerErrors(form.setError, error));
        if (error instanceof ApiError && error.status === 404) {
          setChangedByOthers('deleted');
        }
      } finally {
        saving.current = false;
      }
    },
    () => setSubmitError(INVALID_FORM),
  );

  return (
    <>
      <Modal.Header closeButton>
        <Modal.Title as="h5">{editId === null ? 'Новый продукт' : `Изменение Product #${editId}`}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {editId === null && (
          <Alert variant="info" className="py-2">
            id и creationDate генерируются автоматически. Координаты, производителя и владельца можно создать или выбрать
            из объектов, которые уже есть в системе.
          </Alert>
        )}
        {changedByOthers === 'deleted' && <Alert variant="warning">Этот объект удалён другим пользователем.</Alert>}
        {changedByOthers === 'updated' && (
          <Alert variant="info">
            Объект изменён другим пользователем. При сохранении его значения будут заменены вашими.
          </Alert>
        )}
        <SubmitErrorAlert error={submitError} />
        <FormProvider {...form}>
          <Form id="product-form" noValidate onSubmit={submit}>
            <ProductFields />
          </Form>
        </FormProvider>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>
          Отмена
        </Button>
        <Button type="submit" form="product-form" disabled={form.formState.isSubmitting || changedByOthers === 'deleted'}>
          {form.formState.isSubmitting && <Spinner size="sm" className="me-2" />}
          {editId === null ? 'Создать' : 'Сохранить'}
        </Button>
      </Modal.Footer>
    </>
  );
}
