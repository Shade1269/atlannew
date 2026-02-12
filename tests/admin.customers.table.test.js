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

test('admin customers store filters by spend, date, and exports csv', async () => {
  const { createAdminCustomersStore } = await import('@/hooks/useAdminCustomers');

  const store = createAdminCustomersStore('customers-suite');
  const initial = store.getSnapshot();
  assert.ok(initial.visibleCustomers.length > 0, 'expected seeded customers');

  store.setSearchTerm('مشاعل');
  await wait();
  const searched = store.getSnapshot();
  assert.ok(
    searched.visibleCustomers.every((customer) => customer.name.includes('مشاعل')),
    'search narrows to customer name'
  );

  store.setSearchTerm('');
  await wait();
  store.setSpendRange(1000, 5000);
  await wait();
  const spend = store.getSnapshot();
  assert.ok(
    spend.visibleCustomers.every(
      (customer) => customer.totalSpent >= 1000 && customer.totalSpent <= 5000
    ),
    'spend filter constrains totals'
  );

  store.setSpendRange(null, null);
  await wait();
  store.setDateRangePreset('7d');
  await wait();
  const range = store.getSnapshot();
  assert.equal(range.filters.dateRange.preset, '7d');

  store.setSort('spend-desc');
  await wait();
  const sorted = store.getSnapshot();
  const totals = sorted.visibleCustomers.map((customer) => customer.totalSpent);
  const sortedTotals = [...totals].sort((a, b) => b - a);
  assert.deepEqual(totals, sortedTotals, 'customers sorted by spend descending');

  store.loadMore();
  await wait();
  const afterLoad = store.getSnapshot();
  assert.ok(afterLoad.visibleCustomers.length >= initial.visibleCustomers.length);

  const csv = store.exportToCsv();
  assert.match(csv, /customer_id,customer_name,email/, 'csv contains header row');
  assert.match(csv, /CUS-501/, 'csv lists seeded customer id');

  store.reset();
});
