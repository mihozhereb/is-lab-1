import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { EntityChange, EntityKey } from '../api/types';

type Listener = (change: EntityChange) => void;
type Subscribe = (listener: Listener) => () => void;

const LiveUpdatesContext = createContext<Subscribe | null>(null);

function socketUrl(): string {
  const url = new URL('ws/updates', window.location.href);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.hash = '';
  return url.toString();
}

/**
 * Держит WebSocket с сервером, пока пользователь в системе, и раздаёт события об изменениях подписчикам.
 * При обрыве переподключается с нарастающей задержкой.
 */
export function LiveUpdatesProvider({ children }: { children: ReactNode }) {
  const listeners = useRef(new Set<Listener>());
  const [subscribe] = useState<Subscribe>(() => (listener: Listener) => {
    listeners.current.add(listener);
    return () => {
      listeners.current.delete(listener);
    };
  });

  useEffect(() => {
    let socket: WebSocket | null = null;
    let retryTimer: number | undefined;
    let attempt = 0;
    let stopped = false;

    const connect = () => {
      socket = new WebSocket(socketUrl());
      socket.onopen = () => {
        attempt = 0;
      };
      socket.onmessage = (event) => {
        const change = JSON.parse(event.data as string) as EntityChange;
        listeners.current.forEach((listener) => listener(change));
      };
      socket.onclose = () => {
        if (!stopped) {
          attempt += 1;
          retryTimer = window.setTimeout(connect, Math.min(10000, 500 * 2 ** attempt));
        }
      };
    };
    connect();

    return () => {
      stopped = true;
      window.clearTimeout(retryTimer);
      socket?.close();
    };
  }, []);

  return <LiveUpdatesContext.Provider value={subscribe}>{children}</LiveUpdatesContext.Provider>;
}

/**
 * Вызывает {@code onChange}, когда другой (или этот же) пользователь меняет объекты указанных типов.
 * Обработчик хранится в ref, поэтому его не нужно мемоизировать.
 */
export function useLiveUpdates(entities: EntityKey[], onChange: (change: EntityChange) => void) {
  const subscribe = useContext(LiveUpdatesContext);
  const handler = useRef(onChange);
  handler.current = onChange;
  const key = entities.join(',');

  useEffect(() => {
    if (!subscribe) {
      return undefined;
    }
    const watched = new Set(key.split(','));
    return subscribe((change) => {
      if (watched.has(change.entity)) {
        handler.current(change);
      }
    });
  }, [subscribe, key]);
}
