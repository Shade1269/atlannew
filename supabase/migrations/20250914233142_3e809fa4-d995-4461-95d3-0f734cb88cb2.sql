-- ===== FINAL CORRECTED ORDERS UNIFICATION MIGRATION =====
-- This migration creates unified views and adapters for all order tables

-- 1. Add missing columns to ensure compatibility
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS affiliate_commission_sar NUMERIC DEFAULT 0;

ALTER TABLE public.ecommerce_orders 
ADD COLUMN IF NOT EXISTS affiliate_store_id UUID,
ADD COLUMN IF NOT EXISTS affiliate_commission_sar NUMERIC DEFAULT 0;

-- Add missing created_at column for order_items if doesn't exist
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Create unified orders view 
CREATE OR REPLACE VIEW public.v_orders_unified AS
-- Orders from main orders table
SELECT 
  'orders' as source_table,
  id,
  order_number,
  shop_id,
  customer_profile_id as user_id,
  customer_name,
  customer_phone,
  NULL as customer_email,
  shipping_address,
  status::text as status,
  subtotal_sar as subtotal,
  COALESCE(vat_sar, 0) as tax,
  COALESCE(shipping_sar, 0) as shipping,
  total_sar as total,
  payment_method::text as payment_method,
  'PENDING'::text as payment_status,
  affiliate_store_id,
  COALESCE(affiliate_commission_sar, 0) as affiliate_commission_sar,
  created_at,
  updated_at
FROM public.orders

UNION ALL

-- Orders from ecommerce_orders table  
SELECT
  'ecommerce_orders' as source_table,
  id,
  order_number,
  shop_id,
  user_id,
  customer_name,
  customer_phone,
  customer_email,
  shipping_address,
  status::text as status,
  subtotal_sar as subtotal,
  COALESCE(tax_sar, 0) as tax,
  COALESCE(shipping_sar, 0) as shipping,
  total_sar as total,
  payment_method::text as payment_method,
  payment_status::text as payment_status,
  affiliate_store_id,
  COALESCE(affiliate_commission_sar, 0) as affiliate_commission_sar,
  created_at,
  updated_at
FROM public.ecommerce_orders

UNION ALL

-- Orders from simple_orders table
SELECT
  'simple_orders' as source_table,
  id,
  NULL as order_number,
  NULL as shop_id,
  user_id,
  customer_name,
  customer_phone,
  customer_email,
  shipping_address,
  order_status as status,
  total_amount_sar as subtotal,
  0 as tax,
  0 as shipping,
  total_amount_sar as total,
  payment_method as payment_method,
  payment_status as payment_status,
  affiliate_store_id,
  COALESCE(affiliate_commission_sar, 0) as affiliate_commission_sar,
  created_at,
  updated_at
FROM public.simple_orders;

-- 3. Create unified order items view
CREATE OR REPLACE VIEW public.v_order_items_unified AS
-- Items from order_items table (has commission_rate but not commission_sar)
SELECT 
  'order_items' as source_table,
  id,
  order_id,
  product_id,
  merchant_id,
  title_snapshot as product_title,
  quantity,
  unit_price_sar,
  line_total_sar as total_price_sar,
  commission_rate,
  (line_total_sar * COALESCE(commission_rate, 0) / 100) as commission_sar, -- Calculate commission
  created_at
FROM public.order_items

UNION ALL

-- Items from ecommerce_order_items table (has both commission_rate and commission_sar)
SELECT
  'ecommerce_order_items' as source_table,
  id,
  order_id,
  product_id,
  NULL as merchant_id,
  product_title,
  quantity,
  unit_price_sar,
  total_price_sar,
  COALESCE(commission_rate, 0) as commission_rate,
  COALESCE(commission_sar, 0) as commission_sar,
  created_at
FROM public.ecommerce_order_items

UNION ALL

