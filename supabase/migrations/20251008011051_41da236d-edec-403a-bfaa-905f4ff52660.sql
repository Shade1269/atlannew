-- إنشاء دالة لإنشاء merchant تلقائياً
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
    business_license,
    is_active
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.full_name, 'تاجر') || ' - متجر',
    'AUTO-' || SUBSTRING(NEW.id::TEXT, 1, 8),
    true
  )
  ON CONFLICT (profile_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- إنشاء trigger يستدعي الدالة عند إضافة profile جديد
DROP TRIGGER IF EXISTS trigger_auto_create_merchant ON public.profiles;

CREATE TRIGGER trigger_auto_create_merchant
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_merchant();

-- تعليق توضيحي
COMMENT ON FUNCTION public.auto_create_merchant() IS 'ينشئ سجل merchant تلقائياً عند إنشاء profile جديد';
COMMENT ON TRIGGER trigger_auto_create_merchant ON public.profiles IS 'يستدعي auto_create_merchant() لإنشاء merchant تلقائياً';