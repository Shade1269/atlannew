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

test('admin home renders KPI cards and orders overview', async () => {
  ensureLocalStorage();
  const { AppShell } = await import('@/components/app-shell/AppShell');
  const { default: ThemeProvider } = await import('@/components/ThemeProvider');
  const { default: AdminHome } = await import('@/pages/home/AdminHome');

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
              profile: { role: 'admin', full_name: 'مدير اختبار' },
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
              },
            },
          },
          React.createElement(AdminHome, {
            statisticsOverride: {
              revenueToday: 64000,
              revenueWeek: 402000,
              averageOrderValue: 720,
              pendingPayments: 6,
              dailyRevenue: [52000, 54800, 61200, 64000],
            },
            ordersOverride: [
              { id: '9001', customer: 'عميل تجريبي', total: '‎1٬840 ر.س', status: 'pending', createdAt: 'منذ 5 دقائق' },
            ],
            alertsOverride: [
              {
                id: 'alert-test',
                type: 'info',
                title: 'تنبيه اختباري',
                description: 'تم التحقق من التكوين بنجاح.',
                timestamp: 'الآن',
              },
            ],
            nameOverride: 'مدير اختبار',
          })
        )
      )
    )
  );

  const kpiMatches = markup.match(/data-component="kpi-card"/g) ?? [];
  assert.ok(kpiMatches.length >= 4, 'expected at least four KPI cards');
  assert.match(markup, /آخر 5 طلبات/);
  assert.match(markup, /تنبيهات النظام/);
});
