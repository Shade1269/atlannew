import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import ThemeProvider from '../src/components/ThemeProvider.tsx';
import { Button } from '../src/ui/Button.tsx';
import { Tabs, TabsList, TabsTrigger, TabsPanel } from '../src/ui/Tabs.tsx';

function renderWithProvider(child) {
  return renderToStaticMarkup(React.createElement(ThemeProvider, null, child));
}

test('button exposes focus ring flag for a11y tooling', () => {
  const html = renderWithProvider(React.createElement(Button, null, 'إجراء'));
  assert.match(html, /data-focus-ring="true"/);
});

test('tabs triggers manage aria-selected and roving tabindex', () => {
  const html = renderWithProvider(
    React.createElement(
      Tabs,
      { defaultValue: 'overview' },
      React.createElement(
        TabsList,
        { 'aria-label': 'أقسام المحتوى' },
        React.createElement(TabsTrigger, { value: 'overview' }, 'نظرة عامة'),
        React.createElement(TabsTrigger, { value: 'details' }, 'تفاصيل')
      ),
      React.createElement(TabsPanel, { value: 'overview' }, 'محتوى 1'),
      React.createElement(TabsPanel, { value: 'details' }, 'محتوى 2')
    )
  );

  assert.match(html, /role="tablist"/);
  assert.match(html, /role="tab"/);
  assert.match(html, /aria-selected="true"/);
  assert.match(html, /tabindex="0"/);
  assert.match(html, /tabindex="-1"/);
});
