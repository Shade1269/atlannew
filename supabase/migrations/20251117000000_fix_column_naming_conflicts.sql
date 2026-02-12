-- ============================================================================
-- Migration: إصلاح تضارب أسماء الأعمدة في قاعدة البيانات
-- التاريخ: 2025-11-17
-- الهدف: توحيد جميع العلاقات لتستخدم profile_id → profiles(id)
-- ============================================================================

-- ⚠️ هذا Migration حرج جداً - يصلح مشكلة "إصلاح شيء يخرب شيء"

BEGIN;

-- ============================================================================
-- الخطوة 1: التحقق من وجود جدول profiles
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    RAISE EXCEPTION 'جدول profiles غير موجود! يجب إنشاؤه أولاً';
  END IF;
END $$;

-- ============================================================================
-- الخطوة 2: إصلاح جدول affiliate_stores
-- ============================================================================

-- إزالة القيود القديمة إذا كانت موجودة
DO $$
BEGIN
  -- إزالة foreign key القديم إذا كان موجوداً
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name LIKE '%affiliate_stores%user_profile%'
      AND table_name = 'affiliate_stores'
  ) THEN
    ALTER TABLE affiliate_stores DROP CONSTRAINT IF EXISTS affiliate_stores_user_profile_id_fkey;
  END IF;
END $$;

-- إعادة تسمية العمود إذا كان موجوداً بالاسم القديم
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliate_stores'
      AND column_name = 'user_profile_id'
  ) THEN
    -- تحقق من عدم وجود profile_id قبل إعادة التسمية
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'affiliate_stores'
        AND column_name = 'profile_id'
    ) THEN
      ALTER TABLE affiliate_stores RENAME COLUMN user_profile_id TO profile_id;
      RAISE NOTICE 'تم إعادة تسمية user_profile_id إلى profile_id في affiliate_stores';
    ELSE
      RAISE NOTICE 'العمودان موجودان معاً في affiliate_stores - نحتاج دمج';
      -- في هذه الحالة، سننسخ البيانات من user_profile_id إلى profile_id
      UPDATE affiliate_stores
      SET profile_id = user_profile_id
      WHERE profile_id IS NULL AND user_profile_id IS NOT NULL;
      -- ثم نحذف العمود القديم
      ALTER TABLE affiliate_stores DROP COLUMN IF EXISTS user_profile_id;
    END IF;
  END IF;
END $$;

-- إضافة Foreign Key الجديد
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'affiliate_stores_profile_id_fkey'
      AND table_name = 'affiliate_stores'
  ) THEN
    ALTER TABLE affiliate_stores
    ADD CONSTRAINT affiliate_stores_profile_id_fkey
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;
    RAISE NOTICE 'تم إضافة foreign key جديد لـ affiliate_stores → profiles';
  END IF;
END $$;

-- ============================================================================
-- الخطوة 3: إصلاح جدول merchants
-- ============================================================================

DO $$
BEGIN
  -- إزالة foreign key القديم
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name LIKE '%merchants%user_profile%'
      AND table_name = 'merchants'
  ) THEN
    ALTER TABLE merchants DROP CONSTRAINT IF EXISTS merchants_user_profile_id_fkey;
  END IF;

  -- إعادة تسمية العمود
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'merchants'
      AND column_name = 'user_profile_id'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'merchants'
        AND column_name = 'profile_id'
    ) THEN
      ALTER TABLE merchants RENAME COLUMN user_profile_id TO profile_id;
      RAISE NOTICE 'تم إعادة تسمية user_profile_id إلى profile_id في merchants';
    ELSE
      -- دمج البيانات
      UPDATE merchants
      SET profile_id = user_profile_id
      WHERE profile_id IS NULL AND user_profile_id IS NOT NULL;
      ALTER TABLE merchants DROP COLUMN IF EXISTS user_profile_id;
    END IF;
  END IF;

  -- إضافة Foreign Key الجديد
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'merchants_profile_id_fkey'
      AND table_name = 'merchants'
  ) THEN
    ALTER TABLE merchants
    ADD CONSTRAINT merchants_profile_id_fkey
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;
    RAISE NOTICE 'تم إضافة foreign key جديد لـ merchants → profiles';
  END IF;
