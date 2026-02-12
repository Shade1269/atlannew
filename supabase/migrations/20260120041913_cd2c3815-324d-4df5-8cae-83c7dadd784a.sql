-- إصلاح دالة فحص جودة البيانات
DROP FUNCTION IF EXISTS public.check_data_quality();

CREATE OR REPLACE FUNCTION public.check_data_quality()
RETURNS TABLE(
  check_name TEXT,
  status TEXT,
  details JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- فحص الطلبات في order_hub
  RETURN QUERY
  SELECT 
    'order_hub_count'::TEXT AS check_name,
    CASE 
      WHEN (SELECT COUNT(*) FROM order_hub) > 0 THEN 'success'::TEXT
      ELSE 'warning'::TEXT
    END AS status,
    jsonb_build_object(
      'total_orders', (SELECT COUNT(*) FROM order_hub),
      'ecommerce', (SELECT COUNT(*) FROM order_hub WHERE source = 'ecommerce'),
      'manual', (SELECT COUNT(*) FROM order_hub WHERE source = 'manual')
    ) AS details;

  -- فحص الاستردادات
  RETURN QUERY
  SELECT 
    'refunds_status'::TEXT AS check_name,
    CASE 
      WHEN (SELECT COUNT(*) FROM refunds WHERE status = 'PENDING') > 5 THEN 'warning'::TEXT
      ELSE 'success'::TEXT
    END AS status,
    jsonb_build_object(
      'total_refunds', (SELECT COUNT(*) FROM refunds),
      'pending', (SELECT COUNT(*) FROM refunds WHERE status = 'PENDING'),
      'approved', (SELECT COUNT(*) FROM refunds WHERE status = 'APPROVED'),
      'completed', (SELECT COUNT(*) FROM refunds WHERE status = 'COMPLETED')
    ) AS details;

  -- فحص الشحنات
  RETURN QUERY
  SELECT 
    'shipments_status'::TEXT AS check_name,
    CASE 
      WHEN (SELECT COUNT(*) FROM shipments WHERE status = 'PENDING') > 10 THEN 'warning'::TEXT
      ELSE 'success'::TEXT
    END AS status,
    jsonb_build_object(
      'total_shipments', (SELECT COUNT(*) FROM shipments),
      'pending', (SELECT COUNT(*) FROM shipments WHERE status = 'PENDING'),
      'in_transit', (SELECT COUNT(*) FROM shipments WHERE status = 'IN_TRANSIT'),
      'delivered', (SELECT COUNT(*) FROM shipments WHERE status = 'DELIVERED')
    ) AS details;

  -- فحص الطلبات بدون شحنات
  RETURN QUERY
  SELECT 
    'orders_without_shipment'::TEXT AS check_name,
    CASE 
      WHEN (SELECT COUNT(*) FROM order_hub oh 
            WHERE oh.status = 'CONFIRMED' 
            AND NOT EXISTS (SELECT 1 FROM shipments s WHERE s.order_hub_id = oh.id)) > 0 
      THEN 'warning'::TEXT
      ELSE 'success'::TEXT
    END AS status,
    jsonb_build_object(
      'confirmed_without_shipment', (
        SELECT COUNT(*) FROM order_hub oh 
        WHERE oh.status = 'CONFIRMED' 
        AND NOT EXISTS (SELECT 1 FROM shipments s WHERE s.order_hub_id = oh.id)
      )
    ) AS details;

END;
$$;