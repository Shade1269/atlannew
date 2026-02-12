import test from 'node:test';
import assert from 'node:assert/strict';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

test('order and customer drawers expose dialog semantics and focus helpers', async () => {
  const { createAdminOrdersStore, getNextRowIndex } = await import('@/hooks/useAdminOrders');
  const { createAdminCustomersStore, getNextCustomerIndex } = await import('@/hooks/useAdminCustomers');
  const { default: ThemeProvider } = await import('@/components/ThemeProvider');
  const { default: OrderDetailsDrawer } = await import('@/pages/admin/components/OrderDetailsDrawer');
  const { default: CustomerDetailsDrawer } = await import('@/pages/admin/components/CustomerDetailsDrawer');

  const ordersStore = createAdminOrdersStore('a11y-orders');
  const customersStore = createAdminCustomersStore('a11y-customers');

  const order = ordersStore.getSnapshot().records[0];
  const customer = customersStore.getSnapshot().records[0];

  const wrapWithTheme = (node) =>
    React.createElement(
      ThemeProvider,
      { defaultThemeId: 'default' },
      node
    );

  const orderMarkup = renderToStaticMarkup(
    wrapWithTheme(
      React.createElement(OrderDetailsDrawer, {
        open: true,
        order,
        onClose: () => {},
        reducedMotion: true,
      })
    )
  );

  const customerMarkup = renderToStaticMarkup(
    wrapWithTheme(
      React.createElement(CustomerDetailsDrawer, {
        open: true,
        customer,
        onClose: () => {},
        onViewOrders: () => {},
        reducedMotion: true,
      })
    )
  );

  assert.match(orderMarkup, /role="dialog"/, 'order drawer renders dialog role');
  assert.match(orderMarkup, /data-focus-trap="true"/, 'order drawer exposes focus trap flag');
  assert.match(customerMarkup, /role="dialog"/, 'customer drawer renders dialog role');
  assert.equal(getNextRowIndex(0, 'down', 4), 1);
  assert.equal(getNextRowIndex(0, 'up', 4), 3);
  assert.equal(getNextCustomerIndex(0, 'down', 5), 1);
  assert.equal(getNextCustomerIndex(0, 'up', 5), 4);

  ordersStore.reset();
  customersStore.reset();
});

test('admin managers render under themed snapshots', async () => {
  const { default: ThemeProvider } = await import('@/components/ThemeProvider');
  const { default: AdminOrdersPage } = await import('@/pages/admin/AdminOrders');
  const { default: AdminCustomersPage } = await import('@/pages/admin/AdminCustomers');

  const renderPage = (themeId) =>
    renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/admin/orders'] },
        React.createElement(
          ThemeProvider,
          { defaultThemeId: themeId },
          React.createElement(React.Fragment, null, [
            React.createElement(AdminOrdersPage, { key: 'orders' }),
            React.createElement(AdminCustomersPage, { key: 'customers' }),
          ])
        )
      )
    );

  const themes = ['default', 'luxury', 'damascus'];
  for (const theme of themes) {
    const markup = renderPage(theme);
    assert.match(markup, /data-page="admin-orders"/, `orders page renders for ${theme}`);
    assert.match(markup, /data-page="admin-customers"/, `customers page renders for ${theme}`);
  }
});
