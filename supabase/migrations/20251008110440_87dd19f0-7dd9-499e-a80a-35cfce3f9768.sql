-- حذف السياسة إذا كانت موجودة أولاً
DROP POLICY IF EXISTS "Service can create customer profiles via OTP" ON public.profiles;

-- إضافة سياسة RLS للسماح بإنشاء حسابات عملاء عبر OTP
CREATE POLICY "Service can create customer profiles via OTP"
ON public.profiles
FOR INSERT
WITH CHECK (
  phone IS NOT NULL 
  AND role = 'customer'
  AND (auth_user_id IS NULL OR auth_user_id = auth.uid())
);