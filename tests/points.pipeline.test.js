import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pipelineSql = readFileSync(resolve(__dirname, '../sql/04_points_leaderboard.sql'), 'utf8');

const shopFragment = (shopId) => (shopId ?? 'no-shop');

const makeEventKey = ({ type, id, affiliateId, discriminator }) => {
  return [type, discriminator ?? '', id ?? '', affiliateId ?? '',].join(':');
};

const grantPointsLocally = ({ order, orderItems, events, affiliateStore }) => {
  const affiliateId = affiliateStore?.profile_id ?? null;
  if (!affiliateId) {
    return;
  }

  const shopId = shopFragment(order.shop_id ?? null);

  const orderKey = makeEventKey({
    type: 'order_success',
    id: order.id,
    affiliateId,
    discriminator: shopId,
  });

  if (!events.has(orderKey)) {
    events.set(orderKey, {
      type: 'order_success',
      points: 10,
      affiliate_id: affiliateId,
      meta: { order_id: order.id, shop_id: order.shop_id ?? null },
    });
  }

  orderItems.forEach((item) => {
    const itemKey = makeEventKey({
      type: 'item_sold',
      id: item.id,
      affiliateId,
      discriminator: shopId,
    });

    if (!events.has(itemKey)) {
      events.set(itemKey, {
        type: 'item_sold',
        points: 3,
        affiliate_id: affiliateId,
        meta: {
          order_id: order.id,
          order_item_id: item.id,
          shop_id: order.shop_id ?? null,
        },
      });
    }
  });

  if (order.customer_profile_id) {
    const customerKey = makeEventKey({
      type: 'new_customer_signup',
      id: order.customer_profile_id,
      affiliateId,
      discriminator: `profile-${shopId}`,
    });

    if (!events.has(customerKey)) {
      events.set(customerKey, {
        type: 'new_customer_signup',
        points: 15,
        affiliate_id: affiliateId,
        meta: {
          order_id: order.id,
          customer_profile_id: order.customer_profile_id,
          shop_id: order.shop_id ?? null,
        },
      });
    }
    return;
  }

  if (order.buyer_session_id) {
    const sessionKey = makeEventKey({
      type: 'new_customer_signup',
      id: order.buyer_session_id,
      affiliateId,
      discriminator: `session-${shopId}`,
    });

    if (!events.has(sessionKey)) {
      events.set(sessionKey, {
        type: 'new_customer_signup',
        points: 15,
        affiliate_id: affiliateId,
        meta: {
          order_id: order.id,
          buyer_session_id: order.buyer_session_id,
          shop_id: order.shop_id ?? null,
        },
      });
    }
  }
};

const eventsByType = (events, type) => {
  return Array.from(events.values()).filter((event) => event.type === type);
};

test('profile-linked customers trigger all point events exactly once', () => {
  const events = new Map();
  const affiliateStore = { id: 'store-1', profile_id: 'affiliate-1' };

  const order = {
    id: 'order-1',
    shop_id: 'shop-1',
    customer_profile_id: 'customer-1',
  };
  const orderItems = [
    { id: 'item-1', order_id: order.id },
    { id: 'item-2', order_id: order.id },
  ];

  grantPointsLocally({ order, orderItems, events, affiliateStore });

  assert.equal(eventsByType(events, 'order_success').length, 1);
  assert.equal(eventsByType(events, 'item_sold').length, 2);
  assert.equal(eventsByType(events, 'new_customer_signup').length, 1);

  // Re-running must keep counts identical.
  const sizeBefore = events.size;
  grantPointsLocally({ order, orderItems, events, affiliateStore });
  assert.equal(events.size, sizeBefore);

  // Follow-up order from the same customer should only add order & item points.
  const orderTwo = {
    id: 'order-2',
    shop_id: 'shop-1',
    customer_profile_id: 'customer-1',
  };
  const orderTwoItems = [{ id: 'item-3', order_id: orderTwo.id }];
  grantPointsLocally({ order: orderTwo, orderItems: orderTwoItems, events, affiliateStore });

  assert.equal(eventsByType(events, 'order_success').length, 2);
  assert.equal(eventsByType(events, 'item_sold').length, 3);
  assert.equal(eventsByType(events, 'new_customer_signup').length, 1, 'new customer bonus remains unique');
});

test('buyer session identifiers still receive a single new customer bonus', () => {
  const events = new Map();
  const affiliateStore = { id: 'store-2', profile_id: 'affiliate-2' };

  const sessionOrder = {
    id: 'order-session-1',
    shop_id: 'shop-2',
    buyer_session_id: 'session-xyz',
  };
  const sessionItems = [{ id: 'item-s1', order_id: sessionOrder.id }];

  grantPointsLocally({ order: sessionOrder, orderItems: sessionItems, events, affiliateStore });

  assert.equal(eventsByType(events, 'order_success').length, 1);
  assert.equal(eventsByType(events, 'item_sold').length, 1);
  assert.equal(eventsByType(events, 'new_customer_signup').length, 1);

  // Another paid order for the same anonymous session should not add a new signup bonus.
  const secondSessionOrder = {
    id: 'order-session-2',
    shop_id: 'shop-2',
    buyer_session_id: 'session-xyz',
  };
  const secondItems = [{ id: 'item-s2', order_id: secondSessionOrder.id }];
  grantPointsLocally({ order: secondSessionOrder, orderItems: secondItems, events, affiliateStore });

  assert.equal(eventsByType(events, 'order_success').length, 2);
  assert.equal(eventsByType(events, 'item_sold').length, 2);
  assert.equal(eventsByType(events, 'new_customer_signup').length, 1);
});

test('SQL script links the trigger and leaderboard artefacts', () => {
  assert.match(pipelineSql, /CREATE OR REPLACE FUNCTION public\._grant_points_for_paid_order/);
  assert.match(pipelineSql, /CREATE OR REPLACE FUNCTION public\._on_order_paid_grant_points/);
  assert.match(pipelineSql, /CREATE TRIGGER trg_order_paid_grant_points/);
  assert.match(pipelineSql, /CREATE UNIQUE INDEX IF NOT EXISTS uq_points_order_success/);
  assert.match(pipelineSql, /CREATE OR REPLACE VIEW public\.alliances_monthly_leaderboard/);
  assert.match(pipelineSql, /CREATE OR REPLACE VIEW public\.monthly_leaderboard/);
});
