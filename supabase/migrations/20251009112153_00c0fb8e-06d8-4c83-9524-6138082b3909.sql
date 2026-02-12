-- ============================================
-- المرحلة 6: تنظيف وملء البيانات (نسخة مبسطة)
-- Stage 6: Data Backfill (Simplified)
-- ============================================

-- ===== 6.1: جدول التقارير =====
CREATE TABLE IF NOT EXISTS public.data_quality_report (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type text NOT NULL,
  table_name text NOT NULL,
  issue_description text NOT NULL,
  affected_count integer NOT NULL DEFAULT 0,
  sample_ids jsonb,
  severity text NOT NULL DEFAULT 'medium',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ===== 6.2: ملء order_hub من ecommerce_orders =====
INSERT INTO public.order_hub (
  source, source_order_id, order_number, customer_name, customer_phone, 
  customer_email, total_amount_sar, status, payment_status, 
  shop_id, affiliate_store_id, created_at, updated_at
)
SELECT 
  'ecommerce', eo.id, eo.order_number, eo.customer_name, eo.customer_phone,
  eo.customer_email, COALESCE(eo.total_sar, 0),
  COALESCE(eo.status::text, 'pending'),
  COALESCE(eo.payment_status::text, 'pending'),
  eo.shop_id, eo.affiliate_store_id, eo.created_at, eo.updated_at
FROM public.ecommerce_orders eo
WHERE NOT EXISTS (
  SELECT 1 FROM public.order_hub WHERE source = 'ecommerce' AND source_order_id = eo.id
);

-- ===== 6.3: ملء order_hub من simple_orders =====
INSERT INTO public.order_hub (
  source, source_order_id, order_number, customer_name, customer_phone,
  customer_email, total_amount_sar, status, payment_status,
  affiliate_store_id, created_at, updated_at
)
SELECT 
  'simple', so.id, so.id::text, so.customer_name, so.customer_phone,
  so.customer_email, COALESCE(so.total_amount_sar, 0),
  COALESCE(so.order_status, 'pending'),
  COALESCE(so.payment_status, 'pending'),
  so.affiliate_store_id, so.created_at, so.updated_at
FROM public.simple_orders so
WHERE NOT EXISTS (
  SELECT 1 FROM public.order_hub WHERE source = 'simple' AND source_order_id = so.id
);

-- ===== 6.4: دالة فحص جودة البيانات =====
CREATE OR REPLACE FUNCTION public.check_data_quality()
RETURNS TABLE (check_name text, status text, details jsonb) 
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY SELECT 
    'order_hub_count'::text, 'info'::text,
    jsonb_build_object(
      'total_orders', (SELECT COUNT(*) FROM order_hub),
      'ecommerce', (SELECT COUNT(*) FROM order_hub WHERE source = 'ecommerce'),
      'simple', (SELECT COUNT(*) FROM order_hub WHERE source = 'simple'),
      'manual', (SELECT COUNT(*) FROM order_hub WHERE source = 'manual')
    );

  RETURN QUERY SELECT 
    'returns_status'::text, 'info'::text,
    jsonb_build_object(
      'total_returns', (SELECT COUNT(*) FROM product_returns),
      'with_ecommerce_order', (SELECT COUNT(*) FROM product_returns WHERE ecommerce_order_id IS NOT NULL),
      'with_simple_order', (SELECT COUNT(*) FROM product_returns WHERE simple_order_id IS NOT NULL)
    );

  RETURN QUERY SELECT 
    'refunds_status'::text, 'info'::text,
    jsonb_build_object(
      'total_refunds', (SELECT COUNT(*) FROM refunds),
      'with_ecommerce_order', (SELECT COUNT(*) FROM refunds WHERE ecommerce_order_id IS NOT NULL),
      'with_simple_order', (SELECT COUNT(*) FROM refunds WHERE simple_order_id IS NOT NULL)
    );

  RETURN QUERY SELECT 
    'shipments_status'::text, 'info'::text,
    jsonb_build_object(
      'total_shipments', (SELECT COUNT(*) FROM shipments),
      'with_ecommerce_order', (SELECT COUNT(*) FROM shipments WHERE ecommerce_order_id IS NOT NULL),
      'with_simple_order', (SELECT COUNT(*) FROM shipments WHERE simple_order_id IS NOT NULL)
    );
END;
$$;

-- ===== 6.5: RLS للتقارير =====
ALTER TABLE public.data_quality_report ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view reports" ON public.data_quality_report
FOR SELECT USING (get_current_user_role() = 'admin');

CREATE POLICY "System can insert reports" ON public.data_quality_report
FOR INSERT WITH CHECK (
  (auth.jwt()->>'role') = 'service_role' OR get_current_user_role() = 'admin'
);