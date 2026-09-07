'use client';

import { useCallback, useEffect, useRef } from 'react';
import { createPoller } from '@/lib/polling';

export function useLiveRefresh(task: (signal: AbortSignal) => Promise<void>, intervalMs: number) {
  const pollerRef = useRef<ReturnType<typeof createPoller> | null>(null);
  useEffect(() => {
    const isPaused = () => document.hidden || !navigator.onLine;
    const poller = createPoller(task, { intervalMs, paused: isPaused() });
    pollerRef.current = poller;
    const update = () => poller.setPaused(isPaused());
    const refresh = () => { update(); poller.refresh(); };
    document.addEventListener('visibilitychange', update);
    window.addEventListener('online', refresh);
    window.addEventListener('offline', update);
    window.addEventListener('focus', refresh);
    window.addEventListener('smm-data-changed', refresh);
    return () => {
      poller.stop();
      pollerRef.current = null;
      document.removeEventListener('visibilitychange', update);
      window.removeEventListener('online', refresh);
      window.removeEventListener('offline', update);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('smm-data-changed', refresh);
    };
  }, [task, intervalMs]);
  return useCallback(() => pollerRef.current?.refresh(), []);
}
