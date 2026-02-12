-- ==============================================
-- إصلاح المشاكل الأمنية الحرجة - الإصدار المصحح
-- ==============================================

-- 1. تفعيل RLS على جدول profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. حذف السياسات القديمة إن وجدت
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- إنشاء سياسات آمنة جديدة
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = auth_user_id);

-- السماح للمسؤولين بمشاهدة جميع الملفات
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    AND role = 'admin'
    AND is_active = true
  )
);

-- السماح للمستخدمين بتحديث ملفهم الشخصي
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = auth_user_id)
WITH CHECK (auth.uid() = auth_user_id);

-- السماح بإنشاء الملفات الشخصية للمستخدمين الجدد
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = auth_user_id);

-- ==============================================
-- 3. حماية جدول affiliate_payment_info
-- ==============================================

ALTER TABLE public.affiliate_payment_info ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own payment info" ON public.affiliate_payment_info;
DROP POLICY IF EXISTS "Users can update their own payment info" ON public.affiliate_payment_info;
DROP POLICY IF EXISTS "Users can insert their own payment info" ON public.affiliate_payment_info;
DROP POLICY IF EXISTS "Affiliates view own payment info" ON public.affiliate_payment_info;
DROP POLICY IF EXISTS "Affiliates update own payment info" ON public.affiliate_payment_info;
DROP POLICY IF EXISTS "Affiliates insert own payment info" ON public.affiliate_payment_info;
DROP POLICY IF EXISTS "Admins view all payment info" ON public.affiliate_payment_info;

-- المسوقون يمكنهم مشاهدة معلومات الدفع الخاصة بهم فقط
CREATE POLICY "Affiliates view own payment info"
ON public.affiliate_payment_info FOR SELECT
USING (
  profile_id IN (
    SELECT id FROM public.profiles 
    WHERE auth_user_id = auth.uid()
  )
);

-- المسوقون يمكنهم تحديث معلومات الدفع الخاصة بهم
CREATE POLICY "Affiliates update own payment info"
ON public.affiliate_payment_info FOR UPDATE
USING (
  profile_id IN (
    SELECT id FROM public.profiles 
    WHERE auth_user_id = auth.uid()
  )
)
WITH CHECK (
  profile_id IN (
    SELECT id FROM public.profiles 
    WHERE auth_user_id = auth.uid()
  )
);

-- المسوقون يمكنهم إضافة معلومات الدفع الخاصة بهم
CREATE POLICY "Affiliates insert own payment info"
ON public.affiliate_payment_info FOR INSERT
WITH CHECK (
  profile_id IN (
    SELECT id FROM public.profiles 
    WHERE auth_user_id = auth.uid()
  )
);

-- المسؤولون يمكنهم مشاهدة جميع معلومات الدفع
CREATE POLICY "Admins view all payment info"
ON public.affiliate_payment_info FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    AND role = 'admin'
    AND is_active = true
  )
);

-- ==============================================
-- 4. حماية جدول customer_otp_sessions
-- ==============================================

ALTER TABLE public.customer_otp_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own OTP sessions" ON public.customer_otp_sessions;
DROP POLICY IF EXISTS "Service role can manage OTP sessions" ON public.customer_otp_sessions;
DROP POLICY IF EXISTS "Anyone can insert OTP" ON public.customer_otp_sessions;

-- السماح لأي شخص بإنشاء OTP (لتسجيل الدخول)
CREATE POLICY "Anyone can insert OTP"
ON public.customer_otp_sessions FOR INSERT
WITH CHECK (true);

-- المستخدمون يمكنهم مشاهدة OTP الخاص بهم فقط
CREATE POLICY "Users can view own OTP sessions"
ON public.customer_otp_sessions FOR SELECT
USING (
  phone IN (
    SELECT phone FROM public.profiles 
    WHERE auth_user_id = auth.uid()
  )
);

-- Service role يمكنه إدارة كل شيء
CREATE POLICY "Service role can manage OTP sessions"
ON public.customer_otp_sessions FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- ==============================================
-- 5. إضافة تعليقات توضيحية
-- ==============================================

COMMENT ON TABLE public.profiles IS 'Protected: Users can only see their own profile. Admins can see all.';
COMMENT ON TABLE public.affiliate_payment_info IS 'Protected: Contains sensitive banking information. Access restricted to owner and admins only.';
COMMENT ON TABLE public.customer_otp_sessions IS 'OTP sessions should expire in 5 minutes maximum for security';