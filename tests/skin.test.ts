import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadMinecraftSkin } from '../src/lib/minecraftSkin.ts';
import { FALLBACK_SKIN_ENDPOINT } from '../src/config/site.ts';

test('failed skin can retry; slow requests are shared and readiness waits for decoding', async context => {
  const windowDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const imageDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'Image');
  let finishDecode: () => void = () => {};
  const decoded = new Promise<void>(resolve => { finishDecode = resolve; });
  class TestImage {
    width = 64;
    height = 64;
    src = '';
    decode() { return decoded; }
  }
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { setTimeout, clearTimeout } });
  Object.defineProperty(globalThis, 'Image', { configurable: true, value: TestImage });
  let requests = 0;
  context.mock.method(globalThis, 'fetch', async (url: string, options: RequestInit) => {
    requests++;
    assert.equal(url, FALLBACK_SKIN_ENDPOINT);
    assert.equal(options.cache, 'default');
    assert.ok(options.signal instanceof AbortSignal);
    return requests === 1 ? new Response('', { status: 503 }) : new Response(new Blob(['test-only texture bytes']));
  });
  try {
    await assert.rejects(loadMinecraftSkin(), /503/);
    const firstRetry = loadMinecraftSkin();
    const secondRetry = loadMinecraftSkin();
    assert.equal(firstRetry, secondRetry);
    let ready = false;
    void firstRetry.then(() => { ready = true; });
    await new Promise(resolve => setTimeout(resolve, 25));
    assert.equal(ready, false, 'the model must wait for the skin decoder');
    finishDecode();
    const image = await firstRetry;
    assert.equal(image.width, 64);
    assert.equal(requests, 2);
    assert.equal(await loadMinecraftSkin(), image);
    assert.equal(requests, 2, 'reuse the successful session texture without refetching');
  } finally {
    if (windowDescriptor) Object.defineProperty(globalThis, 'window', windowDescriptor);
    else Reflect.deleteProperty(globalThis, 'window');
    if (imageDescriptor) Object.defineProperty(globalThis, 'Image', imageDescriptor);
    else Reflect.deleteProperty(globalThis, 'Image');
  }
});
