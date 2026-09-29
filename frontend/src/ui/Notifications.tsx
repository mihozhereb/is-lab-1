import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';

type Variant = 'success' | 'danger' | 'warning' | 'info';

interface Notice {
  id: number;
  variant: Variant;
  text: string;
}

interface Notify {
  success: (text: string) => void;
  error: (text: string) => void;
  warning: (text: string) => void;
}

const NotifyContext = createContext<Notify | null>(null);

/** Всплывающие уведомления в правом верхнем углу. */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const nextId = useRef(1);

  const push = useCallback((variant: Variant, text: string) => {
    const id = nextId.current++;
    setNotices((current) => [...current, { id, variant, text }]);
  }, []);

  const notify = useMemo<Notify>(
    () => ({
      success: (text) => push('success', text),
      error: (text) => push('danger', text),
      warning: (text) => push('warning', text),
    }),
    [push],
  );

  const close = (id: number) => setNotices((current) => current.filter((notice) => notice.id !== id));

  return (
    <NotifyContext.Provider value={notify}>
      {children}
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 2000, position: 'fixed' }}>
        {notices.map((notice) => (
          <Toast
            key={notice.id}
            bg={notice.variant}
            autohide
            delay={notice.variant === 'danger' ? 7000 : 4000}
            onClose={() => close(notice.id)}
          >
            <Toast.Body className={notice.variant === 'warning' ? '' : 'text-white'}>
              <div className="d-flex align-items-start gap-2">
                <span className="flex-grow-1">{notice.text}</span>
                <button
                  type="button"
                  className={`btn-close ${notice.variant === 'warning' ? '' : 'btn-close-white'}`}
                  aria-label="Закрыть"
                  onClick={() => close(notice.id)}
                />
              </div>
            </Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </NotifyContext.Provider>
  );
}

export function useNotify(): Notify {
  const notify = useContext(NotifyContext);
  if (!notify) {
    throw new Error('useNotify вызван вне NotificationsProvider');
  }
  return notify;
}
