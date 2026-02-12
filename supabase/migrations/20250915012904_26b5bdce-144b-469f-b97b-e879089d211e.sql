-- Stage 9: Tighten RLS for orders (public read only via RPC)

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

-- Authenticated users can view their own orders through normal auth flow
CREATE POLICY "authenticated_users_can_view_own_orders" ON orders
  FOR SELECT TO authenticated
  USING (
    user_id IN (
      SELECT profiles.id FROM profiles 
      WHERE profiles.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "authenticated_users_can_view_own_order_items" ON order_items
  FOR SELECT TO authenticated
  USING (
    order_id IN (
      SELECT orders.id FROM orders 
      JOIN profiles ON profiles.id = orders.user_id
      WHERE profiles.auth_user_id = auth.uid()
    )
  );

-- Note: Reading orders is now exclusively through the RPC functions
-- which use SECURITY DEFINER to bypass RLS for validated sessions