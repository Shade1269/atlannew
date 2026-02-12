-- Fix get_store_orders_for_session: use simple_orders.order_status instead of non-existent so.status
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

  SELECT phone INTO v_customer_phone FROM public.customer_otp_sessions
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
    COALESCE(so.order_status, 'pending')::TEXT,
    so.created_at,
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'product_title', soi.product_title,
        'quantity', soi.quantity,
        'unit_price', soi.unit_price_sar,
        'total_price', soi.total_price_sar
      ))
      FROM public.simple_order_items soi WHERE soi.order_id = so.id
    ), '[]'::jsonb) as items
  FROM public.simple_orders so
  WHERE so.affiliate_store_id = p_store_id AND so.customer_phone = v_customer_phone
  ORDER BY so.created_at DESC;
END;
$$;