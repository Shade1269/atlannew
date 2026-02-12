-- إضافة حقل bolesa_vendor_id في جدول affiliate_stores
-- هذا الحقل يحتوي على رقم المتجر في Bolesa (vendor_id)
-- ملاحظة: vendor_id يجب أن يأتي من Bolesa API عند تسجيل المتجر

ALTER TABLE public.affiliate_stores 
ADD COLUMN IF NOT EXISTS bolesa_vendor_id INTEGER;

COMMENT ON COLUMN public.affiliate_stores.bolesa_vendor_id IS 'رقم المتجر في Bolesa (vendor_id) - يجب الحصول عليه من Bolesa API';

-- إضافة الحقل في جدول shops أيضاً
ALTER TABLE public.shops 
ADD COLUMN IF NOT EXISTS bolesa_vendor_id INTEGER;

COMMENT ON COLUMN public.shops.bolesa_vendor_id IS 'رقم المتجر في Bolesa (vendor_id) - يجب الحصول عليه من Bolesa API';

-- إضافة الحقل في جدول store_settings كخيار إضافي
ALTER TABLE public.store_settings 
ADD COLUMN IF NOT EXISTS bolesa_vendor_id INTEGER;

COMMENT ON COLUMN public.store_settings.bolesa_vendor_id IS 'رقم المتجر في Bolesa (vendor_id) - يجب الحصول عليه من Bolesa API';
