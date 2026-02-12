import test from 'node:test';
import assert from 'node:assert/strict';

import { applyThemeToDocument } from '../src/hooks/useTheme.ts';
import { getTheme } from '../src/themes/registry.ts';

import { installThemeDomMocks, themeTokens } from './utils/themeTestUtils.js';

const { root, cleanup } = installThemeDomMocks();

test.after(() => {
  cleanup();
});

test('applyThemeToDocument updates root data-theme and token values', () => {
  applyThemeToDocument(getTheme('default'));
  assert.equal(root.getAttribute('data-theme'), 'default');
  assert.equal(globalThis.getComputedStyle(root).getPropertyValue('--bg').trim(), themeTokens.default['--bg']);

  applyThemeToDocument(getTheme('luxury'));
  assert.equal(root.getAttribute('data-theme'), 'luxury');
  assert.equal(globalThis.getComputedStyle(root).getPropertyValue('--bg').trim(), themeTokens.luxury['--bg']);

  applyThemeToDocument(getTheme('damascus'));
  assert.equal(root.getAttribute('data-theme'), 'damascus');
  assert.equal(globalThis.getComputedStyle(root).getPropertyValue('--bg').trim(), themeTokens.damascus['--bg']);
});
