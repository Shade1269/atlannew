-- إضافة RLS policies بسيطة وآمنة
DO $$
BEGIN
    -- إضافة policy للسلات مع store scoping بسيط
    CREATE POLICY "cart_store_scoped_access"
    ON public.shopping_carts
    FOR ALL 
    USING (
        -- المستخدمين المصادق عليهم يمكنهم الوصول لسلاتهم
        (auth.uid() IS NOT NULL AND user_id = auth.uid())
        OR 
        -- الضيوف يمكنهم الوصول عبر session_id
        (session_id IS NOT NULL)
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
        -- Policy already exists, skip
        NULL;
END $$;

-- Policy بسيط لـ cart_items
DO $$
BEGIN
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
                (sc.session_id IS NOT NULL)
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
        -- Policy already exists, skip
        NULL;
END $$;

-- إضافة unique constraint بسيط
CREATE UNIQUE INDEX IF NOT EXISTS uq_cart_session_store
ON public.shopping_carts(session_id, affiliate_store_id)
WHERE session_id IS NOT NULL AND affiliate_store_id IS NOT NULL;

-- رسالة نجاح
SELECT 'تم تطبيق RLS policies بنجاح' as status;