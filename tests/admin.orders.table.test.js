import test from 'node:test';
import assert from 'node:assert/strict';

const wait = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => {
      store.set(key, String(value));
    },
    removeItem: (key) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
}

test('admin orders store supports filters, pagination, and csv export', async () => {
  const { createAdminOrdersStore } = await import('@/hooks/useAdminOrders');

  const store = createAdminOrdersStore('orders-suite');
  const initial = store.getSnapshot();
  assert.ok(initial.visibleOrders.length > 0, 'expected seeded orders');

  store.setStatusFilter('pending');
  await wait();
  const pending = store.getSnapshot();
  assert.ok(
    pending.visibleOrders.every((order) => order.status === 'pending'),
    'status filter narrows to pending orders'
  );

  store.setStatusFilter('all');
  store.setSearchTerm('ORD-2053');
  await wait();
  const searched = store.getSnapshot();
  assert.equal(searched.visibleOrders[0]?.id, 'ORD-2053', 'search should match specific order id');

  store.setCustomerId('CUS-501');
  await wait();
  const byCustomer = store.getSnapshot();
  assert.ok(
    byCustomer.visibleOrders.every((order) => order.customerId === 'CUS-501'),
    'customer filter narrows to target customer'
  );

  store.setCustomerId(null);
  store.setSearchTerm('');
  store.setDateRangePreset('today');
  await wait();
  const today = store.getSnapshot();
  assert.ok(today.filters.dateRange.preset === 'today');

  store.setDateRangePreset('30d');
  await wait();
  store.loadMore();
  await wait();
  const afterLoad = store.getSnapshot();
  assert.ok(afterLoad.visibleOrders.length >= initial.visibleOrders.length, 'load more should expand visible orders');

  const csv = store.exportToCsv();
  assert.match(csv, /order_id,customer_id,customer_name/, 'csv contains header row');
  assert.match(csv, /ORD-2054/, 'csv includes order rows');

  store.reset();
});
