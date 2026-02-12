import test from 'node:test';
import assert from 'node:assert/strict';
import { getHomeRouteForRoleRuntime as getHomeRouteForRole } from '../src/hooks/getHomeRouteForRoleRuntime.js';

test('getHomeRouteForRole returns admin dashboard for admin role', () => {
  assert.equal(getHomeRouteForRole('admin'), '/admin/dashboard');
});

test('getHomeRouteForRole treats moderator as admin-level access', () => {
  assert.equal(getHomeRouteForRole('moderator'), '/admin/dashboard');
});

test('getHomeRouteForRole maps legacy merchant role to affiliate area', () => {
  assert.equal(getHomeRouteForRole('merchant'), '/affiliate');
});

test('getHomeRouteForRole defaults affiliates to affiliate route', () => {
  assert.equal(getHomeRouteForRole('affiliate'), '/affiliate');
});

test('getHomeRouteForRole routes marketers to affiliate home', () => {
  assert.equal(getHomeRouteForRole('marketer'), '/affiliate');
});

test('getHomeRouteForRole falls back to home when role missing', () => {
  assert.equal(getHomeRouteForRole(undefined), '/');
});
