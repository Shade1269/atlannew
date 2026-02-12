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

let mockRole = 'admin';

const mockUserData = {
  userShop: { slug: 'demo-shop', total_orders: 8, total_products: 12 },
  userActivities: new Array(3).fill({}),
  userStatistics: {},
};

test('admin sidebar highlights the active route', async () => {
  mockRole = 'admin';
  const { AppShell } = await import('@/components/app-shell/AppShell');
  const { default: ThemeProvider } = await import('@/components/ThemeProvider');
  const markup = renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      { initialEntries: ['/admin/orders'] },
      React.createElement(
        ThemeProvider,
        { defaultThemeId: 'default' },
        React.createElement(
          AppShell,
          {
            roleOverride: 'admin',
            fastAuthOverride: {
              profile: { role: mockRole, full_name: 'مدير الاختبار', email: 'demo@anaqti.sa' },
              user: { email: 'demo@anaqti.sa' },
              signOut: () => {},
            },
            userDataOverride: mockUserData,
          },
          React.createElement('div', null, 'Orders')
        )
      )
    )
  );

  const adminPattern = /<a[^>]*(?:href="\/admin\/orders"[^>]*aria-current="page"|aria-current="page"[^>]*href="\/admin\/orders")[^>]*>/;
  assert.match(markup, adminPattern);
});

test('affiliate navigation tracks active state across groups', async () => {
  mockRole = 'affiliate';
  const { AppShell } = await import('@/components/app-shell/AppShell');
  const { default: ThemeProvider } = await import('@/components/ThemeProvider');
  const markup = renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      { initialEntries: ['/affiliate/orders'] },
      React.createElement(
        ThemeProvider,
        { defaultThemeId: 'default' },
        React.createElement(
          AppShell,
          {
            roleOverride: 'affiliate',
            fastAuthOverride: {
              profile: { role: mockRole, full_name: 'مسوق الاختبار', email: 'demo@anaqti.sa' },
              user: { email: 'demo@anaqti.sa' },
              signOut: () => {},
            },
            userDataOverride: mockUserData,
          },
          React.createElement('div', null, 'Affiliate Orders')
        )
      )
    )
  );

  const affiliateSidebarPattern = /<a[^>]*(?:href="\/affiliate\/orders"[^>]*aria-current="page"|aria-current="page"[^>]*href="\/affiliate\/orders")[^>]*>/;
  assert.match(markup, affiliateSidebarPattern);
  const mobilePattern = /data-component="bottom-nav-mobile"[\s\S]*<a[^>]*(?:href="\/affiliate"[^>]*aria-current="page"|aria-current="page"[^>]*href="\/affiliate")[^>]*>/;
  assert.match(markup, mobilePattern);
});
