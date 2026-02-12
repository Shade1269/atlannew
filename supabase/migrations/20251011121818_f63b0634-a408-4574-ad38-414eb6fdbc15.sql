-- إصلاح سياسة RLS لـ affiliate_store_settings للسماح للزوار بقراءة إعدادات المتاجر النشطة
DROP POLICY IF EXISTS anon_can_read_active_store_settings ON public.affiliate_store_settings;

CREATE POLICY anon_can_read_active_store_settings
ON public.affiliate_store_settings
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.affiliate_stores s
    WHERE s.id = affiliate_store_settings.store_id
      AND s.is_active = true
  )
);