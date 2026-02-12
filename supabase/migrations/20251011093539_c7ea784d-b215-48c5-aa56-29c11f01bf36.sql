-- ============================================================
-- Contract Phase - Triggers فقط (بدون Views المشكلة)
-- ============================================================

-- 1) Triggers لمنع الكتابة في الجداول القديمة
CREATE OR REPLACE FUNCTION public.prevent_legacy_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RAISE EXCEPTION 'جدول % مُجمّد للكتابة. استخدم النظام الموحد الجديد.', TG_TABLE_NAME
    USING HINT = 'راجع ROLLOUT_GUIDE.md للمسارات الجديدة';
END;
$$;

-- تطبيق Triggers
DROP TRIGGER IF EXISTS prevent_orders_write ON public.orders;
CREATE TRIGGER prevent_orders_write
  BEFORE INSERT OR UPDATE OR DELETE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.prevent_legacy_write();

DROP TRIGGER IF EXISTS prevent_simple_orders_write ON public.simple_orders;
CREATE TRIGGER prevent_simple_orders_write
  BEFORE INSERT OR UPDATE OR DELETE ON public.simple_orders
  FOR EACH ROW EXECUTE FUNCTION public.prevent_legacy_write();

DROP TRIGGER IF EXISTS prevent_user_profiles_write ON public.user_profiles;
CREATE TRIGGER prevent_user_profiles_write
  BEFORE INSERT OR UPDATE OR DELETE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_legacy_write();

DROP TRIGGER IF EXISTS prevent_store_pages_write ON public.store_pages;
CREATE TRIGGER prevent_store_pages_write
  BEFORE INSERT OR UPDATE OR DELETE ON public.store_pages
  FOR EACH ROW EXECUTE FUNCTION public.prevent_legacy_write();

COMMENT ON FUNCTION public.prevent_legacy_write IS 'منع الكتابة في الجداول القديمة (Contract Phase)';
