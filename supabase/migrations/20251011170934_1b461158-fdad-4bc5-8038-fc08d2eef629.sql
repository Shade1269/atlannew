-- إزالة trigger القديم الذي يسبب المشكلة
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- الآن النظام سيعتمد على ensureProfile في usePlatformPhoneAuth
-- الذي يكتب في جدول profiles الجديد بدلاً من user_profiles القديم