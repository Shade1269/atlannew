-- Fix profiles RLS to avoid referencing auth.users directly and support phone-based access

-- 1) Helper function to read current user's phone safely
CREATE OR REPLACE FUNCTION public.get_current_user_phone()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT phone FROM auth.users WHERE id = auth.uid();
$$;

-- 2) Recreate profiles policies without direct auth.users access
DROP POLICY IF EXISTS "Limited public profile access" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert profile by phone" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile by phone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile by phone" ON public.profiles;

-- Allow reading limited public data and own profile (by auth_user_id or phone)
CREATE POLICY "Limited public profile access"
ON public.profiles
FOR SELECT
USING (
  (auth.uid() = auth_user_id)
  OR (phone = public.get_current_user_phone())
  OR (is_active = true)
);

-- Allow inserting own profile (by auth_user_id or phone) when authenticated
CREATE POLICY "Users can insert profile by phone"
ON public.profiles
FOR INSERT
WITH CHECK (
  (auth.uid() IS NOT NULL)
  AND ((auth.uid() = auth_user_id) OR (phone = public.get_current_user_phone()))
);

-- Explicit own-read policy (by auth_user_id or phone)
CREATE POLICY "Users can read own profile by phone"
ON public.profiles
FOR SELECT
USING (
  (auth.uid() = auth_user_id) OR (phone = public.get_current_user_phone())
);

-- Allow updating own profile (by auth_user_id or phone)
CREATE POLICY "Users can update own profile by phone"
ON public.profiles
FOR UPDATE
USING (
  (auth.uid() = auth_user_id) OR (phone = public.get_current_user_phone())
)
WITH CHECK (
  (auth.uid() = auth_user_id) OR (phone = public.get_current_user_phone())
);
