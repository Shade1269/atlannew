import test from 'node:test';
import assert from 'node:assert/strict';
import { rm, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '..');

const GENERATED_ASSETS = [
  'public/anaqati-icon-192.png',
  'public/anaqati-icon-256.png',
  'public/anaqati-icon-512.png',
  'public/favicon.ico',
  'public/lovable-uploads/0e23a745-b356-4596-95c0-39b0050acbd1.png',
  'public/lovable-uploads/60b94ef9-9e25-4acc-ab85-a92fc7810b69.png',
  'public/models/cube.glb',
  'public/models/model.glb',
  'public/models/sphere.glb',
];

async function decodeAssets(options = {}) {
  const module = await import('../scripts/decodeAssets.mjs');
  return module.decodeAssetManifest({ rootDir: repoRoot, ...options });
}

test('decodeAssets restores all generated binaries when missing', async () => {
  for (const relativePath of GENERATED_ASSETS) {
    await rm(resolve(repoRoot, relativePath), { force: true });
  }

  const { outputs } = await decodeAssets();
  assert.ok(outputs.length >= GENERATED_ASSETS.length, 'expected outputs to include all entries');

  for (const relativePath of GENERATED_ASSETS) {
    const stats = await stat(resolve(repoRoot, relativePath));
    assert.ok(stats.size > 0, `Expected ${relativePath} to be recreated`);
  }
});

test('decodeAssets recreates directories that were removed', async () => {
  await rm(resolve(repoRoot, 'public/models'), { recursive: true, force: true });
  await rm(resolve(repoRoot, 'public/lovable-uploads'), { recursive: true, force: true });

  await decodeAssets({ force: true });

  for (const relativePath of GENERATED_ASSETS) {
    const stats = await stat(resolve(repoRoot, relativePath));
    assert.ok(stats.size > 0, `Expected ${relativePath} to exist after directory removal`);
  }
});
