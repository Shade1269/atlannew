-- Fix RLS policies for affiliate_stores to allow public access to active stores
-- إصلاح سياسات RLS للمتاجر التابعة للسماح بالوصول العام للمتاجر النشطة

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "affiliate_select_own_store" ON public.affiliate_stores;
DROP POLICY IF EXISTS "Public can view active affiliate stores" ON public.affiliate_stores;
DROP POLICY IF EXISTS "public can view active stores" ON public.affiliate_stores;
DROP POLICY IF EXISTS "affiliate_insert_own_store" ON public.affiliate_stores;
DROP POLICY IF EXISTS "affiliate_update_own_store" ON public.affiliate_stores;
DROP POLICY IF EXISTS "Affiliates can manage their own stores" ON public.affiliate_stores;
DROP POLICY IF EXISTS "affiliate_select_store_products" ON public.affiliate_stores;
DROP POLICY IF EXISTS "affiliate_manage_store_products" ON public.affiliate_stores;

-- Create separate policies for better control
-- Policy 1: Authenticated users can view their own stores
CREATE POLICY "affiliate_select_own_store"
ON public.affiliate_stores FOR SELECT
TO authenticated
USING (
  profile_id IN (
    SELECT id FROM profiles WHERE auth_user_id = auth.uid()
  )
);

-- Policy 2: Anyone (including anonymous) can view active stores
-- This policy applies to all users (authenticated and anonymous)
CREATE POLICY "public_view_active_stores"
ON public.affiliate_stores FOR SELECT
TO authenticated, anon
USING (is_active = true);

-- Policy 3: Authenticated users can insert their own stores
CREATE POLICY "affiliate_insert_own_store"
ON public.affiliate_stores FOR INSERT
TO authenticated
WITH CHECK (
  profile_id IN (
    SELECT id FROM profiles WHERE auth_user_id = auth.uid()
  )
);

-- Policy 4: Authenticated users can update their own stores
CREATE POLICY "affiliate_update_own_store"
ON public.affiliate_stores FOR UPDATE
TO authenticated
USING (
  profile_id IN (
    SELECT id FROM profiles WHERE auth_user_id = auth.uid()
  )
)
WITH CHECK (
  profile_id IN (
    SELECT id FROM profiles WHERE auth_user_id = auth.uid()
  )
);

