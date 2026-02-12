-- ═══════════════════════════════════════════════════════════════
-- STAGE 4 PART 2: SHIPPING UNIFICATION
-- Consolidate shipments tables into unified shipping system
-- ═══════════════════════════════════════════════════════════════

-- Step 1: Add source tracking columns to shipments
ALTER TABLE shipments
ADD COLUMN IF NOT EXISTS source_table text DEFAULT 'shipments',
ADD COLUMN IF NOT EXISTS migrated_from_id uuid;

-- Step 2: Create unique constraint for migration tracking
CREATE UNIQUE INDEX IF NOT EXISTS idx_shipments_migration_unique 
ON shipments(source_table, migrated_from_id) 
WHERE migrated_from_id IS NOT NULL;

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number ON shipments(tracking_number) WHERE tracking_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_shop_id ON shipments(shop_id);

-- Step 4: Add comments
COMMENT ON TABLE shipments IS 'Unified shipments table - single source for all shipping records';
COMMENT ON COLUMN shipments.source_table IS 'Original table if migrated (shipments/shipments_tracking)';
COMMENT ON COLUMN shipments.migrated_from_id IS 'Original record ID if migrated';

-- Step 5: Create unified shipments view
CREATE OR REPLACE VIEW v_unified_shipments AS
-- Main shipments records
SELECT 
  s.id,
  s.shipment_number,
  s.order_id,
  s.shop_id,
  s.tracking_number,
  s.status,
  s.current_location,
  s.recipient_name,
  s.recipient_phone,
  s.recipient_address,
  s.estimated_delivery,
  s.actual_delivery_date,
  s.shipping_cost,
  s.cash_on_delivery as cod_amount,
  s.weight_kg,
  s.dimensions,
  s.special_instructions,
  'shipments' as source_table,
  s.created_at,
  s.updated_at
FROM shipments s
WHERE s.source_table = 'shipments' OR s.source_table IS NULL

UNION ALL

-- Shipments_tracking records (mapped through migration)
SELECT 
  s.id,
  s.shipment_number,
  st.order_id,
  NULL as shop_id,
  st.tracking_number,
  st.current_status as status,
  st.current_location,
  st.customer_name as recipient_name,
  st.customer_phone as recipient_phone,
  st.delivery_address as recipient_address,
  st.estimated_delivery_date::timestamptz as estimated_delivery,
  st.actual_delivery_date::timestamptz as actual_delivery_date,
  st.shipping_cost_sar as shipping_cost,
  st.cod_amount_sar as cod_amount,
  st.weight_kg,
  st.dimensions,
  st.special_instructions,
  'shipments_tracking' as source_table,
  st.created_at,
  st.updated_at
FROM shipments_tracking st
JOIN shipments s ON s.migrated_from_id = st.id AND s.source_table = 'shipments_tracking';

-- Grant access
GRANT SELECT ON v_unified_shipments TO authenticated, anon;

COMMENT ON VIEW v_unified_shipments IS 'Unified view of all shipments across different tracking systems';

-- Step 6: Create shipment events table if needed
CREATE TABLE IF NOT EXISTS shipment_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  status text NOT NULL,
  location text,
  description text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shipment_status_history_shipment 
ON shipment_status_history(shipment_id, created_at DESC);

COMMENT ON TABLE shipment_status_history IS 'Historical tracking of shipment status changes';