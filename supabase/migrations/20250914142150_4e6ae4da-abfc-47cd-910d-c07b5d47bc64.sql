-- إصلاح search_path للوظيفة الجديدة وتطبيق إعدادات OTP الآمنة

-- إصلاح search_path للوظيفة الجديدة
ALTER FUNCTION public.gen_random_uuid() SET search_path = 'public';

-- تقليل مدة انتهاء صلاحية OTP من الافتراضي (10 دقائق) إلى 5 دقائق للأمان
-- تحديث جدول customer_otp_sessions
ALTER TABLE public.customer_otp_sessions 
ALTER COLUMN expires_at SET DEFAULT (now() + '00:05:00'::interval);

-- إضافة قيد للتأكد من أن مدة انتهاء الصلاحية لا تتجاوز 5 دقائق
CREATE OR REPLACE FUNCTION public.validate_otp_expiry()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  -- التأكد من أن مدة انتهاء الصلاحية لا تتجاوز 5 دقائق
  IF NEW.expires_at > (NEW.created_at + '00:05:00'::interval) THEN
    NEW.expires_at := NEW.created_at + '00:05:00'::interval;
  END IF;
  
  RETURN NEW;
END;
$$;

-- إنشاء trigger لتطبيق التحقق من انتهاء صلاحية OTP
DROP TRIGGER IF EXISTS check_otp_expiry ON public.customer_otp_sessions;
CREATE TRIGGER check_otp_expiry
  BEFORE INSERT OR UPDATE ON public.customer_otp_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_otp_expiry();

-- تنظيف السجلات القديمة المنتهية الصلاحية
DELETE FROM public.customer_otp_sessions WHERE expires_at < now();