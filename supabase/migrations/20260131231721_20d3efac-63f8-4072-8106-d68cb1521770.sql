-- ============================================
-- إصلاح أمني شامل - المرحلة 1: تفعيل RLS
-- ============================================

-- 1. تفعيل RLS على الجداول المعطلة
ALTER TABLE public.merchant_pending_balance ENABLE ROW LEVEL SECURITY;

-- ملاحظة: جدول profiles يحتاج معالجة خاصة لأنه قد يكون لديه سياسات موجودة
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c 
        WHERE c.relname = 'profiles' 
        AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    END IF;
END$$;

-- 2. حذف السياسات المتساهلة الخطيرة (anon_delete_all, anon_insert_all, anon_update_all)
-- هذه السياسات تسمح للجميع بالتعديل والحذف وهي ثغرات أمنية خطيرة

DO $$
DECLARE
    r RECORD;
BEGIN
    -- حذف جميع سياسات anon_delete_all
    FOR r IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND policyname = 'anon_delete_all'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
    
    -- حذف جميع سياسات anon_insert_all
    FOR r IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND policyname = 'anon_insert_all'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
    
    -- حذف جميع سياسات anon_update_all
    FOR r IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND policyname = 'anon_update_all'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END$$;

-- 3. إضافة سياسات آمنة لجدول merchant_pending_balance
DROP POLICY IF EXISTS "Service role can manage merchant_pending_balance" ON public.merchant_pending_balance;
DROP POLICY IF EXISTS "Merchants can view their own pending balance" ON public.merchant_pending_balance;

CREATE POLICY "Service role can manage merchant_pending_balance"
ON public.merchant_pending_balance
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Merchants can view their own pending balance"
ON public.merchant_pending_balance
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = merchant_pending_balance.merchant_id
        AND p.auth_user_id = auth.uid()
    )
);

-- 4. التأكد من وجود سياسات profiles الآمنة
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth_user_id = auth.uid());

-- السماح للمشرفين بعرض جميع الملفات الشخصية (استخدام 'admin' فقط)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.profiles p ON p.id = ur.user_id
        WHERE p.auth_user_id = auth.uid()
        AND ur.role = 'admin'
    )
);