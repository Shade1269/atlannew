import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const SW_PATH = new URL('../public/sw.js', import.meta.url);

const cacheStore = new Map();
let simulateOffline = false;

function keyFromRequest(request) {
  if (typeof request === 'string') return request;
  if (request instanceof Request) return request.url;
  return String(request);
}

const cachesMock = {
  async open(name) {
    if (!cacheStore.has(name)) {
      cacheStore.set(name, new Map());
    }
    const store = cacheStore.get(name);
    return {
      async match(request) {
        const key = keyFromRequest(request);
        const value = store.get(key);
        return value ? value.clone() : undefined;
      },
      async put(request, response) {
        store.set(keyFromRequest(request), response.clone());
      },
      async addAll(requests) {
        for (const entry of requests) {
          const response = await fetchStub(entry);
          store.set(keyFromRequest(entry), response.clone());
        }
      },
    };
  },
  async keys() {
    return [...cacheStore.keys()];
  },
  async delete(name) {
    return cacheStore.delete(name);
  },
};

const offlineResponse = new Response('<p>offline</p>', { status: 200, headers: { 'Content-Type': 'text/html' } });

async function fetchStub(request) {
  const url = typeof request === 'string' ? request : request.url;
  if (url.endsWith('/offline.html')) {
    return offlineResponse.clone();
  }
  if (simulateOffline) {
    throw new Error('network offline');
  }
  return new Response('ok', { status: 200 });
}

function createExtendableEvent() {
  let done;
  return {
    waitUntil(promise) {
      done = promise;
    },
    get complete() {
      return Promise.resolve(done);
    },
  };
}

function createFetchEvent(url, options = {}) {
  let resolver;
  const responsePromise = new Promise((resolve) => {
    resolver = resolve;
  });
  const request = new Request(url, { method: 'GET', ...options });
  return {
    request,
    respondWith(promise) {
      resolver(Promise.resolve(promise));
    },
    get response() {
      return responsePromise.then((value) => value);
    },
  };
}

test('service worker serves offline fallback when network fails', async () => {
  const swSource = await readFile(SW_PATH, 'utf8');
  const listeners = new Map();

  const selfContext = {
    addEventListener(type, handler) {
      listeners.set(type, handler);
    },
    skipWaiting() {},
    clients: { claim: () => Promise.resolve() },
    registration: { navigationPreload: { enable: () => Promise.resolve() } },
    location: { origin: 'https://example.com' },
  };

  vm.runInNewContext(swSource, {
    self: selfContext,
    caches: cachesMock,
    fetch: fetchStub,
    Response,
    Request,
    URL,
  });

  const installEvent = createExtendableEvent();
  listeners.get('install')(installEvent);
  await installEvent.complete;

  const activateEvent = createExtendableEvent();
  listeners.get('activate')(activateEvent);
  await activateEvent.complete;

  simulateOffline = true;
  const fetchEvent = createFetchEvent('https://example.com/checkout', {
    headers: { accept: 'text/html' },
  });
  listeners.get('fetch')(fetchEvent);
  const response = await fetchEvent.response;
  const body = await response.text();
  assert.match(body, /offline/i);
});
