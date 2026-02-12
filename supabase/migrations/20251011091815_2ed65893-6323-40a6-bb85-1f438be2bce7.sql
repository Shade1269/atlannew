-- ============================================================================
-- المرحلة 6: تنظيف البيانات (Data Cleanup)
-- الهدف: فحص وإصلاح البيانات اليتيمة وملء الحقول المفقودة
-- ============================================================================

-- -----------------------------------------------------------------------------
-- 1. دالة شاملة للفحص الأمني للبيانات
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_all_data_quality()
RETURNS TABLE(
  check_category TEXT,
  check_name TEXT,
  status TEXT,
  found_issues INTEGER,
  details JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- فحص order_hub orphans
  RETURN QUERY
  SELECT 
    'orders'::TEXT,
    'order_hub_orphans'::TEXT,
    CASE WHEN COUNT(*) = 0 THEN 'ok' ELSE 'warning' END::TEXT,
    COUNT(*)::INTEGER,
    jsonb_build_object('orphan_count', COUNT(*))
  FROM check_order_hub_orphans();

  -- فحص profile orphans
  RETURN QUERY
  SELECT 
    'profiles'::TEXT,
    'profile_orphans'::TEXT,
    CASE WHEN COUNT(*) = 0 THEN 'ok' ELSE 'warning' END::TEXT,
    COUNT(*)::INTEGER,
    jsonb_build_object('orphan_count', COUNT(*))
  FROM check_profile_orphans();

  -- فحص shipments بدون order_hub_id
  RETURN QUERY
  SELECT 
    'shipments'::TEXT,
    'shipments_without_order'::TEXT,
    CASE WHEN COUNT(*) = 0 THEN 'ok' ELSE 'warning' END::TEXT,
    COUNT(*)::INTEGER,
    jsonb_build_object(
      'count', COUNT(*),
      'sample_ids', jsonb_agg(id)
    )
  FROM (
    SELECT id FROM shipments 
    WHERE order_hub_id IS NULL 
    LIMIT 10
  ) s;

  -- فحص invoices بدون order_hub_id
  RETURN QUERY
  SELECT 
    'invoices'::TEXT,
    'invoices_without_order'::TEXT,
    CASE WHEN COUNT(*) = 0 THEN 'ok' ELSE 'warning' END::TEXT,
    COUNT(*)::INTEGER,
    jsonb_build_object(
      'count', COUNT(*),
      'sample_ids', jsonb_agg(id)
    )
  FROM (
    SELECT id FROM invoices 
    WHERE order_hub_id IS NULL 
    LIMIT 10
  ) i;

  -- فحص products بدون shop_id
  RETURN QUERY
  SELECT 
    'products'::TEXT,
    'products_without_shop'::TEXT,
    CASE WHEN COUNT(*) = 0 THEN 'ok' ELSE 'error' END::TEXT,
    COUNT(*)::INTEGER,
    jsonb_build_object(
      'count', COUNT(*),
      'sample_ids', jsonb_agg(id)
    )
  FROM (
    SELECT id FROM products 
    WHERE shop_id IS NULL 
    LIMIT 10
  ) p;

  -- فحص affiliate_stores بدون profile_id
  RETURN QUERY
  SELECT 
    'stores'::TEXT,
    'stores_without_profile'::TEXT,
    CASE WHEN COUNT(*) = 0 THEN 'ok' ELSE 'error' END::TEXT,
    COUNT(*)::INTEGER,
    jsonb_build_object(
      'count', COUNT(*),
      'sample_ids', jsonb_agg(id)
    )
  FROM (
    SELECT id FROM affiliate_stores 
    WHERE profile_id IS NULL 
    LIMIT 10
  ) ast;

  -- فحص profiles بدون email و phone
  RETURN QUERY
  SELECT 
    'profiles'::TEXT,
    'profiles_missing_contact'::TEXT,
    CASE WHEN COUNT(*) = 0 THEN 'ok' ELSE 'warning' END::TEXT,
    COUNT(*)::INTEGER,
    jsonb_build_object(
      'count', COUNT(*),
      'sample_ids', jsonb_agg(id)
    )
  FROM (
    SELECT id FROM profiles 
    WHERE (email IS NULL OR email = '') 
      AND (phone IS NULL OR phone = '')
    LIMIT 10
  ) p;

END;
$$;

-- -----------------------------------------------------------------------------
-- 2. دالة لإصلاح البيانات المفقودة تلقائياً
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.auto_fix_missing_data()
RETURNS TABLE(
  fix_category TEXT,
  fix_name TEXT,
  rows_affected INTEGER,
  details JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_affected INTEGER;
BEGIN
  -- 1. تحديث shipments بدون tracking_number
  UPDATE shipments
  SET shipment_number = generate_shipment_number()
  WHERE shipment_number IS NULL OR shipment_number = '';
  
  GET DIAGNOSTICS v_affected = ROW_COUNT;
  RETURN QUERY SELECT 
    'shipments'::TEXT,
    'fix_shipment_numbers'::TEXT,
    v_affected,
    jsonb_build_object('updated_count', v_affected);

  -- 2. تحديث invoices بدون invoice_number
  UPDATE invoices
  SET invoice_number = generate_invoice_number()
  WHERE invoice_number IS NULL OR invoice_number = '';
  
  GET DIAGNOSTICS v_affected = ROW_COUNT;
  RETURN QUERY SELECT 
    'invoices'::TEXT,
    'fix_invoice_numbers'::TEXT,
    v_affected,
    jsonb_build_object('updated_count', v_affected);

  -- 3. تحديث refunds بدون refund_number
  UPDATE refunds
  SET refund_number = generate_refund_number()
  WHERE refund_number IS NULL OR refund_number = '';
  
  GET DIAGNOSTICS v_affected = ROW_COUNT;
  RETURN QUERY SELECT 
    'refunds'::TEXT,
    'fix_refund_numbers'::TEXT,
    v_affected,
    jsonb_build_object('updated_count', v_affected);

  -- 4. تحديث product_returns بدون return_number
  UPDATE product_returns
  SET return_number = generate_return_number()
  WHERE return_number IS NULL OR return_number = '';
  
  GET DIAGNOSTICS v_affected = ROW_COUNT;
  RETURN QUERY SELECT 
    'returns'::TEXT,
    'fix_return_numbers'::TEXT,
    v_affected,
    jsonb_build_object('updated_count', v_affected);

  -- 5. تحديث profiles بدون full_name (استخدام email أو phone)
  UPDATE profiles
  SET full_name = COALESCE(
    NULLIF(email, ''),
    NULLIF(phone, ''),
    'مستخدم ' || SUBSTRING(id::TEXT, 1, 8)
  )
  WHERE (full_name IS NULL OR full_name = '')
    AND id IS NOT NULL;
  
  GET DIAGNOSTICS v_affected = ROW_COUNT;
  RETURN QUERY SELECT 
    'profiles'::TEXT,
    'fix_profile_names'::TEXT,
    v_affected,
    jsonb_build_object('updated_count', v_affected);

  -- 6. تحديث order_hub بدون order_number
  UPDATE order_hub
  SET order_number = COALESCE(
    source_order_id::TEXT,
    'ORD-' || SUBSTRING(id::TEXT, 1, 8)
  )
  WHERE (order_number IS NULL OR order_number = '')
    AND id IS NOT NULL;
  
  GET DIAGNOSTICS v_affected = ROW_COUNT;
  RETURN QUERY SELECT 
    'orders'::TEXT,
    'fix_order_numbers'::TEXT,
    v_affected,
    jsonb_build_object('updated_count', v_affected);

END;
$$;

-- -----------------------------------------------------------------------------
-- 3. دالة لحذف البيانات القديمة المنتهية
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_expired_data()
RETURNS TABLE(
  cleanup_category TEXT,
  cleanup_name TEXT,
  rows_deleted INTEGER,
  details JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  -- 1. حذف shopping_carts القديمة (أكثر من 30 يوم)
  DELETE FROM shopping_carts
  WHERE updated_at < NOW() - INTERVAL '30 days'
    AND user_id IS NULL; -- فقط للزوار غير المسجلين
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN QUERY SELECT 
    'carts'::TEXT,
    'delete_old_guest_carts'::TEXT,
    v_deleted,
    jsonb_build_object('deleted_count', v_deleted);

  -- 2. حذف customer_otp_sessions القديمة (أكثر من 7 أيام)
  DELETE FROM customer_otp_sessions
  WHERE created_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN QUERY SELECT 
    'auth'::TEXT,
    'delete_old_otp_sessions'::TEXT,
    v_deleted,
    jsonb_build_object('deleted_count', v_deleted);

  -- 3. حذف whatsapp_otp القديمة (أكثر من يوم واحد)
  DELETE FROM whatsapp_otp
  WHERE created_at < NOW() - INTERVAL '1 day';
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN QUERY SELECT 
    'auth'::TEXT,
    'delete_old_whatsapp_otp'::TEXT,
    v_deleted,
    jsonb_build_object('deleted_count', v_deleted);

END;
$$;

-- -----------------------------------------------------------------------------
-- 4. دالة لتحديث الإحصائيات المفقودة
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.backfill_statistics()
RETURNS TABLE(
  stat_category TEXT,
  stat_name TEXT,
  rows_updated INTEGER,
  details JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  -- 1. تحديث affiliate_stores.total_orders و total_sales
  WITH store_stats AS (
    SELECT 
      affiliate_store_id,
      COUNT(*) as order_count,
      COALESCE(SUM(total_amount_sar), 0) as total_revenue
    FROM order_hub
    WHERE affiliate_store_id IS NOT NULL
    GROUP BY affiliate_store_id
  )
  UPDATE affiliate_stores ast
  SET 
    total_orders = ss.order_count,
    total_sales = ss.total_revenue,
    updated_at = NOW()
  FROM store_stats ss
  WHERE ast.id = ss.affiliate_store_id
    AND (ast.total_orders != ss.order_count OR ast.total_sales != ss.total_revenue);
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN QUERY SELECT 
    'stores'::TEXT,
    'backfill_store_stats'::TEXT,
    v_updated,
    jsonb_build_object('updated_stores', v_updated);

  -- 2. تحديث profiles.points من points_events
  WITH user_points AS (
    SELECT 
      affiliate_id,
      COALESCE(SUM(points_earned), 0) as total_points
    FROM points_events
    GROUP BY affiliate_id
  )
  UPDATE profiles p
  SET 
    points = up.total_points,
    updated_at = NOW()
  FROM user_points up
  WHERE p.id = up.affiliate_id
    AND p.points != up.total_points;
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN QUERY SELECT 
    'profiles'::TEXT,
    'backfill_user_points'::TEXT,
    v_updated,
    jsonb_build_object('updated_profiles', v_updated);

END;
$$;

-- -----------------------------------------------------------------------------
-- 5. دالة شاملة لإدارة التنظيف
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.run_full_cleanup()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quality_report JSONB;
  v_fix_report JSONB;
  v_cleanup_report JSONB;
  v_backfill_report JSONB;
BEGIN
  -- 1. فحص الجودة
  SELECT jsonb_agg(row_to_json(q))
  INTO v_quality_report
  FROM check_all_data_quality() q;

  -- 2. إصلاح البيانات المفقودة
  SELECT jsonb_agg(row_to_json(f))
  INTO v_fix_report
  FROM auto_fix_missing_data() f;

  -- 3. حذف البيانات القديمة
  SELECT jsonb_agg(row_to_json(c))
  INTO v_cleanup_report
  FROM cleanup_expired_data() c;

  -- 4. تحديث الإحصائيات
  SELECT jsonb_agg(row_to_json(b))
  INTO v_backfill_report
  FROM backfill_statistics() b;

  RETURN jsonb_build_object(
    'timestamp', NOW(),
    'quality_checks', COALESCE(v_quality_report, '[]'::jsonb),
    'fixes_applied', COALESCE(v_fix_report, '[]'::jsonb),
    'cleanup_done', COALESCE(v_cleanup_report, '[]'::jsonb),
    'backfill_done', COALESCE(v_backfill_report, '[]'::jsonb)
  );
END;
$$;

-- -----------------------------------------------------------------------------
-- تعليقات توضيحية
-- -----------------------------------------------------------------------------
COMMENT ON FUNCTION check_all_data_quality() IS 
'فحص شامل لجودة البيانات في جميع الجداول الرئيسية';

COMMENT ON FUNCTION auto_fix_missing_data() IS 
'إصلاح تلقائي للبيانات المفقودة (أرقام، أسماء، إلخ)';

COMMENT ON FUNCTION cleanup_expired_data() IS 
'حذف البيانات المنتهية والقديمة (carts، OTP، sessions)';

COMMENT ON FUNCTION backfill_statistics() IS 
'تحديث الإحصائيات المفقودة أو القديمة (إحصائيات المتاجر، النقاط)';

COMMENT ON FUNCTION run_full_cleanup() IS 
'دالة شاملة تجمع كل عمليات التنظيف والإصلاح';
