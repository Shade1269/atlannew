-- ============================================
-- إصلاح: Function Search Path Mutable على is_admin
-- Fix: Set search_path for security (Supabase lint)
-- ============================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = public.get_current_profile_id()
      AND role = 'admin'
      AND is_active = true
  );
$$;
