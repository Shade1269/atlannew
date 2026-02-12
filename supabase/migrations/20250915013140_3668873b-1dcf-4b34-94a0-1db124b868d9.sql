-- Stage 9: Tighten RLS for orders (fix column references)

-- Remove existing public read policies for orders and order_items
DROP POLICY IF EXISTS "public_read_affiliate_orders_limited" ON orders;
DROP POLICY IF EXISTS "public_read_order_items_for_affiliate_orders" ON order_items;

-- Remove any existing restrictive policies if they exist
DROP POLICY IF EXISTS "anon_orders_no_direct_select" ON orders;
DROP POLICY IF EXISTS "anon_order_items_no_direct_select" ON order_items;
DROP POLICY IF EXISTS "authenticated_users_can_view_own_orders" ON orders;
DROP POLICY IF EXISTS "authenticated_users_can_view_own_order_items" ON order_items;

-- Add restrictive policies - no direct SELECT for anon users
-- Orders: anon can only INSERT (for checkout), no direct SELECT
CREATE POLICY "anon_orders_no_direct_select" ON orders
  FOR SELECT TO anon
  USING (false);

-- Order items: anon can only INSERT (for checkout), no direct SELECT  
CREATE POLICY "anon_order_items_no_direct_select" ON order_items
  FOR SELECT TO anon
  USING (false);

-- Authenticated users can view orders through normal auth flow if customer_profile_id matches
CREATE POLICY "authenticated_users_can_view_own_orders" ON orders
  FOR SELECT TO authenticated
  USING (
    customer_profile_id IN (
      SELECT profiles.id FROM profiles 
      WHERE profiles.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "authenticated_users_can_view_own_order_items" ON order_items
  FOR SELECT TO authenticated
  USING (
    order_id IN (
      SELECT orders.id FROM orders 
      JOIN profiles ON profiles.id = orders.customer_profile_id
      WHERE profiles.auth_user_id = auth.uid()
    )
  );

-- Note: Reading orders for storefront customers is now exclusively 
-- through the RPC functions which use SECURITY DEFINER to bypass RLS 
-- for validated OTP sessions