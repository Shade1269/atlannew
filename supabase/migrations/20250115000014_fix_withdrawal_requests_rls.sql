-- ============================================================================
-- إصلاح RLS Policies لجدول withdrawal_requests
-- ============================================================================

-- ✅ حذف جميع الـ policies القديمة
DROP POLICY IF EXISTS "Users view their withdrawal requests" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Users create their withdrawal requests" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Users can view own withdrawal requests" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Users can create own withdrawal requests" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Admins can view all withdrawal requests" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Admins can update withdrawal requests" ON public.withdrawal_requests;

-- ✅ Policy 1: المستخدمون يمكنهم رؤية طلبات السحب الخاصة بهم
CREATE POLICY "affiliates_view_own_withdrawals"
  ON public.withdrawal_requests
  FOR SELECT
  USING (
    affiliate_profile_id IN (
      SELECT id FROM public.profiles 
      WHERE auth_user_id = auth.uid()
    )
  );

-- ✅ Policy 2: المستخدمون يمكنهم إنشاء طلبات سحب خاصة بهم
CREATE POLICY "affiliates_create_own_withdrawals"
  ON public.withdrawal_requests
  FOR INSERT
  WITH CHECK (
    affiliate_profile_id IN (
      SELECT id FROM public.profiles 
      WHERE auth_user_id = auth.uid()
    )
  );

-- ✅ Policy 3: المستخدمون يمكنهم تحديث طلبات السحب الخاصة بهم (فقط إذا كانت PENDING)
CREATE POLICY "affiliates_update_own_pending_withdrawals"
  ON public.withdrawal_requests
  FOR UPDATE
  USING (
    affiliate_profile_id IN (
      SELECT id FROM public.profiles 
      WHERE auth_user_id = auth.uid()
    )
    AND status = 'PENDING'
  )
  WITH CHECK (
    affiliate_profile_id IN (
      SELECT id FROM public.profiles 
      WHERE auth_user_id = auth.uid()
    )
    AND status = 'PENDING'
  );

-- ✅ Policy 4: الأدمن يمكنه رؤية جميع طلبات السحب
CREATE POLICY "admins_view_all_withdrawals"
  ON public.withdrawal_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE auth_user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- ✅ Policy 5: الأدمن يمكنه تحديث جميع طلبات السحب
CREATE POLICY "admins_update_all_withdrawals"
  ON public.withdrawal_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE auth_user_id = auth.uid() 
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE auth_user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- ✅ Policy 6: الأدمن يمكنه حذف طلبات السحب
CREATE POLICY "admins_delete_withdrawals"
  ON public.withdrawal_requests
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE auth_user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- ✅ التأكد من تفعيل RLS
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

COMMENT ON POLICY "affiliates_view_own_withdrawals" ON public.withdrawal_requests IS 
'المسوقون يمكنهم رؤية طلبات السحب الخاصة بهم';

COMMENT ON POLICY "affiliates_create_own_withdrawals" ON public.withdrawal_requests IS 
'المسوقون يمكنهم إنشاء طلبات سحب خاصة بهم';

COMMENT ON POLICY "affiliates_update_own_pending_withdrawals" ON public.withdrawal_requests IS 
'المسوقون يمكنهم تحديث طلبات السحب الخاصة بهم فقط إذا كانت PENDING';

COMMENT ON POLICY "admins_view_all_withdrawals" ON public.withdrawal_requests IS 
'الأدمن يمكنه رؤية جميع طلبات السحب';

COMMENT ON POLICY "admins_update_all_withdrawals" ON public.withdrawal_requests IS 
'الأدمن يمكنه تحديث جميع طلبات السحب';