-- Items from simple_order_items table (no commission fields)
SELECT
  'simple_order_items' as source_table,
  id,
  order_id,
  product_id,
  NULL as merchant_id,
  product_title,
  quantity,
  unit_price_sar,
  total_price_sar,
  0 as commission_rate,
  0 as commission_sar,
  created_at
FROM public.simple_order_items;

-- 4. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_orders_affiliate_created 
ON public.orders(affiliate_store_id, created_at DESC) 
WHERE affiliate_store_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ecommerce_orders_affiliate_created 
ON public.ecommerce_orders(affiliate_store_id, created_at DESC) 
WHERE affiliate_store_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_simple_orders_affiliate_created 
ON public.simple_orders(affiliate_store_id, created_at DESC) 
WHERE affiliate_store_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_commissions_affiliate_status_created 
ON public.commissions(affiliate_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_shop_status_created 
ON public.orders(shop_id, status, created_at DESC) 
WHERE shop_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ecommerce_orders_shop_status_created 
ON public.ecommerce_orders(shop_id, status, created_at DESC) 
WHERE shop_id IS NOT NULL;

-- 5. Helper function to get unified orders with items
CREATE OR REPLACE FUNCTION public.get_unified_orders_with_items(
  p_shop_id UUID DEFAULT NULL,
  p_affiliate_store_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  source_table TEXT,
  order_id UUID,
  order_number TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  status TEXT,
  total NUMERIC,
  created_at TIMESTAMPTZ,
  items JSONB
) 
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH orders_filtered AS (
    SELECT * FROM v_orders_unified v
    WHERE (p_shop_id IS NULL OR v.shop_id = p_shop_id)
      AND (p_affiliate_store_id IS NULL OR v.affiliate_store_id = p_affiliate_store_id)
    ORDER BY v.created_at DESC
    LIMIT p_limit OFFSET p_offset
  ),
  orders_with_items AS (
    SELECT 
      o.source_table,
      o.id as order_id,
      o.order_number,
      o.customer_name,
      o.customer_phone,
      o.status,
      o.total,
      o.created_at,
      COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', i.id,
            'product_id', i.product_id,
            'product_title', i.product_title,
            'quantity', i.quantity,
            'unit_price_sar', i.unit_price_sar,
            'total_price_sar', i.total_price_sar
          )
        ) FILTER (WHERE i.id IS NOT NULL),
        '[]'::jsonb
      ) as items
    FROM orders_filtered o
    LEFT JOIN v_order_items_unified i ON i.order_id = o.id
    GROUP BY 
      o.source_table, o.id, o.order_number, o.customer_name, 
      o.customer_phone, o.status, o.total, o.created_at
  )
  SELECT * FROM orders_with_items;
END;
$$;

-- 6. Function to update order status across all tables
CREATE OR REPLACE FUNCTION public.update_unified_order_status(
  p_order_id UUID,
  p_new_status TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated BOOLEAN := FALSE;
BEGIN
  -- Try updating in orders table
  UPDATE public.orders 
  SET status = p_new_status::order_status, updated_at = NOW()
  WHERE id = p_order_id;
  
  IF FOUND THEN
    v_updated := TRUE;
  END IF;
  
  -- Try updating in ecommerce_orders table  
  UPDATE public.ecommerce_orders 
  SET status = p_new_status::order_status, updated_at = NOW()
  WHERE id = p_order_id;
  
  IF FOUND THEN
    v_updated := TRUE;
  END IF;
  
  -- Try updating in simple_orders table
  UPDATE public.simple_orders 
  SET order_status = p_new_status, updated_at = NOW()
  WHERE id = p_order_id;
  
  IF FOUND THEN
    v_updated := TRUE;
  END IF;
  
  RETURN v_updated;
END;
$$;

-- 7. Grant permissions
GRANT SELECT ON public.v_orders_unified TO authenticated, anon;
GRANT SELECT ON public.v_order_items_unified TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_unified_orders_with_items TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.update_unified_order_status TO authenticated;