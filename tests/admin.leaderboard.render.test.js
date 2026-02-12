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

test('admin leaderboard renders KPIs, trend chart, and tables', async () => {
  ensureLocalStorage();
  const { AppShell } = await import('@/components/app-shell/AppShell');
  const { default: ThemeProvider } = await import('@/components/ThemeProvider');
  const { default: AdminLeaderboardPage } = await import('@/pages/admin/AdminLeaderboard');

  const markup = renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      { initialEntries: ['/admin/leaderboard'] },
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
              userStatistics: {},
            },
          },
          React.createElement(AdminLeaderboardPage, null)
        )
      )
    )
  );

  assert.match(markup, /data-page="admin-leaderboard"/);
  assert.match(markup, /data-section="leaderboard-kpis"/);
  assert.match(markup, /data-section="leaderboard-trend"/);
  assert.match(markup, /data-chart="points-commission"/);
  assert.match(markup, /aria-label="أفضل المسوّقات بحسب النقاط"/);
  assert.match(markup, /aria-label="أفضل المسوّقات بحسب العمولات"/);
});
