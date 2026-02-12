-- Stage 9: Tighten RLS for orders (public read only via RPC) - Fixed

-- Remove existing public read policies for orders and order_items  
DROP POLICY IF EXISTS "public_read_affiliate_orders_limited" ON orders;
DROP POLICY IF EXISTS "public_read_order_items_for_affiliate_orders" ON order_items;

-- Add restrictive policies - no direct SELECT for anon users
-- Orders: anon can only INSERT (for checkout), no direct SELECT
CREATE POLICY "anon_orders_no_direct_select" ON orders
  FOR SELECT TO anon
  USING (false);

-- Order items: anon can only INSERT (for checkout), no direct SELECT  
CREATE POLICY "anon_order_items_no_direct_select" ON order_items
  FOR SELECT TO anon
  USING (false);

-- Authenticated users can view orders they are associated with
-- (This is for dashboard/admin users, not for storefront customers)
CREATE POLICY "authenticated_users_can_view_related_orders" ON orders
  FOR SELECT TO authenticated
  USING (
    -- Admin users can see all orders
    (get_current_user_role() = 'admin') OR
    -- Merchants can see orders for their shops
    (shop_id IN (
      SELECT shops.id FROM shops 
      JOIN profiles ON profiles.id = shops.owner_id
      WHERE profiles.auth_user_id = auth.uid()
    )) OR
    -- Affiliates can see orders for their stores
    (affiliate_store_id IN (
      SELECT affiliate_stores.id FROM affiliate_stores 
      JOIN profiles ON profiles.id = affiliate_stores.profile_id
      WHERE profiles.auth_user_id = auth.uid()
    ))
  );

CREATE POLICY "authenticated_users_can_view_related_order_items" ON order_items  
  FOR SELECT TO authenticated
  USING (
    order_id IN (
      SELECT orders.id FROM orders WHERE (
        -- Admin users can see all order items
        (get_current_user_role() = 'admin') OR
        -- Merchants can see order items for their shop orders
        (shop_id IN (
          SELECT shops.id FROM shops 
          JOIN profiles ON profiles.id = shops.owner_id
          WHERE profiles.auth_user_id = auth.uid()
        )) OR
        -- Affiliates can see order items for their store orders
        (affiliate_store_id IN (
          SELECT affiliate_stores.id FROM affiliate_stores 
          JOIN profiles ON profiles.id = affiliate_stores.profile_id
          WHERE profiles.auth_user_id = auth.uid()
        ))
      )
    )
  );

-- Note: Public storefront customers can only read orders through RPC functions
-- which use SECURITY DEFINER to validate OTP sessions and return appropriate data