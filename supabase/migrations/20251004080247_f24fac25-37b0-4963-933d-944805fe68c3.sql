-- Drop existing functions and policies
DROP FUNCTION IF EXISTS public.get_store_orders_for_session(UUID, UUID);
DROP FUNCTION IF EXISTS public.get_store_orders_for_session(UUID, TEXT);

-- Create customer_otp_sessions table
CREATE TABLE IF NOT EXISTS public.customer_otp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.affiliate_stores(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  customer_name TEXT,
  otp_code TEXT NOT NULL,
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_customer_otp_phone ON public.customer_otp_sessions(phone, store_id);
CREATE INDEX IF NOT EXISTS idx_customer_otp_expires ON public.customer_otp_sessions(expires_at);

-- Enable RLS
ALTER TABLE public.customer_otp_sessions ENABLE ROW LEVEL SECURITY;

-- Drop and recreate RLS policies
DROP POLICY IF EXISTS "Anyone can create OTP session" ON public.customer_otp_sessions;
DROP POLICY IF EXISTS "Anyone can verify their OTP" ON public.customer_otp_sessions;
DROP POLICY IF EXISTS "Anyone can update their OTP verification" ON public.customer_otp_sessions;

CREATE POLICY "Anyone can create OTP session"
  ON public.customer_otp_sessions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can verify their OTP"
  ON public.customer_otp_sessions
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update their OTP verification"
  ON public.customer_otp_sessions
  FOR UPDATE
  USING (true);

-- Function to merge customer data
CREATE OR REPLACE FUNCTION public.merge_customer_data(
  p_phone TEXT,
  p_name TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_firebase_uid TEXT DEFAULT NULL,
  p_store_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id UUID;
  v_existing_profile RECORD;
BEGIN
  SELECT * INTO v_existing_profile FROM profiles WHERE phone = p_phone LIMIT 1;
  
  IF v_existing_profile.id IS NOT NULL THEN
    UPDATE profiles
    SET 
      full_name = COALESCE(p_name, full_name),
      email = COALESCE(p_email, email),
      last_activity_at = now(),
      updated_at = now()
    WHERE id = v_existing_profile.id;
    v_profile_id := v_existing_profile.id;
  ELSE
    INSERT INTO profiles (phone, full_name, email, role, is_active, points)
    VALUES (p_phone, COALESCE(p_name, p_phone), p_email, 'customer', true, 0)
    RETURNING id INTO v_profile_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'profile_id', v_profile_id,
    'phone', p_phone,
    'name', COALESCE(p_name, v_existing_profile.full_name),
    'email', COALESCE(p_email, v_existing_profile.email)
  );
END;
$$;

-- Function to create OTP session
CREATE OR REPLACE FUNCTION public.create_customer_otp_session(
  p_store_id UUID,
  p_phone TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_otp_code TEXT;
  v_session_id UUID;
BEGIN
  v_otp_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  
  INSERT INTO customer_otp_sessions (store_id, phone, otp_code, expires_at)
  VALUES (p_store_id, p_phone, v_otp_code, now() + interval '5 minutes')
  RETURNING id INTO v_session_id;
  
  RAISE NOTICE 'OTP for %: %', p_phone, v_otp_code;
  RETURN v_session_id;
END;
$$;

-- Function to verify OTP
CREATE OR REPLACE FUNCTION public.verify_customer_otp(
  p_store_id UUID,
  p_phone TEXT,
  p_code TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session RECORD;
  v_customer_data JSONB;
BEGIN
  SELECT * INTO v_session
  FROM customer_otp_sessions
  WHERE store_id = p_store_id AND phone = p_phone AND otp_code = p_code
    AND expires_at > now() AND verified = false AND attempts < 3
  ORDER BY created_at DESC LIMIT 1;
  
  IF v_session.id IS NULL THEN
    UPDATE customer_otp_sessions SET attempts = attempts + 1
    WHERE store_id = p_store_id AND phone = p_phone
      AND expires_at > now() AND verified = false;
    RAISE EXCEPTION 'Invalid or expired OTP code';
  END IF;
  
  UPDATE customer_otp_sessions SET verified = true, verified_at = now()
  WHERE id = v_session.id;
  
  v_customer_data := merge_customer_data(p_phone);
  RETURN v_session.id;
END;
$$;

-- Function to get orders for session
CREATE OR REPLACE FUNCTION public.get_store_orders_for_session(
  p_store_id UUID,
  p_session_id TEXT
)
RETURNS TABLE (
  order_id UUID,
  order_number TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  total_amount NUMERIC,
  status TEXT,
  created_at TIMESTAMPTZ,
  items JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_phone TEXT;
  v_session_uuid UUID;
BEGIN
  BEGIN
    v_session_uuid := p_session_id::UUID;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Invalid session ID format';
  END;
  
  SELECT phone INTO v_customer_phone FROM customer_otp_sessions
  WHERE id = v_session_uuid AND verified = true;
  
  IF v_customer_phone IS NULL THEN
    RAISE EXCEPTION 'Invalid or unverified session';
  END IF;
  
  RETURN QUERY
  SELECT 
    so.id,
    so.id::TEXT as order_number,
    so.customer_name,
    so.customer_phone,
    so.total_amount_sar,
    COALESCE(so.status, 'pending')::TEXT,
    so.created_at,
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'product_title', soi.product_title,
        'quantity', soi.quantity,
        'unit_price', soi.unit_price_sar,
        'total_price', soi.total_price_sar
      ))
      FROM simple_order_items soi WHERE soi.order_id = so.id
    ), '[]'::jsonb) as items
  FROM simple_orders so
  WHERE so.affiliate_store_id = p_store_id AND so.customer_phone = v_customer_phone
  ORDER BY so.created_at DESC;
END;
$$;