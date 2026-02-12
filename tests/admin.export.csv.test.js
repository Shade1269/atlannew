import test from 'node:test';
import assert from 'node:assert/strict';

const wait = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

test('admin managers csv export respects filters', async () => {
  const { createAdminOrdersStore } = await import('@/hooks/useAdminOrders');
  const { createAdminCustomersStore } = await import('@/hooks/useAdminCustomers');

  const ordersStore = createAdminOrdersStore('csv-orders');
  ordersStore.setStatusFilter('pending');
  await wait();
  const ordersCsv = ordersStore.exportToCsv();
  assert.match(ordersCsv, /pending/, 'orders csv includes filtered status');

  const customersStore = createAdminCustomersStore('csv-customers');
  customersStore.setSpendRange(1000, 2000);
  await wait();
  const customersCsv = customersStore.exportToCsv();
  assert.match(customersCsv, /customer_id,customer_name/, 'customers csv has header');

  ordersStore.reset();
  customersStore.reset();
});
