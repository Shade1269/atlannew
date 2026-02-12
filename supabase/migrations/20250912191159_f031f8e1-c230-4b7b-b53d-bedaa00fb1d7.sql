-- إنشاء جدول بيانات العملاء الإضافية
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female')),
  preferred_language TEXT DEFAULT 'ar',
  marketing_consent BOOLEAN DEFAULT false,
  total_orders INTEGER DEFAULT 0,
  total_spent_sar NUMERIC DEFAULT 0,
  last_order_at TIMESTAMP WITH TIME ZONE,
  loyalty_points INTEGER DEFAULT 0,
  preferred_payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id)
);

-- إنشاء جدول ربط العملاء بالمتاجر
CREATE TABLE public.store_customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.affiliate_stores(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  first_purchase_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_purchase_at TIMESTAMP WITH TIME ZONE,
  total_orders INTEGER DEFAULT 0,
  total_spent_sar NUMERIC DEFAULT 0,
  customer_status TEXT DEFAULT 'active' CHECK (customer_status IN ('active', 'inactive', 'blocked')),
  preferred_contact_method TEXT DEFAULT 'email' CHECK (preferred_contact_method IN ('email', 'sms', 'whatsapp')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(store_id, customer_id)
);

-- إنشاء جدول عناوين العملاء
CREATE TABLE public.customer_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  address_type TEXT DEFAULT 'shipping' CHECK (address_type IN ('shipping', 'billing', 'both')),
  full_name TEXT NOT NULL,
  phone TEXT,
  country TEXT DEFAULT 'SA',
  city TEXT NOT NULL,
  district TEXT,
  street_address TEXT NOT NULL,
  building_number TEXT,
  apartment_number TEXT,
  postal_code TEXT,
  additional_info TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول جلسات OTP للعملاء
CREATE TABLE public.customer_otp_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  store_id UUID REFERENCES public.affiliate_stores(id) ON DELETE CASCADE,
  session_data JSONB DEFAULT '{}',
  verified BOOLEAN DEFAULT false,
  attempts INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '10 minutes'),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل Row Level Security
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_otp_sessions ENABLE ROW LEVEL SECURITY;

-- سياسات RLS للعملاء
CREATE POLICY "Customers can view their own data" 
ON public.customers 
FOR SELECT 
USING (profile_id IN (SELECT profiles.id FROM profiles WHERE profiles.auth_user_id = auth.uid()));

CREATE POLICY "Customers can update their own data" 
ON public.customers 
FOR UPDATE 
USING (profile_id IN (SELECT profiles.id FROM profiles WHERE profiles.auth_user_id = auth.uid()));

CREATE POLICY "System can create customer records" 
ON public.customers 
FOR INSERT 
WITH CHECK (true);

-- سياسات RLS لربط المتاجر بالعملاء
CREATE POLICY "Store owners can view their customers" 
ON public.store_customers 
FOR SELECT 
USING (store_id IN (
  SELECT affiliate_stores.id FROM affiliate_stores 
  WHERE affiliate_stores.profile_id IN (SELECT profiles.id FROM profiles WHERE profiles.auth_user_id = auth.uid())
));

CREATE POLICY "Customers can view their store relationships" 
ON public.store_customers 
FOR SELECT 
USING (customer_id IN (
  SELECT customers.id FROM customers 
  JOIN profiles ON profiles.id = customers.profile_id
  WHERE profiles.auth_user_id = auth.uid()
));

CREATE POLICY "System can create store customer relationships" 
ON public.store_customers 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Store owners and customers can update relationships" 
ON public.store_customers 
FOR UPDATE 
USING (
  store_id IN (
    SELECT affiliate_stores.id FROM affiliate_stores 
    WHERE affiliate_stores.profile_id IN (SELECT profiles.id FROM profiles WHERE profiles.auth_user_id = auth.uid())
  ) OR 
  customer_id IN (
    SELECT customers.id FROM customers 
    JOIN profiles ON profiles.id = customers.profile_id
    WHERE profiles.auth_user_id = auth.uid()
  )
);

-- سياسات RLS للعناوين
CREATE POLICY "Customers can manage their addresses" 
ON public.customer_addresses 
FOR ALL 
USING (customer_id IN (
  SELECT customers.id FROM customers 
  JOIN profiles ON profiles.id = customers.profile_id
  WHERE profiles.auth_user_id = auth.uid()
));

