-- تأكيد وجود الجدول قبل إنشاء السياسة
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'affiliate_store_settings'
  ) THEN
    RAISE EXCEPTION 'Table affiliate_store_settings does not exist';
  END IF;
END$$;

-- إزالة أي سياسة قديمة متعارضة
DROP POLICY IF EXISTS anon_can_read_active_store_settings ON public.affiliate_store_settings;

-- السماح للزوار بقراءة إعدادات المتاجر المفعّلة فقط
CREATE POLICY anon_can_read_active_store_settings
ON public.affiliate_store_settings
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1
    FROM public.affiliate_stores s
    WHERE s.id = affiliate_store_settings.affiliate_store_id
      AND s.is_active = true
  )
);
