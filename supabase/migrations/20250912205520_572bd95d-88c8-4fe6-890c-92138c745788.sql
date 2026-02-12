-- إصلاح مشاكل الأمان في قاعدة البيانات

-- 1. إصلاح دوال قاعدة البيانات لإضافة search_path
CREATE OR REPLACE FUNCTION public.has_any_role(user_id uuid, allowed_roles text[])
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE auth_user_id = user_id 
    AND role::text = ANY(allowed_roles)
    AND is_active = true
  );
$function$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND is_active = true
  )
$function$;

CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id uuid)
 RETURNS SETOF user_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
    AND is_active = true
$function$;

CREATE OR REPLACE FUNCTION public.get_primary_role(_user_id uuid)
 RETURNS user_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
    AND is_active = true
  ORDER BY 
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'merchant' THEN 2
      WHEN 'affiliate' THEN 3
      WHEN 'moderator' THEN 4
      WHEN 'customer' THEN 5
    END
  LIMIT 1
$function$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT get_primary_role(auth.uid())::text),
    'customer'::text
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_user_role_cached(user_id uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(get_primary_role(user_id)::text, 'customer'::text);
$function$;

-- 2. تقليل مدة انتهاء صلاحية OTP إلى 5 دقائق بدلاً من 10
ALTER TABLE public.customer_otp_sessions 
ALTER COLUMN expires_at SET DEFAULT (now() + '00:05:00'::interval);

-- 3. إنشاء جدول لتتبع محاولات تسجيل الدخول المشبوهة
CREATE TABLE IF NOT EXISTS public.security_login_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  ip_address inet,
  user_agent text,
  attempt_type text NOT NULL, -- 'success', 'failed', 'blocked'
  reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- تمكين RLS
ALTER TABLE public.security_login_attempts ENABLE ROW LEVEL SECURITY;

-- سياسة للوصول
CREATE POLICY "Admins can view all login attempts"
ON public.security_login_attempts
FOR SELECT
USING (get_current_user_role() = 'admin');

-- 4. إنشاء دالة لتسجيل محاولات تسجيل الدخول
CREATE OR REPLACE FUNCTION public.log_login_attempt(
  p_user_id uuid DEFAULT NULL,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_attempt_type text DEFAULT 'failed',
  p_reason text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO public.security_login_attempts (
    user_id,
    ip_address, 
    user_agent,
    attempt_type,
    reason,
    metadata
  ) VALUES (
    p_user_id,
    p_ip_address,
    p_user_agent, 
    p_attempt_type,
    p_reason,
    p_metadata
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$function$;