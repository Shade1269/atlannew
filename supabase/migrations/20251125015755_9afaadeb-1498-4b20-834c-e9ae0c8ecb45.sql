-- حذف السياسة الموجودة
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- حذف السياسات القديمة التي تسبب infinite recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Secure profile access" ON public.profiles;
DROP POLICY IF EXISTS "profile_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profile_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profile_update_own" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- إنشاء دالة آمنة للحصول على profile_id من auth.uid()
CREATE OR REPLACE FUNCTION public.get_current_profile_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- إنشاء دالة آمنة للتحقق من صلاحية الأدمن
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = get_current_profile_id()
    AND role = 'admin'
    AND is_active = true
  );
$$;

-- سياسة SELECT بسيطة وآمنة (بدلاً من السياسات المتعددة المتضاربة)
CREATE POLICY "profiles_select_policy"
ON public.profiles
FOR SELECT
USING (
  auth_user_id = auth.uid() 
  OR is_admin()
);

-- سياسة UPDATE بسيطة وآمنة
CREATE POLICY "profiles_update_policy"
ON public.profiles
FOR UPDATE
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());