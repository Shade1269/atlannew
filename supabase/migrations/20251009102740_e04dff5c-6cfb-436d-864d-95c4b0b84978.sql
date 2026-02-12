-- Fix RLS for shipment_status_history table
ALTER TABLE shipment_status_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view shipment history for their orders"
ON shipment_status_history FOR SELECT
USING (
  shipment_id IN (
    SELECT s.id FROM shipments s
    WHERE s.shop_id IN (
      SELECT sh.id FROM shops sh
      JOIN profiles p ON p.id = sh.owner_id
      WHERE p.auth_user_id = auth.uid()
    )
    OR s.order_id IN (
      SELECT oh.id FROM order_hub oh
      WHERE oh.shop_id IN (
        SELECT sh.id FROM shops sh
        JOIN profiles p ON p.id = sh.owner_id
        WHERE p.auth_user_id = auth.uid()
      )
      OR oh.affiliate_store_id IN (
        SELECT ast.id FROM affiliate_stores ast
        JOIN profiles p ON p.id = ast.profile_id
        WHERE p.auth_user_id = auth.uid()
      )
    )
  )
  OR get_current_user_role() = 'admin'
);

CREATE POLICY "System can insert shipment history"
ON shipment_status_history FOR INSERT
WITH CHECK (true);

COMMENT ON POLICY "Users can view shipment history for their orders" 
ON shipment_status_history IS 'Shop owners and affiliates can view shipment history for their orders';