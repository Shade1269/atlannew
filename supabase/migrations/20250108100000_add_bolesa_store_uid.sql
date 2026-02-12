-- إضافة حقل bolesa_store_uid في جدول affiliate_stores
-- هذا الحقل يحتوي على معرف المتجر في Bolesa ShipLink (store_uid)
-- مثال: "3-bd8y677e-1545-3"

ALTER TABLE public.affiliate_stores 
ADD COLUMN IF NOT EXISTS bolesa_store_uid TEXT;

COMMENT ON COLUMN public.affiliate_stores.bolesa_store_uid IS 'معرف المتجر في Bolesa ShipLink (store_uid) - يستخدم لإنشاء AWB';

-- إضافة الحقل في جدول shops أيضاً
ALTER TABLE public.shops 
ADD COLUMN IF NOT EXISTS bolesa_store_uid TEXT;

COMMENT ON COLUMN public.shops.bolesa_store_uid IS 'معرف المتجر في Bolesa ShipLink (store_uid) - يستخدم لإنشاء AWB';

-- إضافة الحقل في جدول store_settings كخيار إضافي
ALTER TABLE public.store_settings 
ADD COLUMN IF NOT EXISTS bolesa_store_uid TEXT;

COMMENT ON COLUMN public.store_settings.bolesa_store_uid IS 'معرف المتجر في Bolesa ShipLink (store_uid) - يستخدم لإنشاء AWB';
