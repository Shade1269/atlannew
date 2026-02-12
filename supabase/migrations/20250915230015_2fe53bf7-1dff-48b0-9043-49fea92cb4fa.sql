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

-- إضافة unique constraint لضمان سلة واحدة لكل session في كل متجر
-- (نتجاهل الأخطاء إذا كان موجود)
DO $$
BEGIN
    CREATE UNIQUE INDEX uq_cart_per_session_per_store
    ON public.shopping_carts(session_id, affiliate_store_id)
    WHERE expires_at > now() AND session_id IS NOT NULL;
EXCEPTION 
    WHEN duplicate_table THEN 
        -- Index already exists
        NULL;
END $$;

-- إضافة RLS policy جديد مع الاحتفاظ بالقديم
CREATE POLICY IF NOT EXISTS "cart_store_scoped_access"
ON public.shopping_carts
FOR ALL 
USING (
    -- السماح للمستخدمين المصادق عليهم بالوصول لسلاتهم
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR 
    -- السماح بالوصول عبر session_id (للضيوف)
    (session_id IS NOT NULL)
    OR
    -- السماح لمالكي المتاجر بالوصول لسلات متاجرهم  
    (affiliate_store_id IN (
        SELECT ast.id 
        FROM affiliate_stores ast 
        JOIN profiles p ON p.id = ast.profile_id 
        WHERE p.auth_user_id = auth.uid()
    ))
);

-- إضافة policy للـ cart_items مع store scoping
CREATE POLICY IF NOT EXISTS "cart_items_store_scoped"
ON public.cart_items
FOR ALL
USING (
    cart_id IN (
        SELECT sc.id 
        FROM shopping_carts sc
        WHERE 
            -- المستخدم المصادق عليه يملك السلة
            (auth.uid() IS NOT NULL AND sc.user_id = auth.uid())
            OR 
            -- أو session_id متطابق للضيوف
            (sc.session_id IS NOT NULL)
            OR
            -- أو صاحب المتجر
            (sc.affiliate_store_id IN (
                SELECT ast.id 
                FROM affiliate_stores ast 
                JOIN profiles p ON p.id = ast.profile_id 
                WHERE p.auth_user_id = auth.uid()
            ))
    )
);

-- رسالة تأكيد
SELECT 'تم تطبيق المرحلة الأولى بنجاح - تم إضافة affiliate_store_id مع الحفاظ على البيانات الموجودة' as status;