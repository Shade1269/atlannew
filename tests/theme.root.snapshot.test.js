import test from 'node:test';
import assert from 'node:assert/strict';

import { applyThemeToDocument } from '../src/hooks/useTheme.ts';
import { getTheme } from '../src/themes/registry.ts';

import {
  installThemeDomMocks,
  pickTokenSnapshot,
  themeIds,
  themeTokens,
} from './utils/themeTestUtils.js';

const SNAPSHOT_KEYS = [
  '--bg',
  '--fg',
  '--primary',
  '--secondary',
  '--surface',
  '--surface-2',
  '--glass-border',
  '--shadow-glass-soft',
  '--shadow-glass-strong',
  '--spacing-sm',
  '--spacing-md',
  '--spacing-lg',
  '--radius-s',
  '--radius-m',
  '--radius-l',
  '--font-sans',
  '--font-weight-regular',
  '--font-weight-medium',
  '--font-weight-bold',
  '--state-hover-bg',
  '--state-focus-ring',
  '--state-disabled-bg',
  '--state-disabled-fg',
];

const { root, cleanup } = installThemeDomMocks();

test.after(() => {
  cleanup();
});

test('documentElement exposes expected theme tokens for each theme', () => {
  const actualSnapshot = {};

  for (const themeId of themeIds) {
    applyThemeToDocument(getTheme(themeId));
    const computed = globalThis.getComputedStyle(root);
    actualSnapshot[themeId] = {};

    for (const key of SNAPSHOT_KEYS) {
      actualSnapshot[themeId][key] = computed.getPropertyValue(key).trim();
    }
  }

  const expectedSnapshot = themeIds.reduce((acc, themeId) => {
    acc[themeId] = pickTokenSnapshot(themeTokens[themeId], SNAPSHOT_KEYS);
    return acc;
  }, {});

  assert.deepEqual(actualSnapshot, expectedSnapshot);
});
