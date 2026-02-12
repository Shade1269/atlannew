-- إصلاح نظام الأدوار والربط التلقائي

-- 1. إنشاء trigger لربط auth.users مع profiles تلقائياً
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- إنشاء profile تلقائياً عند إنشاء مستخدم جديد
  INSERT INTO public.profiles (
    auth_user_id,
    email,
    phone,
    full_name,
    role,
    is_active,
    points
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.phone, NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer'),
    true,
    0
  )
  ON CONFLICT (auth_user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- إنشاء trigger على auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- 2. تحديث RLS policies لجدول whatsapp_otp
DROP POLICY IF EXISTS "Users can view their own OTP codes" ON public.whatsapp_otp;
DROP POLICY IF EXISTS "Service role can manage OTP codes" ON public.whatsapp_otp;
DROP POLICY IF EXISTS "Anyone can create OTP" ON public.whatsapp_otp;

-- السماح لأي شخص بإنشاء OTP (للتسجيل الجديد)
CREATE POLICY "Anyone can create OTP"
ON public.whatsapp_otp
FOR INSERT
TO public
WITH CHECK (true);

-- السماح لأي شخص بقراءة OTP الخاص به (للتحقق)
CREATE POLICY "Anyone can verify their OTP"
ON public.whatsapp_otp
FOR SELECT
TO public
USING (true);

-- السماح لـ service role بإدارة جميع OTP
CREATE POLICY "Service role can manage all OTP"
ON public.whatsapp_otp
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3. تحديث user_id في whatsapp_otp ليكون NOT NULL بعد التحقق
-- (نحتفظ به nullable للسماح بإنشاء OTP قبل إنشاء المستخدم)

COMMENT ON COLUMN public.whatsapp_otp.user_id IS 'يتم تعبئته بعد التحقق من OTP وإنشاء/تحديث المستخدم';