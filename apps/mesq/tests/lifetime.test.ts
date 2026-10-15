import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { ExperienceScope } from '../lib/mesq/lifetime.ts';

const saved = new Map<string, PropertyDescriptor | undefined>();
const scheduled: (() => void)[] = [];
const cancelled: number[] = [];
let nextId = 0;
let disconnected = 0;
let removed = 0;

function replaceGlobal(name: string, value: unknown) {
  saved.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
  Object.defineProperty(globalThis, name, { value, configurable: true });
}

beforeEach(() => {
  scheduled.length = cancelled.length = nextId = disconnected = removed = 0;
  const schedule = (callback: () => void) => { scheduled.push(callback); return ++nextId; };
  replaceGlobal('window', {
    setTimeout: schedule, setInterval: schedule,
    requestAnimationFrame: (callback: FrameRequestCallback) => schedule(() => callback(10)),
    requestIdleCallback: (callback: IdleRequestCallback) => schedule(() => callback({ didTimeout: false, timeRemaining: () => 10 })),
    clearTimeout: (id: number) => cancelled.push(id), clearInterval: (id: number) => cancelled.push(id),
    cancelAnimationFrame: (id: number) => cancelled.push(id), cancelIdleCallback: (id: number) => cancelled.push(id),
  });
  replaceGlobal('ResizeObserver', class { disconnect() { disconnected++; } });
  replaceGlobal('document', { createElement: () => ({ remove: () => removed++ }) });
});

afterEach(() => {
  for (const [name, descriptor] of saved) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else Reflect.deleteProperty(globalThis, name);
  }
  saved.clear();
});

test('unmount cancels scene work while preserving unrelated browser listeners', async () => {
  const scope = new ExperienceScope();
  const target = new EventTarget();
  let sceneCalls = 0, otherCalls = 0;
  const callback = () => sceneCalls++;
  target.addEventListener('click', () => otherCalls++);
  scope.listen(target, 'click', callback);
  scope.timeout(callback, 50); scope.interval(callback, 50);
  scope.frame(callback); scope.idle(callback); scope.resizeObserver(callback); scope.element('div');
  target.dispatchEvent(new Event('click'));
  assert.equal(sceneCalls, 1);
  await scope.dispose();
  await scope.whenAborted;
  target.dispatchEvent(new Event('click'));
  scheduled.forEach(run => run());
  assert.equal(sceneCalls, 1);
  assert.equal(otherCalls, 2);
  assert.equal(cancelled.length, 4);
  assert.equal(disconnected, 1);
  assert.equal(removed, 1);
  assert.throws(() => scope.element('div'), { name: 'AbortError' });
  assert.equal(scope.timeout(callback), -1);
});

test('cleanup is reversed, idempotent and includes resources finishing after abort', async () => {
  const scope = new ExperienceScope();
  const order: string[] = [];
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  scope.defer(() => { order.push('page'); });
  scope.defer(async () => { await pending; order.push('renderer'); });
  const first = scope.dispose();
  assert.equal(scope.dispose(), first);
  scope.defer(() => { order.push('late texture'); });
  let finished = false;
  const complete = scope.dispose().then(() => { finished = true; });
  await Promise.resolve();
  assert.equal(finished, false);
  release();
  await complete;
  await scope.dispose();
  assert.deepEqual(order, ['renderer', 'page', 'late texture']);
});
