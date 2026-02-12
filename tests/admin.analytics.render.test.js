import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

const ensureLocalStorage = () => {
  if (typeof globalThis.localStorage !== 'undefined') return;
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
};

test('admin analytics renders metrics and trend widgets', async () => {
  ensureLocalStorage();
  const { AppShell } = await import('@/components/app-shell/AppShell');
  const { default: ThemeProvider } = await import('@/components/ThemeProvider');
  const { default: AdminAnalyticsPage } = await import('@/pages/admin/AdminAnalytics');

  const markup = renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      { initialEntries: ['/admin/analytics'] },
      React.createElement(
        ThemeProvider,
        { defaultThemeId: 'default' },
        React.createElement(
          AppShell,
          {
            roleOverride: 'admin',
            fastAuthOverride: {
              profile: { id: 'admin-001', role: 'admin', full_name: 'مدير الاختبار' },
              user: { email: 'admin@example.com' },
              signOut: () => {},
            },
            userDataOverride: {
              userShop: { slug: 'demo-shop', total_orders: 18, total_products: 42 },
              userActivities: [],
              userStatistics: {
                revenueToday: 64500,
                revenueWeek: 412800,
                revenueMonth: 1689000,
                ordersPending: 3,
              },
            },
          },
          React.createElement(AdminAnalyticsPage, null)
        )
      )
    )
  );

  assert.match(markup, /data-page="admin-analytics"/);
  assert.match(markup, /data-section="metrics-grid"/);
  assert.match(markup, /تدفق الطلبات/);
  assert.match(markup, /أفضل المنتجات أداءً/);
  assert.match(markup, /أفضل المسوقات/);
});
