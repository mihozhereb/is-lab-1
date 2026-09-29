import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Button, Modal } from 'react-bootstrap';

interface ConfirmOptions {
  title: string;
  body?: ReactNode;
  confirmText?: string;
  variant?: 'primary' | 'danger';
}

interface MessageOptions {
  title: string;
  body: ReactNode;
}

interface Dialogs {
  /** Окно подтверждения; true — пользователь согласился. */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  /** Окно с сообщением об ошибке. */
  showError: (options: MessageOptions) => void;
}

type OpenDialog =
  | ({ kind: 'confirm'; resolve: (ok: boolean) => void } & ConfirmOptions)
  | ({ kind: 'error' } & MessageOptions);

const DialogsContext = createContext<Dialogs | null>(null);

/** Диалоговые окна подтверждения и ошибок. */
export function DialogsProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<OpenDialog | null>(null);

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => setDialog({ kind: 'confirm', resolve, ...options })),
    [],
  );
  const showError = useCallback((options: MessageOptions) => setDialog({ kind: 'error', ...options }), []);
  const value = useMemo(() => ({ confirm, showError }), [confirm, showError]);

  const close = (ok: boolean) => {
    if (dialog?.kind === 'confirm') {
      dialog.resolve(ok);
    }
    setDialog(null);
  };

  return (
    <DialogsContext.Provider value={value}>
      {children}
      <Modal show={dialog !== null} onHide={() => close(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title as="h5">
            {dialog?.kind === 'error' && <i className="bi bi-exclamation-triangle-fill text-danger me-2" />}
            {dialog?.title}
          </Modal.Title>
        </Modal.Header>
        {dialog?.body && <Modal.Body>{dialog.body}</Modal.Body>}
        <Modal.Footer>
          {dialog?.kind === 'confirm' ? (
            <>
              <Button variant="outline-secondary" onClick={() => close(false)}>
                Отмена
              </Button>
              <Button variant={dialog.variant ?? 'primary'} onClick={() => close(true)}>
                {dialog.confirmText ?? 'OK'}
              </Button>
            </>
          ) : (
            <Button variant="primary" onClick={() => close(false)}>
              OK
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </DialogsContext.Provider>
  );
}

export function useDialogs(): Dialogs {
  const dialogs = useContext(DialogsContext);
  if (!dialogs) {
    throw new Error('useDialogs вызван вне DialogsProvider');
  }
  return dialogs;
}
