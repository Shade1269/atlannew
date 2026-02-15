-- ============================================
-- إصلاح سياسات RLS للسلة وعناصر السلة
-- Fix shopping_carts & cart_items RLS so items appear for the user
-- السبب: user_id في shopping_carts يشير إلى profiles.id وليس auth.uid()
-- ============================================

-- 1) إنشاء/ربط profile لأي مستخدم في auth.users لا يملك profile (يحل "No profile found" و 401)
-- 1a) ربط صفوف profiles الموجودة (نفس البريد) والتي auth_user_id فيها NULL بالمستخدم من auth.users
UPDATE public.profiles p
SET auth_user_id = au.id,
    updated_at = COALESCE(p.updated_at, NOW())
FROM auth.users au
WHERE p.email = au.email
  AND p.auth_user_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM public.profiles p2 WHERE p2.auth_user_id = au.id);

-- 1b) إدراج profile جديد فقط لمن لا يملك (بعد الربط)، وتجنب تكرار البريد
INSERT INTO public.profiles (
  auth_user_id,
  email,
  phone,
  full_name,
  role,
  is_active,
  points,
  level
)
SELECT
  au.id,
  au.email,
  au.raw_user_meta_data->>'phone',
  COALESCE(au.raw_user_meta_data->>'full_name', au.email),
  COALESCE((au.raw_user_meta_data->>'role')::user_role, 'customer'),
  true,
  0,
  'bronze'
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.auth_user_id = au.id)
ON CONFLICT (email) DO NOTHING;

DROP POLICY IF EXISTS "cart_store_scoped_access" ON public.shopping_carts;
DROP POLICY IF EXISTS "cart_items_store_scoped" ON public.cart_items;
DROP POLICY IF EXISTS "cart_items_enhanced_access" ON public.cart_items;

-- سياسة صريحة لـ anon (طلبات بدون JWT): السماح بالسلة للضيف عبر session_id فقط
DROP POLICY IF EXISTS "anon_guest_shopping_carts" ON public.shopping_carts;
CREATE POLICY "anon_guest_shopping_carts"
    ON public.shopping_carts
    FOR ALL
    TO anon
    USING (session_id IS NOT NULL)
    WITH CHECK (session_id IS NOT NULL);

-- السلة: المستخدم (بروفايله أو auth.uid() مباشرة)، أو الضيف (session_id)، أو صاحب المتجر (affiliate_store_id)
CREATE POLICY "cart_store_scoped_access"
    ON public.shopping_carts
    FOR ALL
    USING (
        ((select auth.uid()) IS NOT NULL AND (
            user_id IN (SELECT id FROM profiles WHERE auth_user_id = (select auth.uid()))
            OR user_id = (select auth.uid())
        ))
        OR (session_id IS NOT NULL)
        OR (affiliate_store_id IN (
            SELECT ast.id FROM affiliate_stores ast
            JOIN profiles p ON p.id = ast.profile_id
            WHERE p.auth_user_id = (select auth.uid())
        ))
    );

-- سياسة صريحة لـ anon: السماح بعناصر السلة عندما السلة نفسها لها session_id
DROP POLICY IF EXISTS "anon_guest_cart_items" ON public.cart_items;
CREATE POLICY "anon_guest_cart_items"
    ON public.cart_items
    FOR ALL
    TO anon
    USING (
        cart_id IN (SELECT id FROM public.shopping_carts WHERE session_id IS NOT NULL)
    )
    WITH CHECK (
        cart_id IN (SELECT id FROM public.shopping_carts WHERE session_id IS NOT NULL)
    );

-- عناصر السلة: نفس الشروط عبر الـ cart (بروفايل أو auth.uid() أو session أو متجر المستخدم)
CREATE POLICY "cart_items_store_scoped"
    ON public.cart_items
    FOR ALL
    USING (
        cart_id IN (
            SELECT sc.id FROM shopping_carts sc
            WHERE ((select auth.uid()) IS NOT NULL AND (
                sc.user_id IN (SELECT id FROM profiles WHERE auth_user_id = (select auth.uid()))
                OR sc.user_id = (select auth.uid())
            ))
               OR (sc.session_id IS NOT NULL)
               OR (sc.affiliate_store_id IN (
                   SELECT ast.id FROM affiliate_stores ast
                   JOIN profiles p ON p.id = ast.profile_id
                   WHERE p.auth_user_id = (select auth.uid())
               ))
        )
    );

CREATE POLICY "cart_items_enhanced_access"
    ON public.cart_items
    FOR ALL
    USING (
        cart_id IN (
            SELECT sc.id FROM public.shopping_carts sc
            WHERE ((select auth.uid()) IS NOT NULL AND (
                sc.user_id IN (SELECT id FROM profiles WHERE auth_user_id = (select auth.uid()))
                OR sc.user_id = (select auth.uid())
            ))
                OR (sc.session_id IS NOT NULL)
                OR (sc.affiliate_store_id IN (
                    SELECT ast.id FROM affiliate_stores ast
                    JOIN profiles p ON p.id = ast.profile_id
                    WHERE p.auth_user_id = (select auth.uid())
                ))
        )
    );
