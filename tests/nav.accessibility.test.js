import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

if (typeof globalThis.localStorage === 'undefined') {
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
}

let mockRole = 'admin';

const mockUserData = {
  userShop: { slug: 'demo-shop', total_orders: 8, total_products: 12 },
  userActivities: new Array(3).fill({}),
  userStatistics: {},
};

test('skip link focuses main content element', async () => {
  const { SkipToContent, focusContentTarget } = await import('@/components/app-shell/SkipToContent');
  const markup = renderToStaticMarkup(React.createElement(SkipToContent, { targetId: 'content' }));
  assert.match(markup, /href="#content"/);

  const focused = [];
  const originalDocument = globalThis.document;
  globalThis.document = {
    getElementById: (id) =>
      id === 'content'
        ? {
            focus: () => focused.push('focus'),
            scrollIntoView: () => focused.push('scroll'),
          }
        : null,
  };

  const result = focusContentTarget('content');

  assert.equal(result, true);
  assert.ok(focused.includes('focus'));
  assert.ok(focused.includes('scroll'));

  if (originalDocument) {
    globalThis.document = originalDocument;
  } else if ('document' in globalThis) {
    delete globalThis.document;
  }
});

test('app shell exposes labelled navigation landmarks', async () => {
  mockRole = 'affiliate';
  const { AppShell } = await import('@/components/app-shell/AppShell');
  const { default: ThemeProvider } = await import('@/components/ThemeProvider');
  const markup = renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      { initialEntries: ['/affiliate'] },
      React.createElement(
        ThemeProvider,
        { defaultThemeId: 'default' },
        React.createElement(
          AppShell,
          {
            roleOverride: 'affiliate',
            fastAuthOverride: {
              profile: { role: mockRole, full_name: 'مسوق الاختبار', email: 'demo@anaqti.sa' },
              user: { email: 'demo@anaqti.sa' },
              signOut: () => {},
            },
            userDataOverride: mockUserData,
          },
          React.createElement('div', null, 'Affiliate')
        )
      )
    )
  );

  assert.match(markup, /aria-label="التنقل الرئيسي"/);
  assert.match(markup, /aria-label="التنقل السفلي"/);
  assert.match(markup, /id="content"/);
  assert.match(markup, /tabindex="-1"/i);
  assert.match(markup, /href="#content"/);
});
