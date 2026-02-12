
-- ====================================
-- المرحلة 4(أ): ربط Legacy Orders + تحسين order_hub (مُصحّح)
-- ====================================

-- 1️⃣ Indexes على order_hub للأداء
CREATE INDEX IF NOT EXISTS idx_order_hub_source_order_id 
  ON public.order_hub(source, source_order_id);

CREATE INDEX IF NOT EXISTS idx_order_hub_customer_phone 
  ON public.order_hub(customer_phone) 
  WHERE customer_phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_order_hub_customer_email 
  ON public.order_hub(customer_email) 
  WHERE customer_email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_order_hub_status 
  ON public.order_hub(status);

CREATE INDEX IF NOT EXISTS idx_order_hub_payment_status 
  ON public.order_hub(payment_status);

CREATE INDEX IF NOT EXISTS idx_order_hub_affiliate_store_id 
  ON public.order_hub(affiliate_store_id) 
  WHERE affiliate_store_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_order_hub_created_at 
  ON public.order_hub(created_at DESC);

-- 2️⃣ Function: طلبات موحدة لمتجر (مُصحّح)
CREATE OR REPLACE FUNCTION public.get_unified_store_orders(
  p_store_id UUID,
  p_affiliate_store_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  order_id UUID,
  order_number TEXT,
  source TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  total_amount_sar NUMERIC,
  status TEXT,
  payment_status TEXT,
  created_at TIMESTAMPTZ,
  items_count BIGINT,
  items_json JSONB
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH order_items AS (
    -- ecommerce orders items
    SELECT 
      eoi.order_id,
      COUNT(*) as items_count,
      jsonb_agg(
        jsonb_build_object(
          'product_id', eoi.product_id,
          'product_title', eoi.product_title,
          'quantity', eoi.quantity,
          'unit_price', eoi.unit_price_sar,
          'total_price', eoi.total_price_sar
        )
      ) as items_json
    FROM public.ecommerce_order_items eoi
    GROUP BY eoi.order_id
    
    UNION ALL
    
    -- simple orders items
    SELECT 
      soi.order_id,
      COUNT(*),
      jsonb_agg(
        jsonb_build_object(
          'product_title', soi.product_title,
          'quantity', soi.quantity,
          'unit_price', soi.unit_price_sar,
          'total_price', soi.total_price_sar
        )
      )
    FROM public.simple_order_items soi
    GROUP BY soi.order_id
  )
  SELECT 
    oh.id as order_id,
    oh.order_number,
    oh.source,
    oh.customer_name,
    oh.customer_phone,
    oh.customer_email,
    oh.total_amount_sar,
    oh.status,
    oh.payment_status,
    oh.created_at,
    COALESCE(oi.items_count, 0) as items_count,
    COALESCE(oi.items_json, '[]'::jsonb) as items_json
  FROM public.order_hub oh
  LEFT JOIN order_items oi ON oi.order_id = oh.source_order_id
  WHERE (
    (p_store_id IS NOT NULL AND oh.shop_id = p_store_id) OR
    (p_affiliate_store_id IS NOT NULL AND oh.affiliate_store_id = p_affiliate_store_id)
  )
  ORDER BY oh.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;

COMMENT ON FUNCTION public.get_unified_store_orders IS 'يحصل على طلبات موحدة من جميع المصادر لمتجر محدد';

-- 3️⃣ Function: إحصائيات موحدة
CREATE OR REPLACE FUNCTION public.get_unified_order_stats(
  p_store_id UUID DEFAULT NULL,
  p_affiliate_store_id UUID DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  total_orders BIGINT,
  total_revenue NUMERIC,
  pending_orders BIGINT,
  completed_orders BIGINT,
  cancelled_orders BIGINT,
  avg_order_value NUMERIC,
  by_source JSONB,
  by_status JSONB,
  by_payment_status JSONB
)
LANGUAGE PLPGSQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  filtered_count BIGINT;
BEGIN
  SELECT COUNT(*) INTO filtered_count
  FROM public.order_hub
  WHERE (
    (p_store_id IS NOT NULL AND shop_id = p_store_id) OR
    (p_affiliate_store_id IS NOT NULL AND affiliate_store_id = p_affiliate_store_id)
  )
  AND (p_start_date IS NULL OR created_at >= p_start_date)
  AND (p_end_date IS NULL OR created_at <= p_end_date);
  
  IF filtered_count = 0 THEN
    RETURN QUERY SELECT 0::BIGINT, 0::NUMERIC, 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::NUMERIC, 
                         '{}'::JSONB, '{}'::JSONB, '{}'::JSONB;
    RETURN;
  END IF;
  
  RETURN QUERY
  WITH filtered_orders AS (
    SELECT * FROM public.order_hub
    WHERE (
      (p_store_id IS NOT NULL AND shop_id = p_store_id) OR
      (p_affiliate_store_id IS NOT NULL AND affiliate_store_id = p_affiliate_store_id)
    )
    AND (p_start_date IS NULL OR created_at >= p_start_date)
    AND (p_end_date IS NULL OR created_at <= p_end_date)
  )
  SELECT 
    COUNT(*)::BIGINT,
    COALESCE(SUM(total_amount_sar), 0)::NUMERIC,
    COUNT(*) FILTER (WHERE status = 'pending')::BIGINT,
    COUNT(*) FILTER (WHERE status = 'completed')::BIGINT,
    COUNT(*) FILTER (WHERE status = 'cancelled')::BIGINT,
    (COALESCE(SUM(total_amount_sar), 0) / NULLIF(COUNT(*), 0))::NUMERIC,
    (
      SELECT jsonb_object_agg(source, jsonb_build_object('count', cnt, 'revenue', rev))
      FROM (
        SELECT COALESCE(source, 'unknown') as source, COUNT(*) as cnt, SUM(total_amount_sar) as rev
        FROM filtered_orders
        GROUP BY source
      ) s
    ),
    (
      SELECT jsonb_object_agg(status, cnt)
      FROM (
        SELECT COALESCE(status, 'unknown') as status, COUNT(*) as cnt
        FROM filtered_orders
        GROUP BY status
      ) s
    ),
    (
      SELECT jsonb_object_agg(payment_status, cnt)
      FROM (
        SELECT COALESCE(payment_status, 'unknown') as payment_status, COUNT(*) as cnt
        FROM filtered_orders
        GROUP BY payment_status
      ) ps
    )
  FROM filtered_orders;
END;
$$;

COMMENT ON FUNCTION public.get_unified_order_stats IS 'يحصل على إحصائيات موحدة من جميع الطلبات';

-- 4️⃣ Function: فحص جودة المزامنة
CREATE OR REPLACE FUNCTION public.check_order_hub_sync_quality()
RETURNS TABLE (
  check_name TEXT,
  status TEXT,
  details JSONB
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    'order_counts'::TEXT,
    'info'::TEXT,
    jsonb_build_object(
      'order_hub_total', (SELECT COUNT(*) FROM order_hub),
      'ecommerce_orders', (SELECT COUNT(*) FROM ecommerce_orders),
      'simple_orders', (SELECT COUNT(*) FROM simple_orders),
      'legacy_in_hub', (SELECT COUNT(*) FROM order_hub WHERE source = 'legacy')
    )
  
  UNION ALL
  
  SELECT 
    'ecommerce_missing_in_hub'::TEXT,
    CASE 
      WHEN COUNT(*) = 0 THEN 'ok'::TEXT
      ELSE 'warning'::TEXT
    END,
    jsonb_build_object(
      'count', COUNT(*),
      'order_ids', jsonb_agg(id)
    )
  FROM ecommerce_orders eo
  WHERE NOT EXISTS (
    SELECT 1 FROM order_hub WHERE source = 'ecommerce' AND source_order_id = eo.id
  )
  
  UNION ALL
  
  SELECT 
    'simple_missing_in_hub'::TEXT,
    CASE 
      WHEN COUNT(*) = 0 THEN 'ok'::TEXT
      ELSE 'warning'::TEXT
    END,
    jsonb_build_object(
      'count', COUNT(*),
      'order_ids', jsonb_agg(id)
    )
  FROM simple_orders so
  WHERE NOT EXISTS (
    SELECT 1 FROM order_hub WHERE source = 'simple' AND source_order_id = so.id
  )
  
  UNION ALL
  
  SELECT 
    'orphan_hub_orders'::TEXT,
    CASE 
      WHEN COUNT(*) = 0 THEN 'ok'::TEXT
      WHEN COUNT(*) <= 20 THEN 'info'::TEXT
      ELSE 'warning'::TEXT
    END,
    jsonb_build_object(
      'count', COUNT(*),
      'sources', jsonb_agg(DISTINCT source),
      'note', 'Legacy orders are expected to be orphaned'
    )
  FROM order_hub oh
  WHERE source NOT IN ('legacy', 'manual')
    AND NOT EXISTS (
      SELECT 1 FROM ecommerce_orders WHERE id = oh.source_order_id
      UNION ALL
      SELECT 1 FROM simple_orders WHERE id = oh.source_order_id
    );
$$;

COMMENT ON FUNCTION public.check_order_hub_sync_quality IS 'يفحص جودة المزامنة بين order_hub والمصادر';

-- 5️⃣ تعليقات
COMMENT ON INDEX idx_order_hub_source_order_id IS 'فهرس مركب على source + source_order_id للبحث السريع';
COMMENT ON INDEX idx_order_hub_customer_phone IS 'فهرس على رقم الهاتف للبحث عن طلبات العميل';
COMMENT ON INDEX idx_order_hub_created_at IS 'فهرس على تاريخ الإنشاء بترتيب تنازلي';
