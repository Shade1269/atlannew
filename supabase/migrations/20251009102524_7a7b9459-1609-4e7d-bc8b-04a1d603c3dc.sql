-- Fix v_unified_order_items with correct column names
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