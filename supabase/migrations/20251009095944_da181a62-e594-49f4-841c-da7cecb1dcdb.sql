-- ========================================
-- المرحلة 4: إنشاء Views للمراقبة والتقارير (مع حذف القديمة)
-- ========================================

-- حذف الـ Views القديمة
DROP VIEW IF EXISTS public.gmv_analytics CASCADE;
DROP VIEW IF EXISTS public.orders_dashboard CASCADE;
DROP VIEW IF EXISTS public.refunds_analytics CASCADE;
DROP VIEW IF EXISTS public.returns_analytics CASCADE;
DROP VIEW IF EXISTS public.shipments_dashboard CASCADE;
DROP VIEW IF EXISTS public.performance_overview CASCADE;

-- 1) GMV Analytics View - تحليل إجمالي قيمة البضائع
CREATE VIEW public.gmv_analytics AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as total_orders,
  SUM(total_sar) as gmv,
  SUM(CASE WHEN status = 'DELIVERED' THEN total_sar ELSE 0 END) as completed_gmv,
  AVG(total_sar) as avg_order_value,
  shop_id,
  affiliate_store_id
FROM public.ecommerce_orders
WHERE created_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', created_at), shop_id, affiliate_store_id;

COMMENT ON VIEW public.gmv_analytics IS 'تحليل GMV اليومي للطلبات - آخر 90 يوم';

-- 2) Orders Dashboard View - لوحة مراقبة الطلبات
CREATE VIEW public.orders_dashboard AS
SELECT 
  status,
  COUNT(*) as order_count,
  SUM(total_sar) as total_value,
  AVG(total_sar) as avg_value,
  MIN(created_at) as oldest_order,
  MAX(created_at) as newest_order,
  shop_id,
  affiliate_store_id
FROM public.ecommerce_orders
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY status, shop_id, affiliate_store_id;

COMMENT ON VIEW public.orders_dashboard IS 'ملخص الطلبات حسب الحالة - آخر 30 يوم';

-- 3) Refunds Summary View - ملخص الاستردادات
CREATE VIEW public.refunds_analytics AS
SELECT 
  DATE_TRUNC('day', r.created_at) as date,
  COUNT(*) as refund_count,
  o.shop_id,
  o.affiliate_store_id
FROM public.refunds r
LEFT JOIN public.ecommerce_orders o ON o.id = r.order_id
WHERE r.created_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', r.created_at), o.shop_id, o.affiliate_store_id;

COMMENT ON VIEW public.refunds_analytics IS 'ملخص الاستردادات اليومي - آخر 90 يوم';

-- 4) Returns Summary View - ملخص المرتجعات
CREATE VIEW public.returns_analytics AS
SELECT 
  DATE_TRUNC('day', pr.created_at) as date,
  COUNT(*) as return_count,
  o.shop_id,
  o.affiliate_store_id
FROM public.product_returns pr
LEFT JOIN public.ecommerce_orders o ON o.id = pr.order_id
WHERE pr.created_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', pr.created_at), o.shop_id, o.affiliate_store_id;

COMMENT ON VIEW public.returns_analytics IS 'ملخص المرتجعات اليومي - آخر 90 يوم';

-- 5) Shipments Dashboard View - لوحة مراقبة الشحنات
CREATE VIEW public.shipments_dashboard AS
SELECT 
  s.current_status as status,
  COUNT(*) as shipment_count,
  MIN(s.created_at) as oldest_shipment,
  MAX(s.created_at) as newest_shipment,
  o.shop_id,
  o.affiliate_store_id
FROM public.shipments_tracking s
LEFT JOIN public.ecommerce_orders o ON o.id = s.order_id
WHERE s.created_at >= NOW() - INTERVAL '30 days'
GROUP BY s.current_status, o.shop_id, o.affiliate_store_id;

COMMENT ON VIEW public.shipments_dashboard IS 'ملخص الشحنات حسب الحالة - آخر 30 يوم';

-- 6) Performance Overview - نظرة عامة على الأداء
CREATE VIEW public.performance_overview AS
SELECT 
  o.shop_id,
  o.affiliate_store_id,
  COUNT(DISTINCT o.id) as total_orders,
  SUM(o.total_sar) as total_revenue,
  AVG(o.total_sar) as avg_order_value
FROM public.ecommerce_orders o
WHERE o.created_at >= NOW() - INTERVAL '30 days'
GROUP BY o.shop_id, o.affiliate_store_id;

COMMENT ON VIEW public.performance_overview IS 'نظرة شاملة على الأداء - آخر 30 يوم';

-- 7) فهارس لتحسين أداء الـ Views
CREATE INDEX IF NOT EXISTS idx_orders_created_status 
  ON public.ecommerce_orders(created_at, status);

CREATE INDEX IF NOT EXISTS idx_refunds_created 
  ON public.refunds(created_at);

CREATE INDEX IF NOT EXISTS idx_returns_created 
  ON public.product_returns(created_at);

CREATE INDEX IF NOT EXISTS idx_shipments_created 
  ON public.shipments_tracking(created_at);