-- سياسات RLS لجلسات OTP
CREATE POLICY "Anyone can create OTP sessions" 
ON public.customer_otp_sessions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can verify OTP sessions" 
ON public.customer_otp_sessions 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can update OTP sessions" 
ON public.customer_otp_sessions 
FOR UPDATE 
USING (true);

-- إنشاء الفهارس المطلوبة
CREATE INDEX idx_customers_profile_id ON public.customers(profile_id);
CREATE INDEX idx_store_customers_store_id ON public.store_customers(store_id);
CREATE INDEX idx_store_customers_customer_id ON public.store_customers(customer_id);
CREATE INDEX idx_customer_addresses_customer_id ON public.customer_addresses(customer_id);
CREATE INDEX idx_customer_otp_phone ON public.customer_otp_sessions(phone);
CREATE INDEX idx_customer_otp_expires ON public.customer_otp_sessions(expires_at);

-- إنشاء triggers لتحديث التواريخ
CREATE TRIGGER update_customers_timestamp
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_store_customers_timestamp
  BEFORE UPDATE ON public.store_customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_addresses_timestamp
  BEFORE UPDATE ON public.customer_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- دالة لإنشاء عميل جديد
CREATE OR REPLACE FUNCTION public.create_customer_account(
  p_phone TEXT,
  p_email TEXT DEFAULT NULL,
  p_full_name TEXT DEFAULT NULL,
  p_store_id UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_user_id UUID;
  v_profile_id UUID;
  v_customer_id UUID;
  v_store_customer_id UUID;
BEGIN
  -- البحث عن مستخدم موجود بنفس رقم الجوال
  SELECT profiles.auth_user_id INTO v_auth_user_id
  FROM profiles 
  WHERE profiles.phone = p_phone;
  
  -- البحث عن أو إنشاء ملف شخصي
  SELECT profiles.id INTO v_profile_id
  FROM profiles 
  WHERE profiles.auth_user_id = v_auth_user_id;
  
  IF v_profile_id IS NULL THEN
    INSERT INTO profiles (phone, email, full_name, role, is_active)
    VALUES (p_phone, p_email, COALESCE(p_full_name, p_phone), 'customer', true)
    RETURNING id INTO v_profile_id;
    
    -- الحصول على auth_user_id الجديد
    SELECT profiles.auth_user_id INTO v_auth_user_id
    FROM profiles 
    WHERE profiles.id = v_profile_id;
  END IF;
  
  -- البحث عن أو إنشاء بيانات العميل
  SELECT customers.id INTO v_customer_id
  FROM customers 
  WHERE customers.profile_id = v_profile_id;
  
  IF v_customer_id IS NULL THEN
    INSERT INTO customers (profile_id)
    VALUES (v_profile_id)
    RETURNING id INTO v_customer_id;
  END IF;
  
  -- ربط العميل بالمتجر إذا تم تحديد متجر
  IF p_store_id IS NOT NULL THEN
    INSERT INTO store_customers (store_id, customer_id)
    VALUES (p_store_id, v_customer_id)
    ON CONFLICT (store_id, customer_id) DO NOTHING
    RETURNING id INTO v_store_customer_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'auth_user_id', v_auth_user_id,
    'profile_id', v_profile_id,
    'customer_id', v_customer_id,
    'store_customer_id', v_store_customer_id
  );
END;
$$;

-- دالة للتحقق من OTP وإنشاء جلسة
CREATE OR REPLACE FUNCTION public.verify_customer_otp(
  p_phone TEXT,
  p_otp_code TEXT,
  p_store_id UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_record RECORD;
  v_customer_data JSONB;
BEGIN
  -- البحث عن جلسة OTP صالحة
  SELECT * INTO v_session_record
  FROM customer_otp_sessions
  WHERE customer_otp_sessions.phone = p_phone 
    AND customer_otp_sessions.otp_code = p_otp_code
    AND customer_otp_sessions.expires_at > now()
    AND customer_otp_sessions.verified = false
    AND customer_otp_sessions.attempts < 3;
  
  IF v_session_record IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'كود التحقق غير صحيح أو منتهي الصلاحية'
    );
  END IF;
  
  -- تحديث الجلسة كمحققة
  UPDATE customer_otp_sessions
  SET verified = true, verified_at = now()
  WHERE customer_otp_sessions.id = v_session_record.id;
  
  -- إنشاء أو تحديث حساب العميل
  SELECT create_customer_account(p_phone, NULL, NULL, p_store_id) INTO v_customer_data;
  
  RETURN jsonb_build_object(
    'success', true,
    'customer_data', v_customer_data,
    'session_id', v_session_record.id
  );
END;
$$;