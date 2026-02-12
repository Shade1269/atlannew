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

const themeIds = ['default', 'luxury', 'damascus'];

const shellSnippet =
  '<div dir="rtl" class="relative min-h-screen bg-[color:var(--bg)] text-[color:var(--fg)]" data-component="app-shell"><a href="#content" class="skip-to-content fixed top-2 right-4 z-[100] inline-flex items-center gap-2 rounded-full border border-[color:var(--glass-border)] bg-[color:var(--glass-bg)] px-4 py-2 text-sm font-medium text-[color:var(--glass-fg)] shadow-[var(--shadow-glass-soft)] transition-transform duratio';

const expectedSnapshots = {
  default: { admin: shellSnippet, marketer: shellSnippet },
  luxury: { admin: shellSnippet, marketer: shellSnippet },
  damascus: { admin: shellSnippet, marketer: shellSnippet },
};

test('home dashboards produce consistent snapshots per theme', async () => {
  ensureLocalStorage();
  const { AppShell } = await import('@/components/app-shell/AppShell');
  const { default: ThemeProvider } = await import('@/components/ThemeProvider');
  const { default: AdminHome } = await import('@/pages/home/AdminHome');
  const { default: MarketerHome } = await import('@/pages/home/MarketerHome');

  const adminProps = {
    roleOverride: 'admin',
    fastAuthOverride: {
      profile: { role: 'admin', full_name: 'مدير الاختبار' },
      user: { email: 'admin@example.com' },
      signOut: () => {},
    },
    userDataOverride: {
      userShop: { slug: 'demo-shop', total_orders: 12, total_products: 24 },
      userActivities: [],
      userStatistics: {
        revenueToday: 64000,
        revenueWeek: 402000,
        averageOrderValue: 720,
        pendingPayments: 6,
        dailyRevenue: [52000, 54800, 61200, 64000],
        systemAlerts: [],
        recentOrders: [],
      },
    },
  };

  const adminStatistics = {
    revenueToday: 64000,
    revenueWeek: 402000,
    averageOrderValue: 720,
    pendingPayments: 6,
    dailyRevenue: [52000, 54800, 61200, 64000],
  };
  const adminOrders = [
    { id: '9001', customer: 'عميل أ', total: '‎1٬840 ر.س', status: 'pending', createdAt: 'منذ 5 دقائق' },
    { id: '9000', customer: 'عميل ب', total: '‎920 ر.س', status: 'paid', createdAt: 'منذ 18 دقيقة' },
  ];
  const adminAlerts = [
    {
      id: 'alert-1',
      type: 'warning',
      title: 'تنبيه مخزون',
      description: 'منتج محدود الكمية.',
      timestamp: 'قبل دقائق',
    },
  ];

  const marketerProps = {
    roleOverride: 'affiliate',
    fastAuthOverride: {
      profile: { role: 'affiliate', full_name: 'مسوق الاختبار' },
      user: { email: 'affiliate@example.com' },
    },
    userDataOverride: {
      userShop: { slug: 'lux-atelier', total_orders: 54, total_products: 32 },
      userActivities: [],
      userStatistics: {
        affiliateSalesTotal: 162400,
        affiliateCommissionMonth: 13400,
        leaderboardRank: 2,
        leaderboardTotal: 22,
        dailyAffiliateRevenue: [8200, 9800, 11200, 14200],
        conversionRate: 5.4,
        averageAffiliateOrder: 910,
        sessionsThisWeek: 2640,
      },
    },
  };
  const marketerStatistics = {
    affiliateSalesTotal: 162400,
    affiliateCommissionMonth: 13400,
    leaderboardRank: 2,
    leaderboardTotal: 22,
    dailyAffiliateRevenue: [8200, 9800, 11200, 14200],
    conversionRate: 5.4,
    averageAffiliateOrder: 910,
    sessionsThisWeek: 2640,
  };

  const actual = {};

  for (const themeId of themeIds) {
    const adminMarkup = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/admin/dashboard'] },
        React.createElement(
          ThemeProvider,
          { defaultThemeId: themeId },
          React.createElement(
            AppShell,
            { ...adminProps },
            React.createElement(AdminHome, {
              statisticsOverride: adminStatistics,
              ordersOverride: adminOrders,
              alertsOverride: adminAlerts,
              nameOverride: 'مدير الاختبار',
            })
          )
        )
      )
    );

    const marketerMarkup = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/affiliate'] },
        React.createElement(
          ThemeProvider,
          { defaultThemeId: themeId },
          React.createElement(
            AppShell,
            { ...marketerProps },
            React.createElement(MarketerHome, {
              statisticsOverride: marketerStatistics,
              storeSlugOverride: 'lux-atelier',
              nameOverride: 'مسوق الاختبار',
            })
          )
        )
      )
    );

    actual[themeId] = {
      admin: sanitize(adminMarkup),
      marketer: sanitize(marketerMarkup),
    };
  }

  assert.deepEqual(actual, expectedSnapshots);
});
