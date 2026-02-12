-- إصلاح RLS policies لجدول user_roles (جزء 2)
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (
  user_id IN (
    SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
  )
);

-- إضافة indices لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user_id ON public.profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_otp_phone_verified ON public.whatsapp_otp(phone, verified);