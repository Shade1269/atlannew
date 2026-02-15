-- ============================================
-- إصلاح: Function Search Path Mutable على link_store_to_referrer
-- Fix: Set search_path for security (Supabase lint)
-- ============================================

CREATE OR REPLACE FUNCTION public.link_store_to_referrer()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_referred_by UUID;
BEGIN
  IF NEW.profile_id IS NOT NULL THEN
    SELECT referred_by INTO v_referred_by
    FROM public.profiles
    WHERE id = NEW.profile_id;

    IF v_referred_by IS NOT NULL AND (NEW.referred_by IS NULL OR NEW.referred_by != v_referred_by) THEN
      NEW.referred_by := v_referred_by;
      RAISE NOTICE 'Trigger: Set referred_by to % for store %', v_referred_by, NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
