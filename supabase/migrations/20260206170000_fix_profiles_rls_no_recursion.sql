-- ============================================
-- إزالة infinite recursion على جدول profiles
-- نحذف كل السياسات على profiles ديناميكياً ثم ننشئ ثلاث سياسات آمنة فقط
-- ============================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', r.policyname);
  END LOOP;
END $$;

-- سياسة SELECT: شرط بسيط فقط (auth_user_id = auth.uid()) — لا استعلام فرعي ولا دالة تقرأ من profiles
CREATE POLICY "profiles_select_own"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth_user_id = (select auth.uid()));

CREATE POLICY "profiles_insert_own"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth_user_id = (select auth.uid()));

CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth_user_id = (select auth.uid()))
WITH CHECK (auth_user_id = (select auth.uid()));
