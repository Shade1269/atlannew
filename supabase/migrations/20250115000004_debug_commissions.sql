-- ============================================================================
-- SQL Queries للتشخيص والتحقق من العمولات
-- ============================================================================

-- 1. التحقق من عدد الطلبات المدفوعة المرتبطة بمسوقين
-- SELECT 
--   COUNT(*) as total_completed_orders,
--   COUNT(DISTINCT affiliate_store_id) as unique_affiliate_stores
-- FROM public.ecommerce_orders
-- WHERE payment_status = 'COMPLETED'
--   AND affiliate_store_id IS NOT NULL;

-- 2. التحقق من عدد العمولات الموجودة
-- SELECT 
--   COUNT(*) as total_commissions,
--   COUNT(DISTINCT order_id) as orders_with_commissions,
--   SUM(amount_sar) as total_commission_amount,
--   status,
--   COUNT(*) FILTER (WHERE status = 'PENDING') as pending_count,
--   COUNT(*) FILTER (WHERE status = 'CONFIRMED') as confirmed_count
-- FROM public.commissions
-- GROUP BY status;

-- 3. التحقق من الطلبات التي لا تحتوي على عمولات
-- SELECT 
--   o.id,
--   o.order_number,
--   o.affiliate_store_id,
--   o.payment_status,
--   o.total_amount_sar,
--   o.created_at,
--   ast.store_name,
--   pf.id as profile_id
-- FROM public.ecommerce_orders o
-- LEFT JOIN public.affiliate_stores ast ON ast.id = o.affiliate_store_id
-- LEFT JOIN public.profiles pf ON pf.id = ast.profile_id
-- WHERE o.payment_status = 'COMPLETED'
--   AND o.affiliate_store_id IS NOT NULL
--   AND NOT EXISTS (
--     SELECT 1 FROM public.commissions c WHERE c.order_id = o.id
--   )
-- ORDER BY o.created_at DESC
-- LIMIT 20;

-- 4. التحقق من order_items و unit_price_sar
-- SELECT 
--   oi.id,
--   oi.order_id,
--   oi.product_id,
--   oi.unit_price_sar,
--   oi.quantity,
--   p.price_sar as merchant_price,
--   (oi.unit_price_sar - p.price_sar) as price_difference,
--   CASE 
--     WHEN oi.unit_price_sar > p.price_sar THEN 'يحتوي على عمولة'
--     ELSE 'لا يحتوي على عمولة'
--   END as commission_status
-- FROM public.ecommerce_order_items oi
-- JOIN public.products p ON p.id = oi.product_id
-- JOIN public.ecommerce_orders o ON o.id = oi.order_id
-- WHERE o.payment_status = 'COMPLETED'
--   AND o.affiliate_store_id IS NOT NULL
-- ORDER BY o.created_at DESC
-- LIMIT 20;

-- 5. Function للتحقق من سبب عدم إنشاء عمولات لطلب محدد
CREATE OR REPLACE FUNCTION public.debug_commission_for_order(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_result jsonb;
  v_order_source text;
  v_affiliate_id uuid;
  v_affiliate_store_id uuid;
  v_order_exists boolean;
  v_items_count integer;
  v_items_with_commission integer;
BEGIN
  -- تحديد مصدر الطلب
  SELECT 
    CASE 
      WHEN EXISTS (SELECT 1 FROM public.orders WHERE id = p_order_id) THEN 'orders'
      WHEN EXISTS (SELECT 1 FROM public.ecommerce_orders WHERE id = p_order_id) THEN 'ecommerce_orders'
      ELSE NULL
    END INTO v_order_source;

  IF v_order_source IS NULL THEN
    RETURN jsonb_build_object(
      'error', 'الطلب غير موجود',
      'order_id', p_order_id
    );
  END IF;

  -- الحصول على معلومات الطلب
  IF v_order_source = 'ecommerce_orders' THEN
    SELECT 
      o.affiliate_store_id,
      pf.id,
      EXISTS(SELECT 1 FROM public.ecommerce_orders WHERE id = p_order_id),
      COUNT(oi.id),
      COUNT(oi.id) FILTER (WHERE oi.unit_price_sar > p.price_sar)
    INTO v_affiliate_store_id, v_affiliate_id, v_order_exists, v_items_count, v_items_with_commission
    FROM public.ecommerce_orders o
    LEFT JOIN public.affiliate_stores ast ON ast.id = o.affiliate_store_id
    LEFT JOIN public.profiles pf ON pf.id = ast.profile_id
    LEFT JOIN public.ecommerce_order_items oi ON oi.order_id = o.id
    LEFT JOIN public.products p ON p.id = oi.product_id
    WHERE o.id = p_order_id
    GROUP BY o.affiliate_store_id, pf.id;
  ELSE
    SELECT 
      o.affiliate_store_id,
      pf.id,
      EXISTS(SELECT 1 FROM public.orders WHERE id = p_order_id),
      COUNT(oi.id),
      COUNT(oi.id) FILTER (WHERE oi.product_price_sar > p.price_sar)
    INTO v_affiliate_store_id, v_affiliate_id, v_order_exists, v_items_count, v_items_with_commission
    FROM public.orders o
    LEFT JOIN public.affiliate_stores ast ON ast.id = o.affiliate_store_id
    LEFT JOIN public.profiles pf ON pf.id = ast.profile_id
    LEFT JOIN public.order_items oi ON oi.order_id = o.id
    LEFT JOIN public.products p ON p.id = oi.product_id
    WHERE o.id = p_order_id
    GROUP BY o.affiliate_store_id, pf.id;
  END IF;

  -- بناء النتيجة
  v_result := jsonb_build_object(
    'order_id', p_order_id,
    'order_source', v_order_source,
    'order_exists', v_order_exists,
    'affiliate_store_id', v_affiliate_store_id,
    'affiliate_id', v_affiliate_id,
    'has_affiliate', v_affiliate_store_id IS NOT NULL AND v_affiliate_id IS NOT NULL,
    'items_count', v_items_count,
    'items_with_commission', v_items_with_commission,
    'commissions_exist', EXISTS(SELECT 1 FROM public.commissions WHERE order_id = p_order_id),
    'commissions_count', (SELECT COUNT(*) FROM public.commissions WHERE order_id = p_order_id)
  );

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.debug_commission_for_order(uuid) IS 
'تُرجع معلومات تفصيلية عن سبب عدم إنشاء عمولات لطلب محدد. استخدمها للتشخيص.';
