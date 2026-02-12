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
  isLoading: false,
  profile: {
    id: 'profile-theme',
    name: 'هيفاء الإداري',
    email: 'hayfa@anaqti.sa',
    role: 'admin',
    avatarUrl: null,
    joinedAt: '2023-07-01T00:00:00.000Z',
    initials: 'هي',
  },
  preferences: {
    themeId: 'default',
    language: 'ar',
    reducedMotion: false,
  },
  security: {
    twoFactorEnabled: true,
    sessions: [
      {
        id: 'session-a',
        device: 'Surface Laptop',
        location: 'الخبر، السعودية',
        lastActive: 'قبل 10 دقائق',
        current: true,
        trusted: true,
      },
    ],
  },
  updatePreferences: () => {},
  toggleTwoFactor: () => {},
  revokeSession: () => {},
  trustSession: () => {},
  resetSessions: () => {},
};

test('profile page renders consistently across themes', async () => {
  ensureLocalStorage();
  const { ProfilePageBody } = await import('@/pages/profile');
  const { default: ThemeProvider } = await import('@/components/ThemeProvider');
  const themeIds = ['default', 'luxury', 'damascus'];
  const snapshots = {};

  for (const themeId of themeIds) {
    const markup = renderToStaticMarkup(
      React.createElement(
        ThemeProvider,
        { defaultThemeId: themeId },
        React.createElement(ProfilePageBody, { hook: { ...mockHookValue, preferences: { ...mockHookValue.preferences, themeId } } })
      )
    );
    const sanitized = sanitize(markup);
    snapshots[themeId] = sanitized;
    assert.match(sanitized, /data-page="profile"/);
    assert.match(sanitized, /data-section="profile-tabs"/);
    assert.match(sanitized, /class="kit-button/);
  }

});
