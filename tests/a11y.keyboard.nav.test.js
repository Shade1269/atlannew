import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { getNextFocusIndex, isActivationKey, isRovingKey } from '@/utils/a11yNavigation';

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

test('roving focus helper handles arrow navigation and activation keys', () => {
  assert.equal(getNextFocusIndex(0, 'ArrowDown', 4), 1);
  assert.equal(getNextFocusIndex(0, 'ArrowUp', 4), 3);
  assert.equal(getNextFocusIndex(2, 'Home', 5), 0);
  assert.equal(getNextFocusIndex(2, 'End', 5), 4);
  assert.equal(getNextFocusIndex(1, 'ArrowLeft', 2), 0);
  assert.equal(getNextFocusIndex(1, 'ArrowRight', 2), 0);
  assert.ok(isRovingKey('ArrowDown'));
  assert.ok(!isRovingKey('Tab'));
  assert.ok(isActivationKey('Enter'));
  assert.ok(isActivationKey(' '));
  assert.ok(!isActivationKey('Escape'));
});

test('notifications markup exposes list semantics for keyboard navigation', async () => {
  ensureLocalStorage();
  const { NotificationsPageBody } = await import('@/pages/notifications');
  const { default: ThemeProvider } = await import('@/components/ThemeProvider');

  const hookOverride = {
    notifications: [
      {
        id: 'notif-a11y',
        title: 'تنبيه تجربة',
        message: 'هذا اختبار لوصولية التنقل.',
        type: 'system',
        timestamp: 'الآن',
        read: false,
      },
    ],
    activity: [
      {
        id: 'activity-a11y',
        title: 'تحديث مخزون',
        description: 'تم تحديث مستويات المخزون.',
        icon: 'store',
        timestamp: 'اليوم',
      },
    ],
    unreadCount: 1,
    page: 1,
    markAsRead: () => {},
    clear: () => {},
    loadMore: () => {},
  };

  const markup = renderToStaticMarkup(
    React.createElement(
      ThemeProvider,
      { defaultThemeId: 'default' },
      React.createElement(NotificationsPageBody, { hook: hookOverride })
    )
  );

  assert.match(markup, /role="list"/);
  assert.match(markup, /role="listitem"/);
  assert.match(markup, /tabindex="0"/i);
  assert.match(markup, /data-tab="notifications"/);
});
