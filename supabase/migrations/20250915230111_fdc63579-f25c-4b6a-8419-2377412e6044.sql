-- المرحلة 1: إضافة affiliate_store_id مع الحفاظ على النظام الحالي
-- إضافة العمود الجديد (nullable في البداية)
ALTER TABLE public.shopping_carts 
ADD COLUMN IF NOT EXISTS affiliate_store_id uuid REFERENCES public.affiliate_stores(id);

-- إضافة index للأداء
CREATE INDEX IF NOT EXISTS idx_shopping_carts_affiliate_store_id 
ON public.shopping_carts(affiliate_store_id);

-- ربط السلات الموجودة بالمتجر الأول (مؤقت لضمان عدم فقدان البيانات)
DO $$
DECLARE
    first_store_id uuid;
BEGIN
    -- الحصول على أول متجر نشط
    SELECT id INTO first_store_id 
    FROM public.affiliate_stores 
    WHERE is_active = true 
    LIMIT 1;
    
    -- ربط السلات اليتيمة بهذا المتجر
    IF first_store_id IS NOT NULL THEN
        UPDATE public.shopping_carts 
        SET affiliate_store_id = first_store_id
        WHERE affiliate_store_id IS NULL;
    END IF;
END $$;