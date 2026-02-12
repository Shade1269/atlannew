-- =====================================================
-- CRITICAL SECURITY FIX: Remove dangerous anon_* RLS policies
-- These policies allowed ANY anonymous user to access ALL data
-- =====================================================

-- 1. Fix user_roles table (MOST CRITICAL - privilege escalation)
DROP POLICY IF EXISTS "anon_select_all" ON public.user_roles;
DROP POLICY IF EXISTS "anon_insert_all" ON public.user_roles;
DROP POLICY IF EXISTS "anon_update_all" ON public.user_roles;
DROP POLICY IF EXISTS "anon_delete_all" ON public.user_roles;

-- 2. Fix profiles table (PII exposure)
DROP POLICY IF EXISTS "anon_select_all" ON public.profiles;
DROP POLICY IF EXISTS "anon_insert_all" ON public.profiles;
DROP POLICY IF EXISTS "anon_update_all" ON public.profiles;
DROP POLICY IF EXISTS "anon_delete_all" ON public.profiles;

-- 3. Fix affiliate_payment_info table (financial data exposure)
DROP POLICY IF EXISTS "anon_select_all" ON public.affiliate_payment_info;
DROP POLICY IF EXISTS "anon_insert_all" ON public.affiliate_payment_info;
DROP POLICY IF EXISTS "anon_update_all" ON public.affiliate_payment_info;
DROP POLICY IF EXISTS "anon_delete_all" ON public.affiliate_payment_info;

-- 4. Fix chat tables (data destruction risk)
DROP POLICY IF EXISTS "anon_delete_all" ON public.channels;
DROP POLICY IF EXISTS "anon_delete_all" ON public.chat_messages;
DROP POLICY IF EXISTS "anon_delete_all" ON public.chat_rooms;

-- 5. Add secure policies for user_roles (admin-only management)
CREATE POLICY "admins_manage_roles" ON public.user_roles
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "users_view_own_roles" ON public.user_roles
FOR SELECT
USING (user_id = public.get_current_profile_id());

-- 6. Add secure policies for affiliate_payment_info
CREATE POLICY "users_manage_own_payment_info" ON public.affiliate_payment_info
FOR ALL
USING (profile_id = public.get_current_profile_id())
WITH CHECK (profile_id = public.get_current_profile_id());

CREATE POLICY "admins_view_all_payment_info" ON public.affiliate_payment_info
FOR SELECT
USING (public.is_admin());