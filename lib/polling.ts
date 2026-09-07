export function createPoller(
  task: (signal: AbortSignal) => Promise<void>,
  { intervalMs, timeoutMs = 20_000, paused: initiallyPaused = false }: { intervalMs: number; timeoutMs?: number; paused?: boolean },
) {
  let stopped = false;
  let paused = initiallyPaused;
  let running = false;
  let queued = false;
  let failures = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let controller: AbortController | undefined;

  function schedule(delay: number) {
    clearTimeout(timer);
    if (!stopped && !paused) timer = setTimeout(() => { void run(); }, delay);
  }

  async function run() {
    if (stopped || paused || running) return;
    running = true;
    queued = false;
    const current = new AbortController();
    controller = current;
    const timeout = setTimeout(() => current.abort(), timeoutMs);
    try {
      await task(current.signal);
      failures = 0;
    } catch {
      if (!paused && !stopped) failures = Math.min(failures + 1, 4);
    } finally {
      clearTimeout(timeout);
      running = false;
      controller = undefined;
      schedule(queued ? 0 : Math.min(intervalMs * 2 ** failures, 120_000));
    }
  }

  function refresh() {
    if (stopped || paused) return;
    if (running) queued = true;
    else schedule(0);
  }

  schedule(0);
  return {
    refresh,
    setPaused(value: boolean) {
      if (stopped || value === paused) return;
      paused = value;
      if (paused) { clearTimeout(timer); controller?.abort(); }
      else refresh();
    },
    stop() { stopped = true; clearTimeout(timer); controller?.abort(); },
  };
}
