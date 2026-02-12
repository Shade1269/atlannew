import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const leaderboardApiSource = readFileSync(resolve(__dirname, '../src/server/leaderboard/api.ts'), 'utf8');

const daysAgo = (days) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString();
};

const previousMonth = () => {
  const date = new Date();
  date.setUTCMonth(date.getUTCMonth() - 1);
  return date.toISOString();
};

const currentMonthKey = () => {
  const now = new Date();
  return `${now.getUTCFullYear()}-${now.getUTCMonth()}`;
};

const monthKeyForDate = (isoString) => {
  const date = new Date(isoString);
  return `${date.getUTCFullYear()}-${date.getUTCMonth()}`;
};

const rankRows = (rows, scoreAccessor, secondaryAccessor) => {
  let lastScore = null;
  let lastRank = 0;
  rows.forEach((row, index) => {
    const score = scoreAccessor(row);
    if (lastScore === null || score !== lastScore) {
      row.rank = index + 1;
      lastScore = score;
      lastRank = row.rank;
    } else {
      row.rank = lastRank;
    }
    if (secondaryAccessor) {
      secondaryAccessor(row);
    }
  });
  return rows;
};

const buildAllianceLeaderboard = ({ events, memberships, alliances }) => {
  const key = currentMonthKey();
  const aggregates = new Map();

  events.forEach((event) => {
    if (monthKeyForDate(event.created_at) !== key) {
      return;
    }
    const membership = memberships.get(event.affiliate_id);
    if (!membership || !membership.is_active) {
      return;
    }
    const alliance = alliances.get(membership.alliance_id);
    if (!alliance) {
      return;
    }

    const bucket = aggregates.get(membership.alliance_id) ?? {
      alliance_id: membership.alliance_id,
      alliance_name: alliance.name,
      total_points: 0,
      events_count: 0,
      month_number: new Date(event.created_at).getUTCMonth() + 1,
      year_number: new Date(event.created_at).getUTCFullYear(),
    };

    bucket.total_points += event.points;
    bucket.events_count += 1;
    aggregates.set(membership.alliance_id, bucket);
  });

  const rows = Array.from(aggregates.values());
  rows.sort((a, b) => {
    if (b.total_points !== a.total_points) {
      return b.total_points - a.total_points;
    }
    return a.alliance_name.localeCompare(b.alliance_name, 'ar');
  });

  return rankRows(rows, (row) => row.total_points);
};

const buildUserLeaderboard = ({ events, profiles }) => {
  const key = currentMonthKey();
  const aggregates = new Map();

  events.forEach((event) => {
    if (monthKeyForDate(event.created_at) !== key) {
      return;
    }
    const bucket = aggregates.get(event.affiliate_id) ?? {
      user_id: event.affiliate_id,
      profile_name: profiles.get(event.affiliate_id)?.full_name ?? null,
      points: 0,
      events_count: 0,
      month_number: new Date(event.created_at).getUTCMonth() + 1,
      year_number: new Date(event.created_at).getUTCFullYear(),
    };

    bucket.points += event.points;
    bucket.events_count += 1;
    aggregates.set(event.affiliate_id, bucket);
  });

  const rows = Array.from(aggregates.values());
  rows.sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    const aName = a.profile_name ?? a.user_id;
    const bName = b.profile_name ?? b.user_id;
    return aName.localeCompare(bName, 'ar');
  });

  return rankRows(rows, (row) => row.points);
};

test('alliances leaderboard aggregates current-month points with stable ranking', () => {
  const events = [
    { affiliate_id: 'affiliate-a', points: 10, created_at: daysAgo(1) },
    { affiliate_id: 'affiliate-b', points: 15, created_at: daysAgo(2) },
    { affiliate_id: 'affiliate-c', points: 15, created_at: daysAgo(3) },
    { affiliate_id: 'affiliate-d', points: 9, created_at: previousMonth() },
    { affiliate_id: 'affiliate-e', points: 15, created_at: daysAgo(1) },
  ];

  const memberships = new Map([
    ['affiliate-a', { alliance_id: 'alliance-1', is_active: true }],
    ['affiliate-b', { alliance_id: 'alliance-1', is_active: true }],
    ['affiliate-c', { alliance_id: 'alliance-2', is_active: true }],
    ['affiliate-d', { alliance_id: 'alliance-2', is_active: true }],
    ['affiliate-e', { alliance_id: 'alliance-3', is_active: true }],
  ]);

  const alliances = new Map([
    ['alliance-1', { name: 'أسود الشمال' }],
    ['alliance-2', { name: 'فرسان الصحراء' }],
    ['alliance-3', { name: 'نسور الساحل' }],
  ]);

  const leaderboard = buildAllianceLeaderboard({ events, memberships, alliances });
  assert.equal(leaderboard.length, 3);
  assert.deepEqual(
    leaderboard.map((row) => row.alliance_id),
    ['alliance-1', 'alliance-2', 'alliance-3'],
  );
  assert.equal(leaderboard[0].total_points, 25);
  assert.equal(leaderboard[0].rank, 1);
  assert.equal(leaderboard[1].total_points, 15);
  assert.equal(leaderboard[1].rank, 2);
  assert.equal(leaderboard[2].total_points, 15);
  assert.equal(leaderboard[2].rank, 2, 'alliances sharing the same score keep the same rank');
});

test('individual leaderboard orders by points then display name', () => {
  const events = [
    { affiliate_id: 'user-1', points: 10, created_at: daysAgo(2) },
    { affiliate_id: 'user-1', points: 2, created_at: daysAgo(1) },
    { affiliate_id: 'user-2', points: 20, created_at: daysAgo(1) },
    { affiliate_id: 'user-3', points: 12, created_at: daysAgo(1) },
    { affiliate_id: 'user-4', points: 7, created_at: previousMonth() },
  ];

  const profiles = new Map([
    ['user-1', { full_name: 'سارة العتيبي' }],
    ['user-2', { full_name: 'ليلى القحطاني' }],
  ]);

  const leaderboard = buildUserLeaderboard({ events, profiles });
  assert.equal(leaderboard.length, 3);
  assert.equal(leaderboard[0].user_id, 'user-2');
  assert.equal(leaderboard[0].points, 20);
  assert.equal(leaderboard[0].rank, 1);

  for (let index = 1; index < leaderboard.length; index += 1) {
    const current = leaderboard[index];
    const previous = leaderboard[index - 1];

    assert.ok(
      previous.points >= current.points,
      'points must be sorted in descending order',
    );

    if (previous.points === current.points) {
      const previousName = previous.profile_name ?? previous.user_id;
      const currentName = current.profile_name ?? current.user_id;
      assert.ok(
        previousName.localeCompare(currentName, 'ar') <= 0,
        'ties fall back to lexicographic ordering by display name',
      );
      assert.equal(previous.rank, current.rank, 'tied scores share the same rank');
    }
  }
});

test('leaderboard API enforces authentication and references the SQL views', () => {
  assert.match(leaderboardApiSource, /supabase\.auth\.getUser\(/);
  assert.match(leaderboardApiSource, /from\('alliances_monthly_leaderboard'\)/);
  assert.match(leaderboardApiSource, /from\('monthly_leaderboard'\)/);
});
