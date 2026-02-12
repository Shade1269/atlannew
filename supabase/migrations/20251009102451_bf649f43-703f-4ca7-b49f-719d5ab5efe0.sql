-- ═══════════════════════════════════════════════════════════════
-- STAGE 4 PART 1: ORDER HUB UNIFICATION (FINAL FIX)
-- Consolidate all order tables into order_hub as single source
-- ═══════════════════════════════════════════════════════════════

-- Step 1: Add missing columns to order_hub for full unification
ALTER TABLE order_hub
ADD COLUMN IF NOT EXISTS customer_email text,
ADD COLUMN IF NOT EXISTS customer_phone text,
ADD COLUMN IF NOT EXISTS customer_name text,
ADD COLUMN IF NOT EXISTS payment_method text,
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS tracking_number text,
ADD COLUMN IF NOT EXISTS carrier_name text,
ADD COLUMN IF NOT EXISTS estimated_delivery_date timestamptz,
ADD COLUMN IF NOT EXISTS actual_delivery_date timestamptz,
ADD COLUMN IF NOT EXISTS source_table text DEFAULT 'order_hub',
ADD COLUMN IF NOT EXISTS migrated_from_id uuid;

-- Step 2: Create unique constraint for migration tracking
CREATE UNIQUE INDEX IF NOT EXISTS idx_order_hub_migration_unique 
ON order_hub(source_table, migrated_from_id) 
WHERE migrated_from_id IS NOT NULL;

-- Step 3: Create indexes
CREATE INDEX IF NOT EXISTS idx_order_hub_source ON order_hub(source_table);
CREATE INDEX IF NOT EXISTS idx_order_hub_customer_email ON order_hub(customer_email) WHERE customer_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_order_hub_tracking ON order_hub(tracking_number) WHERE tracking_number IS NOT NULL;

-- Step 4: Add helpful comments
COMMENT ON TABLE order_hub IS 'Unified orders table - single source of truth for all orders (merchant, affiliate, ecommerce)';
COMMENT ON COLUMN order_hub.source_table IS 'Original table if migrated (orders/ecommerce_orders/simple_orders)';
COMMENT ON COLUMN order_hub.migrated_from_id IS 'Original record ID if migrated from legacy table';

-- Step 5: Create unified order items view with correct column names
CREATE OR REPLACE VIEW v_unified_order_items AS
-- Items from order_hub's order_items
SELECT 
  oi.id,
  oi.order_id,
  'order_hub' as source_table,
  oi.product_id,
  oi.quantity,
  oi.unit_price_sar as unit_price,
  oi.line_total_sar as total_price,
  oi.created_at
FROM order_items oi
WHERE oi.order_id IN (SELECT id FROM order_hub)

UNION ALL

-- Items from ecommerce_orders (via migration mapping)
SELECT 
  eoi.id,
  oh.id as order_id,
  'ecommerce_orders' as source_table,
  eoi.product_id,
  eoi.quantity,
  eoi.unit_price_sar as unit_price,
  eoi.total_price_sar as total_price,
  eoi.created_at
FROM ecommerce_order_items eoi
JOIN order_hub oh ON oh.migrated_from_id = eoi.order_id AND oh.source_table = 'ecommerce_orders'

UNION ALL

-- Items from simple_orders (via migration mapping)
SELECT 
  soi.id,
  oh.id as order_id,
  'simple_orders' as source_table,
  soi.product_id,
  soi.quantity,
  soi.unit_price_sar as unit_price,
  soi.total_price_sar as total_price,
  soi.created_at
FROM simple_order_items soi
JOIN order_hub oh ON oh.migrated_from_id = soi.order_id AND oh.source_table = 'simple_orders';

-- Grant access
GRANT SELECT ON v_unified_order_items TO authenticated, anon;

COMMENT ON VIEW v_unified_order_items IS 'Unified view of all order items across legacy and unified tables';