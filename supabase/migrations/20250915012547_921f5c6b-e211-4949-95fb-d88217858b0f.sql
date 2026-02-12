-- Stage 8: RPC functions for OTP and order retrieval

-- Function 1: Create customer OTP session for store
CREATE OR REPLACE FUNCTION create_customer_otp_session(
  p_store_id UUID,
  p_phone TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id UUID;
  v_otp_code TEXT;
BEGIN
  -- Validate store exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM affiliate_stores 
    WHERE id = p_store_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Store not found or inactive';
  END IF;

  -- Generate 6-digit OTP
  v_otp_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  
  -- Clean up old sessions for this phone/store (optional)
  DELETE FROM customer_otp_sessions 
  WHERE phone = p_phone 
    AND store_id = p_store_id 
    AND expires_at < NOW();
  
  -- Insert new OTP session
  INSERT INTO customer_otp_sessions (
    store_id,
    phone, 
    otp_code,
    verified,
    expires_at,
    attempts
  ) VALUES (
    p_store_id,
    p_phone,
    v_otp_code,
    false,
    NOW() + INTERVAL '5 minutes',
    0
  ) RETURNING id INTO v_session_id;
  
  -- Log the OTP for development (remove in production)
  RAISE NOTICE 'OTP for % at store %: %', p_phone, p_store_id, v_otp_code;
  
  RETURN v_session_id;
END;
$$;

-- Function 2: Verify customer OTP
CREATE OR REPLACE FUNCTION verify_customer_otp(
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
  v_session_record RECORD;
BEGIN
  -- Find valid OTP session
  SELECT * INTO v_session_record
  FROM customer_otp_sessions
  WHERE store_id = p_store_id
    AND phone = p_phone
    AND otp_code = p_code
    AND expires_at > NOW()
    AND verified = false
    AND attempts < 3
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_session_record IS NULL THEN
    -- Increment attempts for failed verification
    UPDATE customer_otp_sessions 
    SET attempts = attempts + 1
    WHERE store_id = p_store_id
      AND phone = p_phone
      AND expires_at > NOW()
      AND verified = false;
      
    RAISE EXCEPTION 'Invalid or expired OTP code';
  END IF;
  
  -- Mark as verified and extend expiry
  UPDATE customer_otp_sessions
  SET verified = true,
      verified_at = NOW(),
      expires_at = NOW() + INTERVAL '24 hours'  -- Extend session
  WHERE id = v_session_record.id;
  
  RETURN v_session_record.id;
END;
$$;

-- Function 3: Get store orders for verified session
CREATE OR REPLACE FUNCTION get_store_orders_for_session(
  p_store_id UUID,
  p_session_id UUID
)
RETURNS TABLE(
  order_id UUID,
  order_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  status TEXT,
  total_sar NUMERIC,
  item_count INTEGER,
  order_items JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER  
SET search_path = public
AS $$
DECLARE
  v_session_record RECORD;
BEGIN
  -- Validate session
  SELECT * INTO v_session_record
  FROM customer_otp_sessions
  WHERE id = p_session_id
    AND store_id = p_store_id
    AND verified = true
    AND expires_at > NOW();
  
  IF v_session_record IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired customer session';
  END IF;
  
  -- Return orders for this customer/store
  RETURN QUERY
  SELECT 
    o.id as order_id,
    COALESCE(o.order_number, 'ORD-' || SUBSTR(o.id::TEXT, 1, 8)) as order_number,
    o.created_at,
    o.status::TEXT,
    o.total_sar,
    (
      SELECT COUNT(*)::INTEGER 
      FROM order_items oi 
      WHERE oi.order_id = o.id
    ) as item_count,
    (
      SELECT COALESCE(
        JSONB_AGG(
          JSONB_BUILD_OBJECT(
            'id', oi.id,
            'title', oi.title_snapshot,
            'quantity', oi.quantity, 
            'unit_price', oi.unit_price_sar,
            'total_price', oi.line_total_sar
          )
        ), 
        '[]'::JSONB
      )
      FROM order_items oi 
      WHERE oi.order_id = o.id
    ) as order_items
  FROM orders o
  WHERE o.affiliate_store_id = p_store_id
    AND o.customer_phone = v_session_record.phone
  ORDER BY o.created_at DESC;
END;
$$;

-- Grant execute permissions to anon and authenticated roles
GRANT EXECUTE ON FUNCTION create_customer_otp_session(UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION verify_customer_otp(UUID, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_store_orders_for_session(UUID, UUID) TO anon, authenticated;

-- Add performance index
CREATE INDEX IF NOT EXISTS idx_orders_affiliate_store_phone_created 
ON orders(affiliate_store_id, customer_phone, created_at DESC);