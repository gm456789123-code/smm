import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadModule, nextResponse } from './load-module.mjs';

function refundFixture(overrides = {}) {
  const row = { id: 7, user_id: 2, amount: 100, tx_status: 'pending', tx_type: 'spend', note: '', ...overrides };
  const state = { credited: 0, ledger: false };
  let lock = Promise.resolve();
  function read(sql) { return [[{ ...row, note: sql.includes('note') ? row.note : undefined }]]; }
  const db = {
    query: async (sql) => read(sql),
    getConnection: async () => {
      let unlock;
      let snapshot;
      return {
        beginTransaction: async () => {},
        query: async (sql, values) => {
          if (sql.includes('FOR UPDATE') && !unlock) {
            const prior = lock;
            lock = new Promise((resolve) => { unlock = resolve; });
            await prior;
            snapshot = { ...state, note: row.note, status: row.tx_status };
          }
          if (sql.startsWith('SELECT') && sql.includes('WHERE ref')) return [state.ledger ? [{ id: 99 }] : []];
          if (sql.startsWith('SELECT')) return read(sql);
          if (sql.startsWith('INSERT INTO transactions')) {
            if (state.ledger) throw Object.assign(new Error('duplicate'), { code: 'ER_DUP_ENTRY' });
            state.ledger = true;
          }
          if (sql.startsWith('UPDATE users')) state.credited += Number(values[0]);
          if (sql.startsWith('UPDATE transactions')) { row.tx_status = 'cancelled'; row.note += ' [คืนเงินแล้ว]'; }
          return [{ affectedRows: 1 }];
        },
        commit: async () => { unlock?.(); unlock = undefined; },
        rollback: async () => {
          if (snapshot) { state.credited = snapshot.credited; state.ledger = snapshot.ledger; row.note = snapshot.note; row.tx_status = snapshot.status; }
          unlock?.(); unlock = undefined;
        },
        release: () => { unlock?.(); },
      };
    },
  };
  const handlers = loadModule('../app/api/admin/orders/route.ts', {
    'next/server': nextResponse,
    '@/lib/auth': { getRequestUser: async () => ({ userId: 1, role: 'admin' }) },
    '@/lib/db': { default: db },
    '@/lib/order-sync': {},
    '@/lib/rate-limit': {},
  });
  const refund = () => handlers.POST({ json: async () => ({ action: 'refund', id: 7 }) });
  return { refund, state };
}

test('concurrent refund requests credit only once and write a refund ledger record', async () => {
  const { refund, state } = refundFixture();
  const results = await Promise.all([refund(), refund()]);
  assert.equal(results.filter((result) => result.status === 200).length, 1);
  assert.equal(state.credited, 100);
  assert.equal(state.ledger, true);
});

test('legacy refunded notes prevent another credit', async () => {
  const { refund, state } = refundFixture({ note: 'Order [คืนเงินแล้ว ฿100 โดยแอดมิน]' });
  assert.notEqual((await refund()).status, 200);
  assert.equal(state.credited, 0);
});

test('topups cannot be refunded through the order refund action', async () => {
  const { refund, state } = refundFixture({ tx_type: 'topup' });
  assert.notEqual((await refund()).status, 200);
  assert.equal(state.credited, 0);
});
