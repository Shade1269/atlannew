-- ============================================
-- إصلاح إنشاء profile مع referral_code
-- Fix profile creation with referral_code
-- ============================================

-- إنشاء function للبحث عن referral_code (للسماح للمستخدمين غير المصرح لهم)
-- Create function to find referral_code (to allow unauthenticated users)
CREATE OR REPLACE FUNCTION public.get_referrer_by_code(p_referral_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id uuid;
BEGIN
  SELECT id INTO v_referrer_id
  FROM public.profiles
  WHERE referral_code = p_referral_code
    AND is_active = true
  LIMIT 1;
  
  RETURN v_referrer_id;
END;
$$;

-- منح permissions على function للسماح للمستخدمين غير المصرح لهم بالاستخدام
GRANT EXECUTE ON FUNCTION public.get_referrer_by_code(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_referrer_by_code(text) TO authenticated;

-- إنشاء function لإنشاء/تحديث profile مع دعم referral
-- Create function to create/update profile with referral support
CREATE OR REPLACE FUNCTION public.create_or_update_profile(
  p_auth_user_id uuid,
  p_email text,
  p_full_name text,
  p_role user_role DEFAULT 'customer',
  p_referred_by uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id uuid;
BEGIN
  -- Insert or update profile
  INSERT INTO public.profiles (
    auth_user_id,
    email,
    full_name,
    role,
    is_active,
    points,
    level,
    referred_by
  )
  VALUES (
    p_auth_user_id,
    p_email,
    p_full_name,
    p_role,
    true,
    0,
    'bronze',
    p_referred_by
  )
  ON CONFLICT (auth_user_id) 
  DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    role = COALESCE(EXCLUDED.role, profiles.role),
    -- Only update referred_by if it's not already set
    referred_by = COALESCE(profiles.referred_by, EXCLUDED.referred_by),
    updated_at = NOW()
  RETURNING id INTO v_profile_id;
  
  RETURN v_profile_id;
END;
$$;

-- منح permissions على function للسماح للمستخدمين المصرح لهم بالاستخدام
GRANT EXECUTE ON FUNCTION public.create_or_update_profile(uuid, text, text, user_role, uuid) TO authenticated;

-- تحديث handle_new_auth_user trigger لاستخدام referred_by من metadata
-- Update handle_new_auth_user trigger to use referred_by from metadata
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referred_by uuid;
  v_referral_code text;
BEGIN
  -- Get referral_code from metadata if present
  v_referral_code := NEW.raw_user_meta_data->>'referral_code';
  
  -- If referral_code exists, find the referrer
  IF v_referral_code IS NOT NULL AND v_referral_code != '' THEN
    SELECT id INTO v_referred_by
    FROM public.profiles
    WHERE referral_code = v_referral_code
    LIMIT 1;
  END IF;
  
  -- إنشاء profile تلقائياً عند إنشاء مستخدم جديد
  -- Only insert if profile doesn't exist (by auth_user_id or email)
  INSERT INTO public.profiles (
    auth_user_id,
    email,
    phone,
    full_name,
    role,
    is_active,
    points,
    referred_by,
    level
  )
  SELECT 
    NEW.id,
    NEW.email,
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.phone, NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer'),
    true,
    0,
    v_referred_by,
    'bronze'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE auth_user_id = NEW.id OR email = NEW.email
  )
  ON CONFLICT (auth_user_id) DO UPDATE SET
    -- Only update referred_by if it's not already set
    referred_by = COALESCE(profiles.referred_by, EXCLUDED.referred_by),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- ============================================
-- ملاحظة: الكود الخاص (performSignUpRuntime) يجب أن يستخدم
-- create_or_update_profile function بدلاً من upsert المباشر
-- Note: Client code (performSignUpRuntime) should use
-- create_or_update_profile function instead of direct upsert
-- ============================================

