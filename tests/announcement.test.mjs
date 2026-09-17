import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';

function loadAnnouncement(query) {
  const modules = {
    'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } },
    '@/lib/db': { default: { query } },
  };
  const source = readFileSync(new URL('../app/api/announcement/route.ts', import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
  const exports = {};
  new Function('require', 'exports', outputText)((id) => {
    assert.ok(id in modules, `Unexpected dependency: ${id}`);
    return modules[id];
  }, exports);
  return exports.GET;
}

test('database outage never becomes an active refund announcement', async () => {
  const get = loadAnnouncement(async () => { throw new Error('offline'); });
  assert.deepEqual(await get(), { body: { text: '', active: '0' }, status: 503 });
});

test('administrator can turn announcements off', async () => {
  const get = loadAnnouncement(async () => [[{ setting_key: 'announcement_active', setting_value: '0' }, { setting_key: 'announcement_text', setting_value: 'Maintenance' }]]);
  assert.deepEqual(await get(), { body: { text: 'Maintenance', active: '0' }, status: 200 });
});

test('enabled announcement returns the configured text', async () => {
  const get = loadAnnouncement(async () => [[{ setting_key: 'announcement_active', setting_value: '1' }, { setting_key: 'announcement_text', setting_value: 'Updated notice' }]]);
  assert.deepEqual(await get(), { body: { text: 'Updated notice', active: '1' }, status: 200 });
});
