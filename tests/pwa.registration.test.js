import test from 'node:test';
import assert from 'node:assert/strict';

const originalWindow = global.window;
const originalNavigator = global.navigator;
const originalDocument = global.document;

test('registerServiceWorker registers sw when supported', async () => {
  const listeners = new Map();
  global.window = {
    addEventListener(type, handler) {
      listeners.set(type, handler);
    },
    removeEventListener() {},
    dispatchEvent() {},
  };

  const registerCalls = [];
  global.navigator = {
    serviceWorker: {
      async register(path) {
        registerCalls.push(path);
        return {
          waiting: null,
          addEventListener() {},
        };
      },
      getRegistrations: () => Promise.resolve([]),
    },
  };

  global.document = { readyState: 'complete' };

  const { registerServiceWorker } = await import('@/pwa/registerServiceWorker');
  registerServiceWorker();
  await Promise.resolve();

  assert.deepEqual(registerCalls, ['/sw.js']);

  global.window = originalWindow;
  global.navigator = originalNavigator;
  global.document = originalDocument;
});
