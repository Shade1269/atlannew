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

test('marketer home shows performance cards and quick actions', async () => {
  ensureLocalStorage();
  const { AppShell } = await import('@/components/app-shell/AppShell');
  const { default: ThemeProvider } = await import('@/components/ThemeProvider');
  const { default: MarketerHome } = await import('@/pages/home/MarketerHome');

  const markup = renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      { initialEntries: ['/affiliate'] },
      React.createElement(
        ThemeProvider,
        { defaultThemeId: 'luxury' },
        React.createElement(
          AppShell,
          {
            roleOverride: 'affiliate',
            fastAuthOverride: {
              profile: { role: 'affiliate', full_name: 'مسوق اختبار' },
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
          },
          React.createElement(MarketerHome, {
            statisticsOverride: {
              affiliateSalesTotal: 162400,
              affiliateCommissionMonth: 13400,
              leaderboardRank: 2,
              leaderboardTotal: 22,
              dailyAffiliateRevenue: [8200, 9800, 11200, 14200],
              conversionRate: 5.4,
              averageAffiliateOrder: 910,
              sessionsThisWeek: 2640,
            },
            storeSlugOverride: 'lux-atelier',
            nameOverride: 'مسوق اختبار',
          })
        )
      )
    )
  );

  const kpiMatches = markup.match(/data-component="kpi-card"/g) ?? [];
  assert.ok(kpiMatches.length >= 3, 'expected at least three KPI cards');
  assert.match(markup, /روابط سريعة/);
  assert.match(markup, /زر مشاركة المتجر/);
  assert.match(markup, /جاري تجهيز الرسم البياني/);
});
