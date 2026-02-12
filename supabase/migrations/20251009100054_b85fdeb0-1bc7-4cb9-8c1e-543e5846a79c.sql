-- ========================================
-- إصلاح Security: إضافة RLS Policies للـ Views
-- ========================================

-- تفعيل RLS على الـ Views (إذا كان ممكناً)
-- ملاحظة: Views لا تدعم RLS مباشرة، لكن يمكننا إضافة SECURITY INVOKER

-- إعادة إنشاء الـ Views مع SECURITY INVOKER بدلاً من SECURITY DEFINER
DROP VIEW IF EXISTS public.gmv_analytics CASCADE;
DROP VIEW IF EXISTS public.orders_dashboard CASCADE;
DROP VIEW IF EXISTS public.refunds_analytics CASCADE;
DROP VIEW IF EXISTS public.returns_analytics CASCADE;
DROP VIEW IF EXISTS public.shipments_dashboard CASCADE;
DROP VIEW IF EXISTS public.performance_overview CASCADE;

-- 1) GMV Analytics View - مع SECURITY INVOKER
CREATE VIEW public.gmv_analytics 
WITH (security_invoker = true) AS
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

-- 2) Orders Dashboard View - مع SECURITY INVOKER
CREATE VIEW public.orders_dashboard 
WITH (security_invoker = true) AS
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

-- 3) Refunds Summary View - مع SECURITY INVOKER
CREATE VIEW public.refunds_analytics 
WITH (security_invoker = true) AS
SELECT 
  DATE_TRUNC('day', r.created_at) as date,
  COUNT(*) as refund_count,
  o.shop_id,
  o.affiliate_store_id
FROM public.refunds r
LEFT JOIN public.ecommerce_orders o ON o.id = r.order_id
WHERE r.created_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', r.created_at), o.shop_id, o.affiliate_store_id;

-- 4) Returns Summary View - مع SECURITY INVOKER
CREATE VIEW public.returns_analytics 
WITH (security_invoker = true) AS
SELECT 
  DATE_TRUNC('day', pr.created_at) as date,
  COUNT(*) as return_count,
  o.shop_id,
  o.affiliate_store_id
FROM public.product_returns pr
LEFT JOIN public.ecommerce_orders o ON o.id = pr.order_id
WHERE pr.created_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', pr.created_at), o.shop_id, o.affiliate_store_id;

-- 5) Shipments Dashboard View - مع SECURITY INVOKER
CREATE VIEW public.shipments_dashboard 
WITH (security_invoker = true) AS
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

-- 6) Performance Overview - مع SECURITY INVOKER
CREATE VIEW public.performance_overview 
WITH (security_invoker = true) AS
SELECT 
  o.shop_id,
  o.affiliate_store_id,
  COUNT(DISTINCT o.id) as total_orders,
  SUM(o.total_sar) as total_revenue,
  AVG(o.total_sar) as avg_order_value
FROM public.ecommerce_orders o
WHERE o.created_at >= NOW() - INTERVAL '30 days'
GROUP BY o.shop_id, o.affiliate_store_id;