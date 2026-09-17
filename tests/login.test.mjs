import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';

function loadLogin(rows = [], passwordMatches = false) {
  const calls = { queries: 0, comparisons: 0, failures: 0, cookies: 0 };
  const modules = {
    'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } },
    '@/lib/db': { default: { query: async () => { calls.queries++; return [rows]; } } },
    '@/lib/auth': {
      comparePassword: async () => { calls.comparisons++; return passwordMatches; },
      signToken: async () => 'test-token',
      setAuthCookie: () => { calls.cookies++; },
    },
    '@/lib/rate-limit': {
      getClientIp: () => '127.0.0.1',
      getLoginLockState: () => ({ locked: false }),
      checkRateLimit: () => ({ ok: true }),
      recordLoginFailure: () => { calls.failures++; },
      clearLoginFailures: () => {},
    },
  };
  const source = readFileSync(new URL('../app/api/auth/login/route.ts', import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
  const exports = {};
  new Function('require', 'exports', outputText)((id) => {
    assert.ok(id in modules, `Unexpected dependency: ${id}`);
    return modules[id];
  }, exports);
  return { post: exports.POST, calls };
}

test('invalid login bodies are rejected before database and password work', async () => {
  for (const body of [null, [], { login: {}, password: 'pass' }, { login: 'user', password: [] }, { login: ' ', password: 'pass' }, { login: 'a'.repeat(255), password: 'pass' }]) {
    const { post, calls } = loadLogin();
    assert.equal((await post({ json: async () => body })).status, 400);
    assert.equal(calls.queries, 0);
    assert.equal(calls.comparisons, 0);
  }
});

test('malformed JSON is a client error', async () => {
  const { post } = loadLogin();
  assert.equal((await post({ json: async () => { throw new SyntaxError('Bad JSON'); } })).status, 400);
});

test('missing account and wrong password return identical errors and both do password work', async () => {
  const missing = loadLogin();
  const wrong = loadLogin([{ id: 1, password_hash: 'hash' }]);
  const req = { json: async () => ({ login: 'tester', password: 'invalid' }) };
  assert.deepEqual(await missing.post(req), await wrong.post(req));
  for (const { calls } of [missing, wrong]) {
    assert.equal(calls.comparisons, 1);
    assert.equal(calls.failures, 1);
    assert.equal(calls.cookies, 0);
  }
});

test('valid login still issues an authenticated cookie', async () => {
  const { post, calls } = loadLogin([{ id: 1, username: 'tester', email: 'test@example.com', role: 'user', email_verified: 1, password_hash: 'hash' }], true);
  assert.equal((await post({ json: async () => ({ login: 'tester', password: 'valid-password' }) })).status, 200);
  assert.equal(calls.cookies, 1);
});

test('existing long passwords remain usable', async () => {
  const { post, calls } = loadLogin([{ id: 1, password_hash: 'hash' }], true);
  assert.equal((await post({ json: async () => ({ login: 'tester', password: 'x'.repeat(200) }) })).status, 200);
  assert.equal(calls.cookies, 1);
});
