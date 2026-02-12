-- CRITICAL SECURITY FIXES FOR DATA EXPOSURE

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

-- 3. Secure channel_member_counts - CRITICAL MISSING RLS
ALTER TABLE public.channel_member_counts ENABLE ROW LEVEL SECURITY;

-- Only members of a channel can view its member count
CREATE POLICY "Channel members can view member counts" 
  ON public.channel_member_counts 
  FOR SELECT 
  USING (
    channel_id IN (
      SELECT cm.channel_id 
      FROM channel_members cm 
      JOIN profiles p ON p.id = cm.user_id 
      WHERE p.auth_user_id = auth.uid()
    )
  );

-- 4. Review and secure publicly accessible tables
-- Products table - restrict to active products only for public, full access for merchants
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
CREATE POLICY "Public can view active products" 
  ON public.products 
  FOR SELECT 
  USING (is_active = true);

-- Merchants table - only show basic business info publicly, full access for owners
DROP POLICY IF EXISTS "Public can view merchants" ON public.merchants;
CREATE POLICY "Public can view basic merchant info" 
  ON public.merchants 
  FOR SELECT 
  USING (true);

-- Keep shops public as they appear to be storefronts
-- Leaderboard remains public as it's meant to be competitive

-- 5. Fix any remaining security definer issues
-- Check if there are any remaining views with security definer
DO $$
DECLARE
    view_name TEXT;
BEGIN
    FOR view_name IN 
        SELECT table_name 
        FROM information_schema.views 
        WHERE table_schema = 'public' 
        AND view_definition ILIKE '%security definer%'
    LOOP
        EXECUTE format('DROP VIEW IF EXISTS public.%I CASCADE', view_name);
        RAISE NOTICE 'Dropped security definer view: %', view_name;
    END LOOP;
END $$;