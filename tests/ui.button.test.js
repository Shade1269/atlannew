import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import ThemeProvider from '../src/components/ThemeProvider.tsx';
import { Button as ThemeButton } from '../src/ui/Button.tsx';

function renderWithProvider(child) {
  return renderToStaticMarkup(React.createElement(ThemeProvider, null, child));
}

test('theme button exposes variant and size attributes', () => {
  const html = renderWithProvider(
    React.createElement(ThemeButton, { variant: 'outline', size: 'lg' }, 'زر رئيسي')
  );

  assert.match(html, /data-variant="outline"/);
  assert.match(html, /data-size="lg"/);
});

test('loading theme button toggles disabled state', () => {
  const html = renderWithProvider(
    React.createElement(ThemeButton, { loading: true }, 'تحميل')
  );

  assert.match(html, /data-loading="true"/);
  assert.match(html, /disabled/);
  assert.match(html, /aria-busy="true"/);
});
