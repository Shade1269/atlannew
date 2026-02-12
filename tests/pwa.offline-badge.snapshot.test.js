import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => {
      store.set(key, String(value));
    },
    removeItem: (key) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
}

test('AppShell renders offline indicator when navigator is offline', async () => {
  const previousNavigator = global.navigator;
  global.navigator = {
    onLine: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  };

  const { AppShell } = await import('@/components/app-shell/AppShell');
  const { default: ThemeProvider } = await import('@/components/ThemeProvider');

  const markup = renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      { initialEntries: ['/admin/dashboard'] },
      React.createElement(
        ThemeProvider,
        null,
        React.createElement(
          AppShell,
          {
            roleOverride: 'admin',
            fastAuthOverride: {
              profile: { role: 'admin', full_name: 'مدير الاختبار' },
              user: { email: 'demo@anaqti.sa' },
              signOut: () => {},
            },
            userDataOverride: {
              userShop: { total_orders: 0, total_products: 0 },
              userActivities: [],
              userStatistics: {},
            },
          },
          React.createElement('div', null, 'dashboard')
        )
      )
    )
  );

  assert.match(markup, /data-testid="header-offline-indicator"/);

  global.navigator = previousNavigator;
});
