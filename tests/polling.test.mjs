import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadModule } from './load-module.mjs';
const settle = () => new Promise(setImmediate);

test('polling never overlaps and queues one immediate refresh', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { createPoller } = loadModule('../lib/polling.ts', {});
  let calls = 0;
  let release;
  const poller = createPoller(async () => { calls++; await new Promise((resolve) => { release = resolve; }); }, { intervalMs: 100 });
  t.mock.timers.tick(0);
  await settle();
  poller.refresh(); poller.refresh();
  t.mock.timers.tick(1000);
  assert.equal(calls, 1);
  release(); await settle(); t.mock.timers.tick(0); await settle();
  assert.equal(calls, 2);
  poller.stop(); release();
});

test('hidden/offline pause aborts requests and resume refreshes immediately', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { createPoller } = loadModule('../lib/polling.ts', {});
  let calls = 0;
  let signal;
  const poller = createPoller(async (current) => { calls++; signal = current; }, { intervalMs: 100 });
  t.mock.timers.tick(0); await settle();
  poller.setPaused(true);
  t.mock.timers.tick(1000); await settle();
  assert.equal(calls, 1);
  poller.setPaused(false);
  t.mock.timers.tick(0); await settle();
  assert.equal(calls, 2);
  poller.stop();
  assert.ok(signal);
  t.mock.timers.tick(1000); await settle();
  assert.equal(calls, 2);
});

test('failures back off before retrying and stopping cancels pending retries', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { createPoller } = loadModule('../lib/polling.ts', {});
  let calls = 0;
  const poller = createPoller(async () => { calls++; throw new Error('offline'); }, { intervalMs: 100 });
  t.mock.timers.tick(0); await settle();
  t.mock.timers.tick(199); await settle(); assert.equal(calls, 1);
  t.mock.timers.tick(1); await settle(); assert.equal(calls, 2);
  poller.stop(); t.mock.timers.tick(10000); await settle(); assert.equal(calls, 2);
});
