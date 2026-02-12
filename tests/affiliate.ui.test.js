import test from 'node:test';
import assert from 'node:assert/strict';
import { describeAffiliateHomeSectionsRuntime } from '../src/pages/affiliate/homeStateRuntime.js';

test('affiliate home view renders score, sales, and orders for authorized affiliates', () => {
  const summary = describeAffiliateHomeSectionsRuntime({
    loading: false,
    isAuthorized: true,
    store: {
      id: 'store-1',
      store_name: 'متجر روان',
      store_slug: 'rawan-store',
    },
    shareUrl: 'https://anaqti.test/rawan-store',
    metrics: {
      today: { orders: 1, items: 2, revenue: 150 },
      week: { orders: 4, items: 7, revenue: 530 },
      month: { orders: 12, items: 23, revenue: 1820 },
    },
    metricsLoading: false,
    topProducts: [
      { productId: 'prod-1', title: 'عباية مخملية', quantity: 8, revenue: 2400 },
    ],
    orders: [
      {
        id: 'order-1',
        orderNumber: '#1234',
        total: 150,
        paymentStatus: 'PAID',
        fulfillmentStatus: 'FULFILLED',
        createdAt: '2024-07-15T09:00:00Z',
        customerName: 'ليان العتيبي',
      },
    ],
    ordersLoading: false,
    error: null,
    onRefresh: () => {},
  });

  assert.equal(summary.state, 'ready');
  assert.deepEqual(summary.sections, ['score', 'share', 'product-share', 'sales', 'orders']);
});

test('affiliate home view hides dashboard for unauthorized visitors', () => {
  const summary = describeAffiliateHomeSectionsRuntime({
    loading: false,
    isAuthorized: false,
    store: null,
    shareUrl: null,
    metrics: null,
    metricsLoading: false,
    orders: [],
    ordersLoading: false,
    error: null,
    onRefresh: () => {},
  });

  assert.equal(summary.state, 'unauthorized');
  assert.deepEqual(summary.sections, []);
});

test('affiliate home sections omit product share when no products', () => {
  const summary = describeAffiliateHomeSectionsRuntime({
    loading: false,
    isAuthorized: true,
    store: { id: 'store-2', store_name: 'متجر نور', store_slug: 'nur-store' },
    shareUrl: 'https://anaqti.test/nur-store',
    metrics: {
      today: { orders: 0, items: 0, revenue: 0 },
      week: { orders: 0, items: 0, revenue: 0 },
      month: { orders: 0, items: 0, revenue: 0 },
    },
    metricsLoading: false,
    topProducts: [],
    orders: [],
    ordersLoading: false,
    error: null,
    onRefresh: () => {},
  });

  assert.equal(summary.state, 'ready');
  assert.deepEqual(summary.sections, ['score', 'share', 'sales', 'orders']);
});
