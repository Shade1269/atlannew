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
    cart_count integer;
BEGIN
    -- الحصول على أول متجر نشط
    SELECT id INTO first_store_id 
    FROM public.affiliate_stores 
    WHERE is_active = true 
    LIMIT 1;
    
    -- التحقق من وجود سلات بحاجة للربط
    SELECT COUNT(*) INTO cart_count
    FROM public.shopping_carts 
    WHERE affiliate_store_id IS NULL;
    
    -- ربط السلات اليتيمة بهذا المتجر
    IF first_store_id IS NOT NULL AND cart_count > 0 THEN
        UPDATE public.shopping_carts 
        SET affiliate_store_id = first_store_id
        WHERE affiliate_store_id IS NULL;
        
        RAISE NOTICE 'تم ربط % سلة تسوق بالمتجر الأول', cart_count;
    END IF;
END $$;

-- إضافة index مبسط للجلسات والمتاجر
CREATE INDEX IF NOT EXISTS idx_cart_session_store 
ON public.shopping_carts(session_id, affiliate_store_id);

-- تحديث الـ RLS policies الموجودة لتدعم store scoping
-- (نحذف القديم ونضيف جديد محسن)
DROP POLICY IF EXISTS "Users can access cart items" ON public.cart_items;

CREATE POLICY "cart_items_enhanced_access"
ON public.cart_items
FOR ALL
USING (
    cart_id IN (
        SELECT sc.id 
        FROM public.shopping_carts sc
        WHERE 
            -- المستخدم المصادق عليه يملك السلة
            ((auth.uid() IS NOT NULL) AND (sc.user_id = auth.uid()))
            OR 
            -- أو الوصول عبر session للضيوف (مؤقت للتوافق مع النظام الحالي)
            (sc.session_id IS NOT NULL)
    )
);

-- رسالة تأكيد
SELECT 
    COUNT(*) as carts_updated,
    'تم تطبيق المرحلة الأولى بنجاح' as status
FROM public.shopping_carts 
WHERE affiliate_store_id IS NOT NULL;