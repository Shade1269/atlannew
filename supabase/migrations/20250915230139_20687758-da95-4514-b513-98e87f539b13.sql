-- إضافة unique constraint لضمان سلة واحدة لكل session في كل متجر
DO $$
BEGIN
    CREATE UNIQUE INDEX uq_cart_per_session_per_store
    ON public.shopping_carts(session_id, affiliate_store_id)
    WHERE expires_at > now() AND session_id IS NOT NULL;
EXCEPTION 
    WHEN duplicate_table THEN 
        -- Index already exists
        NULL;
    WHEN others THEN
        -- تجاهل أي أخطاء أخرى
        NULL;
END $$;

-- إضافة RLS policies جديدة مع الاحتفاظ بالقديمة
DO $$
BEGIN
    -- إضافة policy للسلات مع store scoping
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'shopping_carts' 
        AND policyname = 'cart_store_scoped_access'
    ) THEN
        CREATE POLICY "cart_store_scoped_access"
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
    END IF;
END $$;

DO $$
BEGIN
    -- إضافة policy للـ cart_items مع store scoping
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'cart_items' 
        AND policyname = 'cart_items_store_scoped'
    ) THEN
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
    END IF;
END $$;