-- ============================================
-- إصلاح: Function Search Path Mutable على auto_generate_referral_code
-- Fix: Set search_path for security (Supabase lint)
-- ============================================

CREATE OR REPLACE FUNCTION public.auto_generate_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'affiliate' AND (NEW.referral_code IS NULL OR NEW.referral_code = '') THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$;
