import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pipelineSql = readFileSync(resolve(__dirname, '../sql/03_commissions_pipeline.sql'), 'utf8');

const roundCurrency = (value) => Math.round(value * 100) / 100;

const resolveCommissionRate = (item, products, merchants) => {
  const explicit = item.commission_rate ?? null;
  if (explicit && Number(explicit) !== 0) {
    return Number(explicit);
  }

  const product = products.get(item.product_id) ?? null;
  if (product) {
    const productRate = product.commission_rate ?? null;
    if (productRate && Number(productRate) !== 0) {
      return Number(productRate);
    }

    const merchant = merchants.get(product.merchant_id ?? '') ?? null;
    if (merchant) {
      const merchantRate = merchant.default_commission_rate ?? null;
      if (merchantRate && Number(merchantRate) !== 0) {
        return Number(merchantRate);
      }
    }
  }

  return 0;
};

const runCommissionPipeline = ({
  order,
  orderItems,
  commissions,
  products,
  merchants,
  affiliateStore,
}) => {
  const affiliateId = affiliateStore?.profile_id ?? null;

  orderItems.forEach((item) => {
    const rate = Math.max(resolveCommissionRate(item, products, merchants), 0);
    const amount = roundCurrency(item.total_price_sar * (rate / 100));
    const existing = commissions.get(item.id) ?? null;

    const updated = {
      order_id: order.id,
      order_item_id: item.id,
      affiliate_id: affiliateId,
      affiliate_profile_id: affiliateId,
      commission_rate: rate,
      amount_sar: amount,
      status: existing?.status ?? 'PENDING',
    };

    commissions.set(item.id, { ...existing, ...updated });
  });

  let aggregate = 0;
  commissions.forEach((record) => {
    if (record.order_id === order.id) {
      aggregate += record.amount_sar;
    }
  });
  order.affiliate_commission_sar = roundCurrency(aggregate);
};

test('commission rate precedence and idempotency match the SQL contract', () => {
  const merchant = { id: 'merchant-1', default_commission_rate: 5 };
  const merchants = new Map([[merchant.id, merchant]]);

  const products = new Map([
    ['product-item-rate', { id: 'product-item-rate', merchant_id: merchant.id, commission_rate: 10 }],
    ['product-product-rate', { id: 'product-product-rate', merchant_id: merchant.id, commission_rate: 8 }],
    ['product-merchant-rate', { id: 'product-merchant-rate', merchant_id: merchant.id, commission_rate: null }],
  ]);

  const order = { id: 'order-1', payment_status: 'PAID', affiliate_commission_sar: 0 };
  const orderItems = [
    { id: 'item-explicit', order_id: order.id, product_id: 'product-item-rate', total_price_sar: 100, commission_rate: 12 },
    { id: 'item-product', order_id: order.id, product_id: 'product-product-rate', total_price_sar: 200, commission_rate: null },
    { id: 'item-merchant', order_id: order.id, product_id: 'product-merchant-rate', total_price_sar: 50, commission_rate: 0 },
  ];

  const affiliateStore = { id: 'store-1', profile_id: 'affiliate-profile-1' };
  const commissions = new Map();

  runCommissionPipeline({ order, orderItems, commissions, products, merchants, affiliateStore });

  assert.equal(order.affiliate_commission_sar, 30.5);

  const explicit = commissions.get('item-explicit');
  assert.ok(explicit, 'expected commission row for explicit rate item');
  assert.equal(explicit.commission_rate, 12);
  assert.equal(explicit.amount_sar, 12);
  assert.equal(explicit.status, 'PENDING');
  assert.equal(explicit.affiliate_id, affiliateStore.profile_id);
  assert.equal(explicit.affiliate_profile_id, affiliateStore.profile_id);

  const productRate = commissions.get('item-product');
  assert.ok(productRate, 'expected commission row for product rate fallback');
  assert.equal(productRate.commission_rate, 8);
  assert.equal(productRate.amount_sar, 16);

  const merchantRate = commissions.get('item-merchant');
  assert.ok(merchantRate, 'expected commission row for merchant rate fallback');
  assert.equal(merchantRate.commission_rate, 5);
  assert.equal(merchantRate.amount_sar, 2.5);

  const rowCountBeforeRerun = commissions.size;
  runCommissionPipeline({ order, orderItems, commissions, products, merchants, affiliateStore });
  assert.equal(commissions.size, rowCountBeforeRerun, 'idempotent reruns should not add rows');
  assert.equal(commissions.get('item-explicit').amount_sar, 12);

  orderItems[0].commission_rate = 20;
  runCommissionPipeline({ order, orderItems, commissions, products, merchants, affiliateStore });
  assert.equal(commissions.get('item-explicit').commission_rate, 20);
  assert.equal(commissions.get('item-explicit').amount_sar, 20);
  assert.equal(order.affiliate_commission_sar, 38.5);
});

test('SQL script wires the payment triggers and upsert contract', () => {
  assert.match(pipelineSql, /CREATE OR REPLACE FUNCTION public\._mark_order_paid_from_tx\(\)/);
  assert.match(pipelineSql, /CREATE TRIGGER trg_tx_to_order_paid/);
  assert.match(pipelineSql, /CREATE OR REPLACE FUNCTION public\._on_order_paid_generate_commissions\(\)/);
  assert.match(pipelineSql, /CREATE TRIGGER trg_order_paid_generate_commissions/);
  assert.match(pipelineSql, /ON CONFLICT \(order_item_id\)\s+DO UPDATE SET/);
  assert.match(pipelineSql, /SET affiliate_commission_sar = COALESCE\(/);
});
