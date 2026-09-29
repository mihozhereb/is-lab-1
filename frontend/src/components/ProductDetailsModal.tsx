import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Modal, Spinner } from 'react-bootstrap';
import { ApiError } from '../api/client';
import { productApi } from '../api/endpoints';
import type { ProductDto } from '../api/types';
import { useLiveUpdates } from '../live/LiveUpdates';
import { ProductDetails } from './ProductDetails';
import { useDeleteProduct } from './useDeleteProduct';

interface ProductDetailsModalProps {
  /** id просматриваемого Product; null — окно закрыто. */
  productId: number | null;
  onClose: () => void;
  onEdit: (id: number) => void;
}

/** Информация об объекте Product по ИД вместе со всеми связанными объектами. */
export function ProductDetailsModal({ productId, onClose, onEdit }: ProductDetailsModalProps) {
  const [product, setProduct] = useState<ProductDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletedByOthers, setDeletedByOthers] = useState(false);

  const load = useCallback(() => {
    if (productId === null) {
      return;
    }
    productApi.get(productId).then(
      (loaded) => {
        setProduct(loaded);
        setError(null);
      },
      (e: ApiError) => {
        setProduct(null);
        setError(e.status === 404 ? `Product с id ${productId} не найден` : e.message);
      },
    );
  }, [productId]);

  useEffect(() => {
    setProduct(null);
    setError(null);
    setDeletedByOthers(false);
    load();
  }, [load]);

  // Показаны и связанные объекты, поэтому следим за всеми типами.
  useLiveUpdates(['product', 'coordinates', 'organization', 'person', 'address', 'location'], (change) => {
    if (productId === null || product === null) {
      return;
    }
    if (change.entity === 'product' && change.action === 'deleted' && change.id === productId) {
      setDeletedByOthers(true);
      setProduct(null);
    } else {
      load();
    }
  });

  const deleteProduct = useDeleteProduct(onClose);

  return (
    <Modal show={productId !== null} onHide={onClose} size="xl" scrollable>
      <Modal.Header closeButton>
        <Modal.Title as="h5">{product ? product.name : `Product #${productId ?? ''}`}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {deletedByOthers && <Alert variant="warning">Product #{productId} удалён другим пользователем.</Alert>}
        {error && <Alert variant="danger">{error}</Alert>}
        {!product && !error && !deletedByOthers && (
          <div className="text-center py-5">
            <Spinner animation="border" />
          </div>
        )}
        {product && <ProductDetails product={product} />}
      </Modal.Body>
      <Modal.Footer>
        {product && (
          <>
            <Button variant="outline-danger" className="me-auto" onClick={() => deleteProduct(product.id)}>
              <i className="bi bi-trash me-1" />
              Удалить
            </Button>
            <Button variant="primary" onClick={() => onEdit(product.id)}>
              <i className="bi bi-pencil me-1" />
              Изменить
            </Button>
          </>
        )}
        <Button variant="outline-secondary" onClick={onClose}>
          Закрыть
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
