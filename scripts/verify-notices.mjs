// Run against `next dev --hostname 127.0.0.1 --port 3100` and an isolated
// headless Chrome with --remote-debugging-port=9333. No real API writes.
import assert from 'node:assert/strict';

const target = await (await fetch('http://127.0.0.1:9333/json/new?about:blank', { method: 'PUT' })).json();
assert.ok(target, 'Start an isolated Chrome debugging session first.');
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
let nextId = 0;
const pending = new Map();
function send(method, params = {}) {
  const id = ++nextId;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Timed out: ${method}`)); }, 45000);
    pending.set(id, { resolve, reject, timer });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
let message = 'Browser test announcement';
let responseStatus = 200;
let responseDelay = 0;
socket.onmessage = async ({ data }) => {
  const event = JSON.parse(data);
  if (event.id) {
    const request = pending.get(event.id);
    if (!request) return;
    clearTimeout(request.timer);
    pending.delete(event.id);
    if (event.error) request.reject(new Error(event.error.message));
    else request.resolve(event.result);
  } else if (event.method === 'Fetch.requestPaused') {
    if (responseDelay) await new Promise((resolve) => setTimeout(resolve, responseDelay));
    await send('Fetch.fulfillRequest', {
      requestId: event.params.requestId,
      responseCode: responseStatus,
      responseHeaders: [{ name: 'Content-Type', value: 'application/json' }],
      body: Buffer.from(JSON.stringify({ active: '1', text: message })).toString('base64'),
    });
  }
};
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}
async function until(expression) {
  const deadline = Date.now() + 45000;
  while (Date.now() < deadline) {
    if (await evaluate(`Boolean(${expression})`)) return;
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(`Condition not met: ${expression}`);
}
const dialog = "document.querySelector('dialog[open]')";
const pdpa = "document.querySelector('[aria-labelledby=\"pdpa-title\"]')";
try {
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Storage.clearDataForOrigin', { origin: 'http://127.0.0.1:3100', storageTypes: 'local_storage' });
  await send('Fetch.enable', { patterns: [{ urlPattern: '*/api/announcement' }] });
  await send('Page.navigate', { url: 'http://127.0.0.1:3100/login' });
  await until(dialog);
  assert.equal(await evaluate(`!!${pdpa}`), false, 'PDPA must wait for the announcement');
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await until(pdpa);
  assert.equal(await evaluate(`!!${dialog}`), false);
  await evaluate(`${pdpa}.querySelector('button.pg-btn-primary').click()`);
  await until(`!${pdpa}`);
  assert.equal(await evaluate("localStorage.getItem('pdpa_consent')"), '1');
  await send('Page.reload');
  await until("document.readyState === 'complete' && document.querySelector('input')");
  await new Promise((resolve) => setTimeout(resolve, 1500));
  assert.equal(await evaluate(`!!${dialog} || !!${pdpa}`), false, 'Dismissal and acceptance survive reload');
  message = 'Updated browser test announcement';
  await send('Page.reload');
  await until(dialog);
  assert.equal(await evaluate(`${dialog}.textContent.includes('Updated browser test announcement')`), true);
  console.log('PASS: announcement ordering, Escape, consent persistence, and new announcements');

  await send('Page.addScriptToEvaluateOnNewDocument', { source: `
    Storage.prototype.getItem = function () { throw new Error('storage blocked'); };
    Storage.prototype.setItem = function () { throw new Error('storage blocked'); };
  ` });
  await send('Page.reload');
  await until(dialog);
  await evaluate(`${dialog}.querySelector('button').click()`);
  await until(pdpa);
  await evaluate(`${pdpa}.querySelector('button.pg-btn-primary').click()`);
  await until(`!${pdpa}`);
  responseStatus = 503;
  await send('Page.reload');
  await until(pdpa);
  assert.equal(await evaluate(`!!${dialog}`), false);
  console.log('PASS: blocked storage and failed announcement API do not block PDPA');
  responseStatus = 200;
  responseDelay = 1000;
  // Next.js synchronizes native history changes with usePathname.
  await evaluate("history.pushState({}, '', '/privacy')");
  await until(pdpa);
  await evaluate("history.pushState({}, '', '/login')");
  await new Promise((resolve) => setTimeout(resolve, 200));
  assert.equal(await evaluate(`!!${pdpa}`), false, 'PDPA waits for the new route announcement request');
  await until(dialog);
  assert.equal(await evaluate(`!!${pdpa}`), false);
  console.log('PASS: client navigation restores announcement-before-PDPA ordering');
} finally {
  await send('Fetch.disable');
  socket.close();
  await fetch(`http://127.0.0.1:9333/json/close/${target.id}`);
}
