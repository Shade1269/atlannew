-- ============================================
-- Fix existing profiles that should have referred_by but don't
-- إصلاح الـ profiles الموجودة التي يجب أن يكون لديها referred_by
-- ============================================

-- This migration checks if there are any profiles that were created through referral links
-- but don't have referred_by set. Since we can't retroactively determine the referrer,
-- we'll create a function to manually set referred_by for existing profiles.

-- Create a function to check and report profiles without referred_by
CREATE OR REPLACE FUNCTION public.check_profiles_without_referred_by()
RETURNS TABLE(
  total_profiles INTEGER,
  profiles_with_referred_by INTEGER,
  profiles_without_referred_by INTEGER,
  affiliate_profiles_without_referred_by INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_profiles INTEGER;
  v_profiles_with_referred_by INTEGER;
  v_profiles_without_referred_by INTEGER;
  v_affiliate_profiles_without_referred_by INTEGER;
BEGIN
  -- Count total profiles
  SELECT COUNT(*) INTO v_total_profiles FROM profiles;
  
  -- Count profiles with referred_by
  SELECT COUNT(*) INTO v_profiles_with_referred_by 
  FROM profiles 
  WHERE referred_by IS NOT NULL;
  
  -- Count profiles without referred_by
  SELECT COUNT(*) INTO v_profiles_without_referred_by 
  FROM profiles 
  WHERE referred_by IS NULL;
  
  -- Count affiliate profiles without referred_by
  SELECT COUNT(*) INTO v_affiliate_profiles_without_referred_by 
  FROM profiles 
  WHERE role = 'affiliate' AND referred_by IS NULL;
  
  RETURN QUERY SELECT 
    v_total_profiles,
    v_profiles_with_referred_by,
    v_profiles_without_referred_by,
    v_affiliate_profiles_without_referred_by;
END;
$$;

-- Create a function to manually set referred_by for a profile
-- This can be used to fix existing profiles if we know the referrer
CREATE OR REPLACE FUNCTION public.set_profile_referred_by(
  p_profile_id UUID,
  p_referred_by_profile_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_exists BOOLEAN;
BEGIN
  -- Check if referrer profile exists
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = p_referred_by_profile_id) INTO v_referrer_exists;
  
  IF NOT v_referrer_exists THEN
    RAISE EXCEPTION 'Referrer profile with id % does not exist', p_referred_by_profile_id;
  END IF;
  
  -- Check if profile exists
  IF NOT EXISTS(SELECT 1 FROM profiles WHERE id = p_profile_id) THEN
    RAISE EXCEPTION 'Profile with id % does not exist', p_profile_id;
  END IF;
  
  -- Update referred_by
  UPDATE profiles
  SET referred_by = p_referred_by_profile_id
  WHERE id = p_profile_id;
  
  -- Also update any affiliate_stores for this profile
  UPDATE affiliate_stores
  SET referred_by = p_referred_by_profile_id
  WHERE profile_id = p_profile_id
    AND (referred_by IS NULL OR referred_by != p_referred_by_profile_id);
  
  RETURN TRUE;
END;
$$;

-- Create a function to find profiles that might have been referred (based on creation date and role)
-- This can help identify which profiles might need referred_by set manually
CREATE OR REPLACE FUNCTION public.find_profiles_that_might_need_referred_by()
RETURNS TABLE(
  profile_id UUID,
  auth_user_id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  has_store BOOLEAN,
  store_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS profile_id,
    p.auth_user_id,
    p.email,
    p.full_name,
    p.role,
    p.created_at,
    EXISTS(SELECT 1 FROM affiliate_stores WHERE profile_id = p.id) AS has_store,
    (SELECT id FROM affiliate_stores WHERE profile_id = p.id LIMIT 1) AS store_id
  FROM profiles p
  WHERE p.referred_by IS NULL
    AND p.role = 'affiliate'
    AND p.created_at >= NOW() - INTERVAL '30 days'  -- Profiles created in last 30 days
  ORDER BY p.created_at DESC
  LIMIT 100;
END;
$$;

-- Add comments
COMMENT ON FUNCTION public.check_profiles_without_referred_by IS 'Checks and reports profiles that don''t have referred_by set';
COMMENT ON FUNCTION public.set_profile_referred_by IS 'Manually sets referred_by for a profile and updates related affiliate_stores';
COMMENT ON FUNCTION public.find_profiles_that_might_need_referred_by IS 'Finds affiliate profiles created recently that might need referred_by set manually';

