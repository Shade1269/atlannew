import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const inventorySql = readFileSync(resolve(__dirname, '../sql/05_internal_inventory.sql'), 'utf8');

const makeKey = (orderId, inventoryId) => `${orderId}:${inventoryId}`;

const reserveInventory = ({ orderId, orderItems, state }) => {
  const aggregated = new Map();

  orderItems.forEach((item) => {
    if (!item.inventory_item_id) {
      throw new Error(`missing inventory assignment for order item ${item.id}`);
    }
    const key = item.inventory_item_id;
    aggregated.set(key, (aggregated.get(key) ?? 0) + Number(item.quantity ?? 0));
  });

  aggregated.forEach((quantity, inventoryId) => {
    const reservationKey = makeKey(orderId, inventoryId);
    const inventoryItem = state.items.get(inventoryId);
    assert.ok(inventoryItem, `inventory item ${inventoryId} must exist`);

    const existingReservation = state.reservations.get(reservationKey) ?? { quantity: 0 };
    const delta = quantity - existingReservation.quantity;

    if (delta > 0 && (inventoryItem.quantity_available ?? 0) < delta) {
      throw new Error(`insufficient stock for ${inventoryId}`);
    }

    state.reservations.set(reservationKey, {
      orderId,
      inventory_item_id: inventoryId,
      quantity,
      status: 'ACTIVE',
    });

    inventoryItem.quantity_reserved = (inventoryItem.quantity_reserved ?? 0) + delta;
    inventoryItem.quantity_available = Math.max(
      (inventoryItem.quantity_available ?? 0) - delta,
      0
    );

    if (inventoryItem.product_variant_id) {
      const variant = state.variants.get(inventoryItem.product_variant_id);
      if (variant) {
        variant.reserved_stock = Math.max((variant.reserved_stock ?? 0) + delta, 0);
        variant.available_stock = Math.max((variant.available_stock ?? variant.current_stock ?? 0) - delta, 0);
      }
    }
  });
};

test('inventory reservations consolidate items and stay idempotent', () => {
  const state = {
    items: new Map([
      [
        'inv-1',
        {
          quantity_available: 10,
          quantity_reserved: 0,
          product_variant_id: 'var-1',
        },
      ],
      [
        'inv-2',
        {
          quantity_available: 5,
          quantity_reserved: 0,
          product_variant_id: 'var-2',
        },
      ],
    ]),
    variants: new Map([
      [
        'var-1',
        {
          reserved_stock: 0,
          available_stock: 10,
          current_stock: 10,
        },
      ],
      [
        'var-2',
        {
          reserved_stock: 0,
          available_stock: 5,
          current_stock: 5,
        },
      ],
    ]),
    reservations: new Map(),
  };

  const order = {
    id: 'order-1',
    items: [
      { id: 'item-a', inventory_item_id: 'inv-1', quantity: 2 },
      { id: 'item-b', inventory_item_id: 'inv-1', quantity: 1 },
      { id: 'item-c', inventory_item_id: 'inv-2', quantity: 3 },
    ],
  };

  reserveInventory({ orderId: order.id, orderItems: order.items, state });

  const reservationOne = state.reservations.get(makeKey(order.id, 'inv-1'));
  assert.equal(reservationOne.quantity, 3, 'quantities aggregate per inventory item');

  const reservationTwo = state.reservations.get(makeKey(order.id, 'inv-2'));
  assert.equal(reservationTwo.quantity, 3);

  const inventoryOne = state.items.get('inv-1');
  assert.equal(inventoryOne.quantity_available, 7);
  assert.equal(inventoryOne.quantity_reserved, 3);

  const variantOne = state.variants.get('var-1');
  assert.equal(variantOne.reserved_stock, 3);
  assert.equal(variantOne.available_stock, 7);

  const sizeBefore = state.reservations.size;
  reserveInventory({ orderId: order.id, orderItems: order.items, state });
  assert.equal(state.reservations.size, sizeBefore, 'reruns should not add duplicate reservations');
  assert.equal(state.items.get('inv-1').quantity_available, 7, 'idempotent run keeps availability untouched');

  // Increase quantity and rerun to verify delta logic updates records
  order.items[0].quantity = 4;
  reserveInventory({ orderId: order.id, orderItems: order.items, state });
  assert.equal(state.reservations.get(makeKey(order.id, 'inv-1')).quantity, 5);
  assert.equal(state.items.get('inv-1').quantity_available, 5);
  assert.equal(state.items.get('inv-1').quantity_reserved, 5);
});

test('reservations throw when inventory is insufficient', () => {
  const state = {
    items: new Map([
      [
        'inv-short',
        {
          quantity_available: 1,
          quantity_reserved: 0,
          product_variant_id: null,
        },
      ],
    ]),
    variants: new Map(),
    reservations: new Map(),
  };

  const order = {
    id: 'order-err',
    items: [{ id: 'item-x', inventory_item_id: 'inv-short', quantity: 5 }],
  };

  assert.throws(
    () => reserveInventory({ orderId: order.id, orderItems: order.items, state }),
    /insufficient stock/,
    'insufficient inventory should raise an error'
  );
});

test('SQL script defines reservation function and trigger', () => {
  assert.match(inventorySql, /CREATE OR REPLACE FUNCTION public\._reserve_inventory_for_order\(p_order_id uuid\)/);
  assert.match(inventorySql, /CREATE TRIGGER trg_order_item_reserve_inventory/);
  assert.match(inventorySql, /reservation_type, reserved_for, inventory_item_id/);
});
