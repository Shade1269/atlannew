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

const sanitize = (html) => html.replace(/\s+/g, ' ').trim().slice(0, 420);
const shellPrefix =
  '<div dir="rtl" class="relative min-h-screen bg-[color:var(--bg)] text-[color:var(--fg)]" data-component="app-shell"><a href="#content" class="skip-to-content fixed top-2 right-4 z-[100] inline-flex items-center gap-2 rounded-full border border-[color:var(--glass-border)] bg-[color:var(--glass-bg)] px-4 py-2 text-sm font-medium text-[color:var(--glass-fg)] shadow-[var(--shadow-glass-soft)] transition-transform';
const themeIds = ['default', 'luxury', 'damascus'];

const resetStores = async () => {
  const { createAdminAnalyticsStore } = await import('@/hooks/useAdminAnalytics');
  const { createAdminLeaderboardStore } = await import('@/hooks/useAdminLeaderboard');
  const { createAdminOrdersStore } = await import('@/hooks/useAdminOrders');
  const { createAdminCustomersStore } = await import('@/hooks/useAdminCustomers');

  createAdminAnalyticsStore('default').reset();
  createAdminLeaderboardStore('default').reset();
  const ordersStore = createAdminOrdersStore('default');
  ordersStore.reset();
  const customersStore = createAdminCustomersStore('default');
  customersStore.reset();
  await new Promise((resolve) => setTimeout(resolve, 220));
};

test('admin core pages render stable glass shells across themes', async () => {
  ensureLocalStorage();
  const { AppShell } = await import('@/components/app-shell/AppShell');
  const { default: ThemeProvider } = await import('@/components/ThemeProvider');
  const { default: AdminAnalyticsPage } = await import('@/pages/admin/AdminAnalytics');
  const { default: AdminLeaderboardPage } = await import('@/pages/admin/AdminLeaderboard');
  const { default: AdminOrdersPage } = await import('@/pages/admin/AdminOrders');
  const { default: AdminCustomersPage } = await import('@/pages/admin/AdminCustomers');

  const shellProps = {
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
  };

  for (const themeId of themeIds) {
    await resetStores();
    const analyticsMarkup = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/admin/analytics'] },
        React.createElement(
          ThemeProvider,
          { defaultThemeId: themeId },
          React.createElement(AppShell, shellProps, React.createElement(AdminAnalyticsPage, null))
        )
      )
    );

    const leaderboardMarkup = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/admin/leaderboard'] },
        React.createElement(
          ThemeProvider,
          { defaultThemeId: themeId },
          React.createElement(AppShell, shellProps, React.createElement(AdminLeaderboardPage, null))
        )
      )
    );

    const ordersMarkup = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/admin/orders'] },
        React.createElement(
          ThemeProvider,
          { defaultThemeId: themeId },
          React.createElement(AppShell, shellProps, React.createElement(AdminOrdersPage, null))
        )
      )
    );

    const customersMarkup = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/admin/customers'] },
        React.createElement(
          ThemeProvider,
          { defaultThemeId: themeId },
          React.createElement(AppShell, shellProps, React.createElement(AdminCustomersPage, null))
        )
      )
    );

    const analyticsSanitized = sanitize(analyticsMarkup);
    const ordersSanitized = sanitize(ordersMarkup);
    const customersSanitized = sanitize(customersMarkup);

    const leaderboardSanitized = sanitize(leaderboardMarkup);

    assert.ok(analyticsSanitized.startsWith(shellPrefix), `analytics shell prefix matches for ${themeId}`);
    assert.ok(leaderboardSanitized.startsWith(shellPrefix), `leaderboard shell prefix matches for ${themeId}`);
    assert.ok(ordersSanitized.startsWith(shellPrefix), `orders shell prefix matches for ${themeId}`);
    assert.ok(customersSanitized.startsWith(shellPrefix), `customers shell prefix matches for ${themeId}`);
    assert.match(analyticsMarkup, /data-page="admin-analytics"/);
    assert.match(leaderboardMarkup, /data-page="admin-leaderboard"/);
    assert.match(ordersMarkup, /data-section="orders-table"/);
    assert.match(customersMarkup, /data-section="customers-table"/);
  }
});
