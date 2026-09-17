import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

export function loadModule(path, modules) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const exports = {};
  new Function('require', 'exports', outputText)((id) => {
    assert.ok(id in modules, `Unexpected dependency: ${id}`);
    return modules[id];
  }, exports);
  return exports;
}

export const nextResponse = { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } };
