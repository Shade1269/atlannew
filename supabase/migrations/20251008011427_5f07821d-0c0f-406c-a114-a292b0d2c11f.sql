-- تحديث دالة إنشاء merchant تلقائياً بالبنية الصحيحة
CREATE OR REPLACE FUNCTION public.auto_create_merchant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- إنشاء merchant فقط إذا لم يكن موجوداً
  INSERT INTO public.merchants (
    profile_id,
    business_name,
    default_commission_rate,
    vat_enabled
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.full_name, 'تاجر') || ' - متجر',
    10.00,
    true
  )
  ON CONFLICT (profile_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.auto_create_merchant() IS 'ينشئ سجل merchant تلقائياً عند إنشاء profile جديد (محدّث)';