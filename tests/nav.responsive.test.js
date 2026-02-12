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
  userStatistics: {
    pendingOrders: 8,
    revenueToday: 45200,
    activeAffiliates: 36,
    conversionsToday: 12,
    commissionToday: 2450,
    clickRate: 3.4,
  },
};

test('app shell renders responsive navigation containers', async () => {
  mockRole = 'admin';
  const { AppShell } = await import('@/components/app-shell/AppShell');
  const { default: ThemeProvider } = await import('@/components/ThemeProvider');

  const markup = renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      { initialEntries: ['/admin/dashboard'] },
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
          React.createElement('div', null, 'Dashboard')
        )
      )
    )
  );

  assert.match(markup, /data-component="bottom-nav-mobile"/);
  assert.match(markup, /md:hidden/);
  assert.match(markup, /data-component="sidebar-desktop"/);
  assert.match(markup, /lg:flex/);
});
