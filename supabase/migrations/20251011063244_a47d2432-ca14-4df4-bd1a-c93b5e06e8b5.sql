-- ============================================================================
-- المرحلة 4(ج): توحيد نظام الهوية (Identity Consolidation) - مُصحّح
-- الهدف: اعتماد profiles كمصدر وحيد للحقيقة (SSOT)
-- المخاطر: عالية - تتعلق بالهوية والأمان
-- ============================================================================

-- الخطوة 1: إضافة أعمدة مفقودة إلى profiles
-- ============================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'bio'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN bio TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'level'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN level user_level DEFAULT 'bronze';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'total_earnings'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN total_earnings NUMERIC DEFAULT 0;
  END IF;
END $$;

-- الخطوة 2: ترحيل البيانات من user_profiles (الأعمدة الموجودة فقط)
-- ============================================================================

-- نسخ البيانات من user_profiles - نسخ فقط الأعمدة المشتركة
UPDATE public.profiles p
SET 
  avatar_url = COALESCE(p.avatar_url, up.avatar_url),
  level = COALESCE(p.level, up.level),
  total_earnings = COALESCE(p.total_earnings, up.total_earnings),
  points = COALESCE(p.points, up.points)
FROM public.user_profiles up
WHERE p.auth_user_id = up.auth_user_id
  AND up.auth_user_id IS NOT NULL;

-- الخطوة 3: إنشاء view للتوافق الخلفي
-- ============================================================================

CREATE OR REPLACE VIEW public.user_profiles_compat AS
SELECT 
  p.id,
  p.auth_user_id,
  p.email,
  p.full_name,
  p.phone,
  p.avatar_url,
  p.bio,
  p.role,
  p.level,
  p.points,
  p.total_earnings,
  p.is_active,
  p.created_at,
  p.updated_at,
  p.last_activity_at
FROM public.profiles p;

COMMENT ON VIEW public.user_profiles_compat IS 
'توافق خلفي مع user_profiles - يستخدم profiles كمصدر';

-- الخطوة 4: دوال موحدة للوصول
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_profile(_auth_user_id UUID)
RETURNS TABLE (
  id UUID,
  auth_user_id UUID,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  role user_role,
  level user_level,
  points INTEGER,
  total_earnings NUMERIC,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id, p.auth_user_id, p.email, p.full_name, p.phone,
    p.avatar_url, p.bio, p.role, p.level, p.points,
    p.total_earnings, p.is_active, p.created_at,
    p.updated_at, p.last_activity_at
  FROM public.profiles p
  WHERE p.auth_user_id = _auth_user_id;
$$;

CREATE OR REPLACE FUNCTION public.get_current_profile()
RETURNS TABLE (
  id UUID,
  auth_user_id UUID,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  role user_role,
  level user_level,
  points INTEGER,
  total_earnings NUMERIC,
  is_active BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id, p.auth_user_id, p.email, p.full_name, p.phone,
    p.avatar_url, p.bio, p.role, p.level, p.points,
    p.total_earnings, p.is_active
  FROM public.profiles p
  WHERE p.auth_user_id = auth.uid();
$$;

-- الخطوة 5: indexes للأداء
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_auth_user_id 
  ON public.profiles(auth_user_id) WHERE auth_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_email 
  ON public.profiles(email) WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_phone 
  ON public.profiles(phone) WHERE phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_role 
  ON public.profiles(role);

CREATE INDEX IF NOT EXISTS idx_profiles_is_active 
  ON public.profiles(is_active) WHERE is_active = true;

-- الخطوة 6: RLS policies محدّثة
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can select own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth_user_id = auth.uid());

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "Admins can select all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (get_current_user_role() = 'admin');

-- الخطوة 7: function لفحص orphans
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_profile_orphans()
RETURNS TABLE (
  check_type TEXT,
  orphan_count BIGINT,
  details JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'profiles_without_auth_user'::TEXT,
    COUNT(*)::BIGINT,
    jsonb_build_object(
      'count', COUNT(*),
      'sample_ids', (
        SELECT jsonb_agg(id) 
        FROM (SELECT id FROM profiles WHERE auth_user_id IS NULL LIMIT 5) s
      )
    )
  FROM profiles
  WHERE auth_user_id IS NULL;

  RETURN QUERY
  SELECT 
    'profiles_with_invalid_auth_user'::TEXT,
    COUNT(*)::BIGINT,
    jsonb_build_object(
      'count', COUNT(*),
      'sample_ids', (
        SELECT jsonb_agg(p.id) 
        FROM (
          SELECT p.id 
          FROM profiles p
          LEFT JOIN auth.users u ON u.id = p.auth_user_id
          WHERE p.auth_user_id IS NOT NULL AND u.id IS NULL 
          LIMIT 5
        ) p
      )
    )
  FROM profiles p
  LEFT JOIN auth.users u ON u.id = p.auth_user_id
  WHERE p.auth_user_id IS NOT NULL AND u.id IS NULL;
END;
$$;