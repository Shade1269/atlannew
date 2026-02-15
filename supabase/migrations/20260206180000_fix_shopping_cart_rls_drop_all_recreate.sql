-- ============================================
-- حذف كل سياسات السلة وعناصر السلة وإعادة إنشائها بشكل صحيح
-- Drop ALL policies on shopping_carts & cart_items, then recreate only correct ones
-- ============================================
-- 401 قد ينتج عن عدم منح صلاحيات لـ anon على الجداول — نمنحها صراحة أدناه
-- ============================================

-- 0) منح صلاحيات صريحة لـ anon و authenticated (حتى لا يرد الـ API بـ 401)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shopping_carts TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO anon, authenticated;

ALTER TABLE public.shopping_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- 1) حذف كل السياسات على shopping_carts
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'shopping_carts')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.shopping_carts', r.policyname);
  END LOOP;
END $$;

-- 2) حذف كل السياسات على cart_items
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'cart_items')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.cart_items', r.policyname);
  END LOOP;
END $$;

-- 3) سياسات shopping_carts فقط

-- 3a) anon: الضيف يصل للسلة عبر session_id فقط (التطبيق يرسل anon + session_id)
CREATE POLICY "anon_cart_by_session"
ON public.shopping_carts
FOR ALL
TO anon
USING (session_id IS NOT NULL)
WITH CHECK (session_id IS NOT NULL);

-- 3b) authenticated: المستخدم يصل لسله (بروفايل أو auth.uid أو session) أو سلة متجره
CREATE POLICY "auth_cart_access"
ON public.shopping_carts
FOR ALL
TO authenticated
USING (
  (user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = (select auth.uid())))
  OR (user_id = (select auth.uid()))
  OR (session_id IS NOT NULL)
  OR (affiliate_store_id IN (
    SELECT ast.id FROM public.affiliate_stores ast
    JOIN public.profiles p ON p.id = ast.profile_id
    WHERE p.auth_user_id = (select auth.uid())
  ))
);

-- 4) سياسات cart_items فقط

-- 4a) anon: عناصر السلة عندما السلة لها session_id
CREATE POLICY "anon_cart_items_by_session"
ON public.cart_items
FOR ALL
TO anon
USING (
  cart_id IN (SELECT id FROM public.shopping_carts WHERE session_id IS NOT NULL)
)
WITH CHECK (
  cart_id IN (SELECT id FROM public.shopping_carts WHERE session_id IS NOT NULL)
);

-- 4b) authenticated: عناصر السلة التي يصل لها المستخدم (نفس شروط السلة)
CREATE POLICY "auth_cart_items_access"
ON public.cart_items
FOR ALL
TO authenticated
USING (
  cart_id IN (
    SELECT sc.id FROM public.shopping_carts sc
    WHERE (sc.user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = (select auth.uid())))
       OR (sc.user_id = (select auth.uid()))
       OR (sc.session_id IS NOT NULL)
       OR (sc.affiliate_store_id IN (
         SELECT ast.id FROM public.affiliate_stores ast
         JOIN public.profiles p ON p.id = ast.profile_id
         WHERE p.auth_user_id = (select auth.uid())
       ))
  )
)
WITH CHECK (
  cart_id IN (
    SELECT sc.id FROM public.shopping_carts sc
    WHERE (sc.user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = (select auth.uid())))
       OR (sc.user_id = (select auth.uid()))
       OR (sc.session_id IS NOT NULL)
       OR (sc.affiliate_store_id IN (
         SELECT ast.id FROM public.affiliate_stores ast
         JOIN public.profiles p ON p.id = ast.profile_id
         WHERE p.auth_user_id = (select auth.uid())
       ))
  )
);
