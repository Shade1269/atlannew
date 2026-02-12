import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

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

const sanitize = (html) => html.replace(/\s+/g, ' ').trim();

const mockHookValue = {
  notifications: [
    {
      id: 'notif-1',
      title: 'طلب جديد',
      message: 'تم إنشاء طلب جديد بقيمة 540 ر.س',
      type: 'order',
      timestamp: 'قبل دقيقة',
      read: false,
    },
  ],
  activity: [
    {
      id: 'activity-1',
      title: 'تم تحديث المخزون',
      description: 'جرى تحديث مخزون العطور الفاخرة.',
      icon: 'store',
      timestamp: 'اليوم 09:12 ص',
    },
  ],
  unreadCount: 1,
  page: 1,
  markAsRead: () => {},
  clear: () => {},
  loadMore: () => {},
};

test('notifications center keeps layout consistent for each theme', async () => {
  ensureLocalStorage();
  const { NotificationsPageBody } = await import('@/pages/notifications');
  const { default: ThemeProvider } = await import('@/components/ThemeProvider');
  const themeIds = ['default', 'luxury', 'damascus'];
  const snapshots = {};

  for (const themeId of themeIds) {
    const markup = renderToStaticMarkup(
      React.createElement(
        ThemeProvider,
        { defaultThemeId: themeId },
        React.createElement(NotificationsPageBody, { hook: { ...mockHookValue } })
      )
    );
    const sanitized = sanitize(markup);
    snapshots[themeId] = sanitized;
    assert.match(sanitized, /data-page="notifications"/);
    assert.match(sanitized, /data-section="notifications-header"/);
    assert.match(sanitized, /data-section="notifications-tabs"/);
  }

});
