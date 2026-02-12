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

const mockHookValue = {
  isLoading: false,
  profile: {
    id: 'user-001',
    name: 'ليان المسوقة',
    email: 'lian@example.com',
    role: 'marketer',
    avatarUrl: null,
    joinedAt: '2024-01-02T00:00:00.000Z',
    initials: 'لم',
  },
  preferences: {
    themeId: 'luxury',
    language: 'ar',
    reducedMotion: false,
  },
  security: {
    twoFactorEnabled: true,
    sessions: [
      {
        id: 'sess-current',
        device: 'iPhone 15 Pro',
        location: 'الرياض، السعودية',
        lastActive: 'قبل 5 دقائق',
        current: true,
        trusted: true,
      },
      {
        id: 'sess-office',
        device: 'MacBook Air',
        location: 'جدة، السعودية',
        lastActive: 'اليوم 10:15 ص',
        current: false,
        trusted: false,
      },
    ],
  },
  updatePreferences: () => {},
  toggleTwoFactor: () => {},
  revokeSession: () => {},
  trustSession: () => {},
  resetSessions: () => {},
};

test('profile overview renders expected glass sections', async () => {
  ensureLocalStorage();
  const { ProfilePageBody } = await import('@/pages/profile');
  const { default: ThemeProvider } = await import('@/components/ThemeProvider');

  const markup = renderToStaticMarkup(
    React.createElement(
      ThemeProvider,
      { defaultThemeId: 'default' },
      React.createElement(ProfilePageBody, { hook: mockHookValue })
    )
  );

  assert.match(markup, /data-page="profile"/);
  assert.match(markup, /data-section="profile-header"/);
  assert.match(markup, /data-tab="security"/);
  assert.match(markup, /data-section="profile-tabs"/);
  assert.match(markup, /ليان المسوقة/);
  assert.match(markup, /مركز الإشعارات/);
});