END $$;

-- ============================================================================
-- الخطوة 4: إصلاح جدول shops (إذا كان موجوداً)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shops') THEN
    -- إزالة foreign key القديم
    ALTER TABLE shops DROP CONSTRAINT IF EXISTS shops_user_profile_id_fkey;

    -- إعادة تسمية العمود
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'shops'
        AND column_name = 'user_profile_id'
    ) THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'shops'
          AND column_name = 'owner_id'
      ) THEN
        ALTER TABLE shops RENAME COLUMN user_profile_id TO owner_id;
      ELSE
        UPDATE shops SET owner_id = user_profile_id WHERE owner_id IS NULL AND user_profile_id IS NOT NULL;
        ALTER TABLE shops DROP COLUMN IF EXISTS user_profile_id;
      END IF;
    END IF;

    -- إضافة Foreign Key
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'shops_owner_id_fkey'
    ) THEN
      ALTER TABLE shops
      ADD CONSTRAINT shops_owner_id_fkey
      FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- الخطوة 5: تحديث الـ Helper Functions
-- ============================================================================

-- حذف الـ functions القديمة وإعادة إنشائها
DROP FUNCTION IF EXISTS public.get_current_user_profile_id() CASCADE;
DROP FUNCTION IF EXISTS public.get_current_user_role() CASCADE;

-- إنشاء get_current_user_profile_id الجديد
CREATE OR REPLACE FUNCTION public.get_current_user_profile_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  -- ✅ الآن يستخدم profiles بدلاً من user_profiles
  SELECT id FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- إنشاء get_current_user_role الجديد
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  -- ✅ الآن يستخدم profiles بدلاً من user_profiles
  SELECT role::TEXT FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_current_user_profile_id() IS 'يحصل على profile_id للمستخدم الحالي من جدول profiles';
COMMENT ON FUNCTION public.get_current_user_role() IS 'يحصل على دور المستخدم الحالي من جدول profiles';

-- ============================================================================
-- الخطوة 6: إعادة إنشاء RLS Policies الأساسية
-- ============================================================================

-- حذف الـ policies القديمة
DROP POLICY IF EXISTS "Merchants can manage their data" ON merchants;
DROP POLICY IF EXISTS "Affiliates can manage their stores" ON affiliate_stores;

-- إنشاء policies جديدة
CREATE POLICY "merchants_manage_own_data" ON merchants
  FOR ALL
  USING (profile_id = get_current_user_profile_id());

CREATE POLICY "affiliates_manage_own_stores" ON affiliate_stores
  FOR ALL
  USING (profile_id = get_current_user_profile_id());

-- ============================================================================
-- الخطوة 7: إنشاء Indexes للأداء
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_affiliate_stores_profile_id
  ON affiliate_stores(profile_id);

CREATE INDEX IF NOT EXISTS idx_merchants_profile_id
  ON merchants(profile_id);

-- ============================================================================
-- الخطوة 8: إضافة تعليقات توثيقية
-- ============================================================================

COMMENT ON COLUMN affiliate_stores.profile_id IS 'FK → profiles(id): المستخدم صاحب المتجر';
COMMENT ON COLUMN merchants.profile_id IS 'FK → profiles(id): المستخدم صاحب حساب التاجر';

-- ============================================================================
-- النهاية: Commit
-- ============================================================================

COMMIT;

-- ✅ تم توحيد جميع العلاقات لتستخدم profile_id → profiles(id)
-- ✅ تم تحديث جميع الـ Helper Functions
-- ✅ تم تحديث RLS Policies الأساسية
-- ✅ تم إضافة Indexes للأداء
