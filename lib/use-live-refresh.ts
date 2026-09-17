'use client';

import { useEffect, useRef, useCallback } from 'react';

export function useLiveRefresh(
  callback: (signal: AbortSignal) => Promise<void>,
  intervalMs = 20_000
) {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  const abortControllerRef = useRef<AbortController | null>(null);

  const trigger = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const ac = new AbortController();
    abortControllerRef.current = ac;

    cbRef.current(ac.signal).catch((err) => {
      if (err?.name !== 'AbortError' && !ac.signal.aborted) {
        // silent catch or handled inside callback
      }
    });
  }, []);

  useEffect(() => {
    trigger();

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        trigger();
      }
    }, intervalMs);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        trigger();
      }
    };

    const onDataChanged = () => {
      trigger();
    };

    window.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onVisibilityChange);
    window.addEventListener('smm-data-changed', onDataChanged);

    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onVisibilityChange);
      window.removeEventListener('smm-data-changed', onDataChanged);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [trigger, intervalMs]);

  return trigger;
}
