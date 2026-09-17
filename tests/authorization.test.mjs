import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadModule, nextResponse } from './load-module.mjs';

for (const [route, methods] of [['orders', ['GET', 'POST']], ['refill', ['GET', 'POST']], ['cancel', ['POST']]]) {
  test(`regular users cannot access raw provider ${route}`, async () => {
    const handlers = loadModule(`../app/api/smm/${route}/route.ts`, {
      'next/server': nextResponse,
      '@/lib/auth': { getRequestUser: async () => ({ userId: 1, role: 'user' }) },
      '@/lib/smm-api': { getProviderApi: () => { assert.fail('Provider must never be called'); } },
    });
    for (const method of methods) {
      assert.equal((await handlers[method]({})).status, 403);
    }
  });
}

function authWithAccount(account) {
  return loadModule('../lib/auth.ts', {
    bcryptjs: {}, crypto: {},
    '@/lib/jwt': { verifyToken: async () => ({ userId: 1, username: 'old', email: 'old@example.com', role: 'admin', emailVerified: true }) },
    '@/lib/db': { default: { query: async () => [account ? [account] : []] } },
  });
}

test('deleted accounts cannot keep using an unexpired token', async () => {
  assert.equal(await authWithAccount(null).getUserFromToken('token'), null);
});

test('role changes take effect before token expiry', async () => {
  const user = await authWithAccount({ id: 1, username: 'tester', email: 'test@example.com', role: 'user', email_verified: 1 }).getUserFromToken('token');
  assert.equal(user.role, 'user');
  assert.equal(user.username, 'tester');
});
