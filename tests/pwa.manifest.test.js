import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const INDEX_PATH = new URL('../index.html', import.meta.url);
const MANIFEST_PATH = new URL('../public/manifest.webmanifest', import.meta.url);

test('index.html links manifest and theme-color meta', async () => {
  const html = await readFile(INDEX_PATH, 'utf8');
  assert.ok(html.includes('rel="manifest"'), 'expected manifest link');
  assert.ok(html.includes('href="/manifest.webmanifest"'), 'expected manifest href');
  assert.ok(html.includes('meta name="theme-color"'), 'expected theme-color meta');
  assert.ok(html.includes('data-theme-sync="primary"'), 'expected data-theme-sync attribute');
});

test('manifest exposes installable metadata', async () => {
  const raw = await readFile(MANIFEST_PATH, 'utf8');
  const manifest = JSON.parse(raw);

  assert.equal(manifest.name, 'أتلانتس');
  assert.equal(manifest.start_url, '/');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.theme_color, '#57a5ff');
  assert.equal(manifest.background_color, '#0d1117');
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 3, 'expected icons array');
  const sizes = manifest.icons.map((icon) => icon.sizes);
  assert.ok(sizes.includes('192x192'), 'missing 192 icon');
  assert.ok(sizes.includes('512x512'), 'missing 512 icon');
});
