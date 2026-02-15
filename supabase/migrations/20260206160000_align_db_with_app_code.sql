-- ============================================
-- مواءمة قاعدة البيانات مع الكود (بدون تغيير كود التطبيق)
-- Align database with application code
-- ============================================
-- في قاعدة البيانات: دور "مسوق" يُخزَّن كـ affiliate (والكود يعرض affiliate → مسوق)
-- إصلاح: لو ظهر "مستخدم" رغم أن role في DB = affiliate فالسبب غالباً RLS يمنع قراءة الصف
--
-- ملاحظة عن جدول profiles:
-- - الـ triggers (prevent_role_escalation, sync_user_role, ...) لا تؤثر على SELECT؛ تؤثر على INSERT/UPDATE فقط.
-- - التطبيق يقرأ من .from("profiles") وليس من user_roles أو safe_profiles.
-- - يجب أن تصل الطلبات بمفتاح المستخدم (authenticated) وليس anon حتى يمر auth_user_id = auth.uid()
-- ============================================

-- 1) إضافة moderator للـ enum إن لم تكن موجودة (لتوافق الـ RLS)
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'moderator';

-- 2) إصلاح سياسات profiles حتى يقرأ المستخدم بروفايله (بما فيه role) بدون منع
-- إسقاط سياسات SELECT التي قد تتعارض أو تعتمد على دوال تسبب مشكلة
DROP POLICY IF EXISTS "self_read_profile" ON public.profiles;
DROP POLICY IF EXISTS "Secure profile access" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own complete profile" ON public.profiles;
DROP POLICY IF EXISTS "Limited public profile access" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can select own profile" ON public.profiles;
DROP POLICY IF EXISTS "profile_select_own" ON public.profiles;
-- سياسات القراءة بالهاتف (قد تتعارض)
DROP POLICY IF EXISTS "Users can read own profile by phone" ON public.profiles;
-- إسقاط السياسات التي سننشئها (لجعل الـ migration قابلاً للتشغيل مرة أخرى)
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin_moderator" ON public.profiles;

-- سياسة واحدة فقط: المستخدم يقرأ بروفايله (auth_user_id = auth.uid()) — لا نقرأ من profiles داخل السياسة لتجنب infinite recursion
CREATE POLICY "profiles_select_own"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth_user_id = (select auth.uid()));

-- ملاحظة: سياسة "أدمن يرى الكل" تحتاج SELECT من profiles داخل الشرط فتُسبب infinite recursion؛ أزلناها. لو احتجت لاحقاً استخدم RPC أو service_role.

-- 3) التأكد أن get_current_user_role() تقرأ من profiles (مصدر واحد للدور)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role::text FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1),
    'customer'
  );
$$;

COMMENT ON FUNCTION public.get_current_user_role() IS 'دور المستخدم من جدول profiles فقط ليتوافق مع عرض التطبيق';

-- 4) اختياري: دالة لقراءة بروفايل المستخدم الحالي (تتخطى RLS) إذا احتجتها لاحقاً
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS SETOF public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;
COMMENT ON FUNCTION public.get_my_profile() IS 'إرجاع بروفايل المستخدم الحالي (للاستخدام عند مشاكل RLS)';
