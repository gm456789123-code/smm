import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadModule } from './load-module.mjs';

function fixture(affectedRows = 1) {
  const calls = [];
  const { syncOrderStatuses } = loadModule('../lib/order-sync.ts', {
    '@/lib/db': { default: { query: async (sql, args) => { calls.push({ sql, args }); return [{ affectedRows }]; } } },
    '@/lib/smm-api': { getProviderApi: (provider) => ({ multiOrderStatus: async (ids) => {
      calls.push({ provider, ids });
      return Object.fromEntries(ids.map((id) => [id, { status: provider === 'km-social' ? 'Completed' : 'In progress', remains: '5' }]));
    } }) },
  });
  return { syncOrderStatuses, calls };
}

test('status sync excludes money ledger rows and isolates provider order IDs', async () => {
  const { syncOrderStatuses, calls } = fixture();
  const rows = [
    { id: 1, ref: '42', provider: 'km-social', tx_type: 'spend', tx_status: 'pending' },
    { id: 2, ref: '42', provider: '24social', tx_type: 'spend', tx_status: 'pending' },
    { id: 3, ref: 'payment', provider: null, tx_type: 'topup', tx_status: 'pending' },
    { id: 4, ref: 'refund:1', provider: null, tx_type: 'refund', tx_status: 'completed' },
  ];
  const result = await syncOrderStatuses(rows);
  assert.equal(result[0].tx_status, 'completed');
  assert.equal(result[1].tx_status, 'in_progress');
  assert.equal(result[2].tx_status, 'pending');
  assert.equal(calls.filter((call) => call.provider).length, 2);
  assert.equal(calls.some((call) => call.ids?.includes('payment')), false);
});

test('concurrent status changes are not overwritten by a delayed provider response', async () => {
  const { syncOrderStatuses, calls } = fixture(0);
  const [row] = await syncOrderStatuses([{ id: 1, ref: '42', provider: 'km-social', tx_type: 'spend', tx_status: 'pending' }]);
  assert.equal(row.tx_status, 'pending');
  assert.equal(row.sync_error, true);
  const update = calls.find((call) => call.sql);
  assert.match(update.sql, /tx_status = \?/);
  assert.equal(update.args.at(-1), 'pending');
});

test('terminal orders are not reverted by provider polling', async () => {
  const { syncOrderStatuses, calls } = fixture();
  await syncOrderStatuses([{ id: 1, ref: '42', provider: 'km-social', tx_type: 'spend', tx_status: 'cancelled' }]);
  assert.equal(calls.length, 0);
});
