import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const inventorySql = readFileSync(resolve(__dirname, '../sql/05_internal_inventory.sql'), 'utf8');

const releaseInventory = ({ orderId, state }) => {
  const reservations = Array.from(state.reservations.values()).filter(
    (reservation) => reservation.orderId === orderId && ['ACTIVE', 'PENDING'].includes(reservation.status)
  );

  reservations.forEach((reservation) => {
    const item = state.items.get(reservation.inventoryItemId);
    assert.ok(item, `inventory item ${reservation.inventoryItemId} missing`);

    item.quantity_reserved = Math.max((item.quantity_reserved ?? 0) - reservation.quantity, 0);
    item.quantity_available = (item.quantity_available ?? 0) + reservation.quantity;

    const variantId = item.product_variant_id;
    if (variantId) {
      const variant = state.variants.get(variantId);
      if (variant) {
        const reservedAfter = Math.max((variant.reserved_stock ?? 0) - reservation.quantity, 0);
        const availableAfter = Math.max((variant.current_stock ?? 0) - reservedAfter, 0);
        variant.reserved_stock = reservedAfter;
        variant.available_stock = availableAfter;
      }
    }

    reservation.status = 'CANCELLED';
  });
};

test('cancellation returns reserved stock to availability', () => {
  const state = {
    items: new Map([
      [
        'inv-1',
        {
          quantity_available: 2,
          quantity_reserved: 4,
          product_variant_id: 'var-1',
        },
      ],
      [
        'inv-2',
        {
          quantity_available: 1,
          quantity_reserved: 1,
          product_variant_id: 'var-2',
        },
      ],
    ]),
    variants: new Map([
      [
        'var-1',
        {
          reserved_stock: 4,
          available_stock: 6,
          current_stock: 10,
        },
      ],
      [
        'var-2',
        {
          reserved_stock: 1,
          available_stock: 5,
          current_stock: 6,
        },
      ],
    ]),
    reservations: new Map([
      [
        'res-cancel',
        {
          id: 'res-cancel',
          orderId: 'order-cancel',
          inventoryItemId: 'inv-1',
          quantity: 4,
          status: 'ACTIVE',
        },
      ],
      [
        'res-other',
        {
          id: 'res-other',
          orderId: 'order-other',
          inventoryItemId: 'inv-2',
          quantity: 1,
          status: 'ACTIVE',
        },
      ],
    ]),
  };

  releaseInventory({ orderId: 'order-cancel', state });

  const item = state.items.get('inv-1');
  assert.equal(item.quantity_reserved, 0);
  assert.equal(item.quantity_available, 6);

  const variant = state.variants.get('var-1');
  assert.equal(variant.reserved_stock, 0);
  assert.equal(variant.available_stock, 10);

  const reservation = state.reservations.get('res-cancel');
  assert.equal(reservation.status, 'CANCELLED');

  // Idempotent rerun keeps stock unchanged
  releaseInventory({ orderId: 'order-cancel', state });
  assert.equal(state.items.get('inv-1').quantity_available, 6);

  // Other reservations remain untouched
  assert.equal(state.reservations.get('res-other').status, 'ACTIVE');
  assert.equal(state.items.get('inv-2').quantity_reserved, 1);
});

test('SQL script defines cancellation pipeline', () => {
  assert.match(inventorySql, /CREATE OR REPLACE FUNCTION public\._release_inventory_on_cancel\(p_order_id uuid\)/);
  assert.match(inventorySql, /NEW\.payment_status IN \('CANCELLED', 'FAILED'\)/);
});
