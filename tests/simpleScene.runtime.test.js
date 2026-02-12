import test from 'node:test';
import assert from 'node:assert/strict';
import { describeSimpleSceneSurface } from '../src/three/simpleSceneRuntime.js';

test('simple scene reports canvas surface when enabled and WebGL is available', () => {
  const surface = describeSimpleSceneSurface({ enabled: true, webglAvailable: true });
  assert.equal(surface, 'canvas');
});

test('simple scene falls back when disabled', () => {
  const surface = describeSimpleSceneSurface({ enabled: false, webglAvailable: true });
  assert.equal(surface, 'fallback');
});
