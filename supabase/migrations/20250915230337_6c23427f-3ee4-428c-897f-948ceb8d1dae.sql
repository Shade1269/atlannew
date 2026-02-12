-- إضافة unique constraint لضمان سلة واحدة لكل session في كل متجر
DO $$
BEGIN
    CREATE UNIQUE INDEX uq_cart_per_session_per_store
    ON public.shopping_carts(session_id, affiliate_store_id)
    WHERE expires_at > now() AND session_id IS NOT NULL AND affiliate_store_id IS NOT NULL;
EXCEPTION 
    WHEN duplicate_table THEN 
        -- Index already exists
        NULL;
END $$;

-- إضافة RLS policies جديدة مع أمان محسن
DO $$
BEGIN
    -- Policy للسلات مع store scoping
    DROP POLICY IF EXISTS "cart_store_scoped_access" ON public.shopping_carts;
    CREATE POLICY "cart_store_scoped_access"
    ON public.shopping_carts
    FOR ALL 
    USING (
        -- المستخدمين المصادق عليهم يمكنهم الوصول لسلاتهم
        (auth.uid() IS NOT NULL AND user_id = auth.uid())
        OR 
        -- الضيوف يمكنهم الوصول عبر session_id
        (session_id IS NOT NULL AND auth.uid() IS NULL)
        OR
        -- أصحاب المتاجر يمكنهم الوصول لسلات متاجرهم  
        (affiliate_store_id IN (
            SELECT ast.id 
            FROM affiliate_stores ast 
            JOIN profiles p ON p.id = ast.profile_id 
            WHERE p.auth_user_id = auth.uid()
        ))
    );
EXCEPTION 
    WHEN duplicate_object THEN 
        -- Policy already exists
        NULL;
END $$;

-- Policy محسن لـ cart_items
DO $$
BEGIN
    DROP POLICY IF EXISTS "cart_items_store_scoped" ON public.cart_items;
    CREATE POLICY "cart_items_store_scoped"
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
                -- session_id متطابق للضيوف
                (sc.session_id IS NOT NULL AND auth.uid() IS NULL)
                OR
                -- صاحب المتجر
                (sc.affiliate_store_id IN (
                    SELECT ast.id 
                    FROM affiliate_stores ast 
                    JOIN profiles p ON p.id = ast.profile_id 
                    WHERE p.auth_user_id = auth.uid()
                ))
        )
    );
EXCEPTION 
    WHEN duplicate_object THEN 
        -- Policy already exists
        NULL;
END $$;

-- تحديث cart_items ليشمل affiliate_store_id (عبر join مع shopping_carts)
-- هذا سيساعد في الاستعلامات المستقبلية
CREATE OR REPLACE VIEW public.v_cart_items_with_store AS
SELECT 
    ci.*,
    sc.affiliate_store_id,
    sc.user_id as cart_user_id,
    sc.session_id as cart_session_id
FROM cart_items ci
JOIN shopping_carts sc ON sc.id = ci.cart_id;

-- رسالة نجاح
SELECT 'تم تطبيق RLS policies محسنة مع store-scoping آمن' as status;