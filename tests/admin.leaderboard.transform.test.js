import test from 'node:test';
import assert from 'node:assert/strict';

import { buildSummary, applyVariation } from '@/hooks/useAdminLeaderboard';

const sampleEntries = [
  { id: 'a', name: 'أ', points: 100, commission: 2000, orders: 12, pointsChange: 10, commissionChange: 12, rank: 1 },
  { id: 'b', name: 'ب', points: 90, commission: 1800, orders: 10, pointsChange: 8, commissionChange: 10, rank: 2 },
  { id: 'c', name: 'ج', points: 80, commission: 1600, orders: 9, pointsChange: 6, commissionChange: 8, rank: 3 },
];

test('applyVariation adjusts values deterministically', () => {
  const base = 100;
  const first = applyVariation(base, 0, 0.02);
  const second = applyVariation(base, 1, 0.02);

  assert.equal(first, Math.round(base * 1.02));
  assert.equal(second, Math.round(base * (1 - 0.02)));
});

test('buildSummary aggregates leaderboard stats', () => {
  const summary = buildSummary(sampleEntries);

  assert.equal(summary.totalPoints, 270);
  assert.equal(summary.totalCommission, 5400);
  assert.equal(summary.activeAffiliates, 3);
  assert.equal(summary.averageCommission, 1800);
  assert.equal(summary.topPerformer.id, 'a');
  assert.equal(summary.pointsChange7d, Math.round((10 + 8 + 6) / 3));
  assert.equal(summary.commissionChange7d, Math.round((12 + 10 + 8) / 3));
});
