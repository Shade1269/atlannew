-- CRITICAL SECURITY FIXES FOR DATA EXPOSURE (Fixed Version)

-- 1. Secure orders table - CRITICAL CUSTOMER DATA PROTECTION
-- Orders contain sensitive customer PII (names, phone numbers) that must be protected
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Only shop owners can view orders for their shops
CREATE POLICY "Shop owners can view their orders" 
  ON public.orders 
  FOR SELECT 
  USING (
    shop_id IN (
      SELECT s.id 
      FROM shops s 
      JOIN profiles p ON p.id = s.owner_id 
      WHERE p.auth_user_id = auth.uid()
    )
  );

-- Shop owners can update orders for their shops  
CREATE POLICY "Shop owners can update their orders" 
  ON public.orders 
  FOR UPDATE 
  USING (
    shop_id IN (
      SELECT s.id 
      FROM shops s 
      JOIN profiles p ON p.id = s.owner_id 
      WHERE p.auth_user_id = auth.uid()
    )
  );

-- 2. Secure order_items table - extends orders protection
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Only shop owners can view order items for their shops
CREATE POLICY "Shop owners can view their order items" 
  ON public.order_items 
  FOR SELECT 
  USING (
    order_id IN (
      SELECT o.id 
      FROM orders o
      JOIN shops s ON s.id = o.shop_id
      JOIN profiles p ON p.id = s.owner_id 
      WHERE p.auth_user_id = auth.uid()
    )
  );

-- Shop owners can update order items for their shops
CREATE POLICY "Shop owners can update their order items" 
  ON public.order_items 
  FOR UPDATE 
  USING (
    order_id IN (
      SELECT o.id 
      FROM orders o
      JOIN shops s ON s.id = o.shop_id
      JOIN profiles p ON p.id = s.owner_id 
      WHERE p.auth_user_id = auth.uid()
    )
  );

-- 3. Note: channel_member_counts is a view - its security depends on the underlying channel_members table
-- The channel_members table already has proper RLS policies, so the view is automatically secured

-- 4. Review and secure publicly accessible tables
-- Products table - already has proper RLS, keeping active products visible
-- Merchants table - keeping public as these are business listings
-- Shops table - keeping public as these are storefronts  
-- Leaderboard - keeping public as it's competitive data

-- 5. Clean up any problematic views
-- Drop and recreate channel_member_counts without security definer if it exists
DROP VIEW IF EXISTS public.channel_member_counts CASCADE;

-- Recreate the view properly
CREATE VIEW public.channel_member_counts AS
SELECT 
  channel_id,
  COUNT(*) as member_count
FROM public.channel_members
GROUP BY channel_id;

-- Grant access to authenticated users
GRANT SELECT ON public.channel_member_counts TO authenticated;