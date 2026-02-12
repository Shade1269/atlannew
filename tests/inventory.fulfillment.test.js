import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const inventorySql = readFileSync(resolve(__dirname, '../sql/05_internal_inventory.sql'), 'utf8');

const fulfillInventory = ({ orderId, state }) => {
  const reservations = Array.from(state.reservations.values()).filter(
    (reservation) => reservation.orderId === orderId && ['ACTIVE', 'PENDING'].includes(reservation.status)
  );

  reservations.forEach((reservation) => {
    const item = state.items.get(reservation.inventoryItemId);
    assert.ok(item, `expected inventory item ${reservation.inventoryItemId}`);

    item.quantity_reserved = Math.max((item.quantity_reserved ?? 0) - reservation.quantity, 0);

    const variantId = item.product_variant_id;
    if (variantId) {
      const variant = state.variants.get(variantId);
      if (variant) {
        const reservedAfter = Math.max((variant.reserved_stock ?? 0) - reservation.quantity, 0);
        const currentAfter = Math.max((variant.current_stock ?? 0) - reservation.quantity, 0);
        const availableAfter = Math.max(currentAfter - reservedAfter, 0);

        variant.reserved_stock = reservedAfter;
        variant.current_stock = currentAfter;
        variant.available_stock = availableAfter;
      }
    }

    const movementNumber = `OUT-${reservation.id}`;
    if (!state.movements.has(movementNumber)) {
      state.movements.set(movementNumber, {
        orderId,
        inventoryItemId: reservation.inventoryItemId,
        quantity: reservation.quantity,
      });
    }

    reservation.status = 'FULFILLED';
  });
};

test('fulfillment consumes reserved stock and is idempotent', () => {
  const state = {
    items: new Map([
      [
        'inv-1',
        {
          quantity_available: 5,
          quantity_reserved: 5,
          product_variant_id: 'var-1',
        },
      ],
      [
        'inv-2',
        {
          quantity_available: 8,
          quantity_reserved: 2,
          product_variant_id: 'var-2',
        },
      ],
    ]),
    variants: new Map([
      [
        'var-1',
        {
          reserved_stock: 5,
          current_stock: 15,
          available_stock: 10,
        },
      ],
      [
        'var-2',
        {
          reserved_stock: 2,
          current_stock: 6,
          available_stock: 4,
        },
      ],
    ]),
    reservations: new Map([
      [
        'res-1',
        {
          id: 'res-1',
          orderId: 'order-1',
          inventoryItemId: 'inv-1',
          quantity: 5,
          status: 'ACTIVE',
        },
      ],
      [
        'res-2',
        {
          id: 'res-2',
          orderId: 'order-2',
          inventoryItemId: 'inv-2',
          quantity: 2,
          status: 'ACTIVE',
        },
      ],
    ]),
    movements: new Map(),
  };

  fulfillInventory({ orderId: 'order-1', state });

  assert.equal(state.items.get('inv-1').quantity_reserved, 0);
  assert.equal(state.items.get('inv-1').quantity_available, 5, 'available stays untouched after fulfillment');

  const variantOne = state.variants.get('var-1');
  assert.equal(variantOne.reserved_stock, 0);
  assert.equal(variantOne.current_stock, 10);
  assert.equal(variantOne.available_stock, 10);

  const movement = state.movements.get('OUT-res-1');
  assert.ok(movement, 'movement inserted for fulfilled reservation');
  assert.equal(movement.quantity, 5);

  const reservation = state.reservations.get('res-1');
  assert.equal(reservation.status, 'FULFILLED');

  // Second run should not change anything or create duplicate movements
  fulfillInventory({ orderId: 'order-1', state });
  assert.equal(state.movements.size, 1, 'idempotent rerun keeps movement count');
  assert.equal(state.items.get('inv-1').quantity_reserved, 0);

  // Other orders remain pending
  assert.equal(state.reservations.get('res-2').status, 'ACTIVE');
});

test('SQL script defines fulfillment pipeline', () => {
  assert.match(inventorySql, /CREATE OR REPLACE FUNCTION public\._fulfill_inventory_on_paid\(p_order_id uuid\)/);
  assert.match(inventorySql, /v_movement_number := 'OUT-' \|\| v_rec\.id/);
});
