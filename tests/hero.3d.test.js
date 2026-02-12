import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '..');

test('Hero3D renders a canvas surface when WebGL is available', async () => {
  await execFileAsync('node', ['scripts/decodeAssets.mjs'], { cwd: repoRoot });
  const { Hero3D } = await import('../src/themes/default/Hero3D.tsx');
  const html = renderToStaticMarkup(React.createElement(Hero3D));
  assert.ok(html.includes('data-hero-canvas'));
});
