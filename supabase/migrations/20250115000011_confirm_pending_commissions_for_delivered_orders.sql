-- ============================================================================
-- تأكيد العمولات المعلقة للطلبات الموصلة الموجودة
-- ============================================================================

-- ✅ Function بسيطة لتحديث العمولات المعلقة مباشرة (بدون شروط)
CREATE OR REPLACE FUNCTION public.force_confirm_all_pending_commissions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
BEGIN
  -- تحديث جميع العمولات المعلقة إلى مؤكدة
  UPDATE public.commissions
  SET 
    status = 'CONFIRMED',
    updated_at = NOW()
  WHERE status = 'PENDING';

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- تحديث merchant_pending_balance
  UPDATE public.merchant_pending_balance
  SET 
    status = 'CONFIRMED',
    updated_at = NOW()
  WHERE status = 'PENDING';

  RETURN jsonb_build_object(
    'success', true,
    'commissions_confirmed', v_count,
    'message', 'تم تأكيد جميع العمولات المعلقة'
  );
END;
$$;

COMMENT ON FUNCTION public.force_confirm_all_pending_commissions() IS 
'تأكيد جميع العمولات المعلقة مباشرة - للاستخدام في حالات الطوارئ';

-- Function لتأكيد العمولات للطلبات الموصلة (محدثة)
CREATE OR REPLACE FUNCTION public.confirm_commissions_for_delivered_orders()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
  v_order RECORD;
  v_commission_count integer;
BEGIN
  -- البحث عن جميع الطلبات الموصلة التي لديها عمولات معلقة
  FOR v_order IN
    SELECT DISTINCT o.id, o.status, o.payment_status
    FROM public.ecommerce_orders o
    WHERE (
      UPPER(o.status::text) = 'DELIVERED' 
      OR LOWER(o.status::text) = 'delivered'
      OR o.status::text ILIKE '%delivered%'
    )
      AND o.payment_status = 'COMPLETED'
      AND EXISTS (
        SELECT 1 FROM public.commissions c 
        WHERE c.order_id = o.id 
        AND c.status = 'PENDING'
      )
  LOOP
    -- تأكيد العمولات للطلب
    UPDATE public.commissions
    SET 
      status = 'CONFIRMED',
      updated_at = NOW()
    WHERE order_id = v_order.id
      AND status = 'PENDING'
    RETURNING id INTO v_commission_count;

    -- تأكيد merchant_pending_balance
    UPDATE public.merchant_pending_balance
    SET 
      status = 'CONFIRMED',
      updated_at = NOW()
    WHERE order_id = v_order.id
      AND status = 'PENDING';

    v_count := v_count + 1;
    
    RAISE NOTICE '[Confirm Commissions] Order: %, Status: %, Payment: %, Commissions updated: %', 
      v_order.id, v_order.status, v_order.payment_status, v_commission_count;
  END LOOP;

  -- ✅ أيضاً البحث في جدول orders القديم
  FOR v_order IN
    SELECT DISTINCT o.id, o.status::text as status
    FROM public.orders o
    WHERE (
      UPPER(o.status::text) = 'DELIVERED' 
      OR LOWER(o.status::text) = 'delivered'
      OR o.status::text ILIKE '%delivered%'
    )
      AND EXISTS (
        SELECT 1 FROM public.commissions c 
        WHERE c.order_id = o.id 
        AND c.status = 'PENDING'
      )
  LOOP
    -- تأكيد العمولات للطلب
    UPDATE public.commissions
    SET 
      status = 'CONFIRMED',
      updated_at = NOW()
    WHERE order_id = v_order.id
      AND status = 'PENDING';

    v_count := v_count + 1;
    
    RAISE NOTICE '[Confirm Commissions] Legacy Order: %, Status: %', 
      v_order.id, v_order.status;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'orders_processed', v_count,
    'message', 'تم تأكيد العمولات للطلبات الموصلة'
  );
END;
$$;

-- Function لتأكيد عمولات طلب محدد
CREATE OR REPLACE FUNCTION public.confirm_commissions_for_order(p_order_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_status TEXT;
  v_payment_status TEXT;
  v_commission_count integer := 0;
  v_order_source TEXT;
BEGIN
  -- تحديد مصدر الطلب
  SELECT 
    CASE 
      WHEN EXISTS (SELECT 1 FROM public.ecommerce_orders WHERE id = p_order_id) THEN 'ecommerce'
      WHEN EXISTS (SELECT 1 FROM public.orders WHERE id = p_order_id) THEN 'legacy'
      ELSE NULL
    END INTO v_order_source;

  IF v_order_source IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'الطلب غير موجود',
      'order_id', p_order_id
    );
  END IF;

  -- جلب حالة الطلب
  IF v_order_source = 'ecommerce' THEN
    SELECT status::text, payment_status::text
    INTO v_order_status, v_payment_status
    FROM public.ecommerce_orders
    WHERE id = p_order_id;
  ELSE
    SELECT status::text, NULL
    INTO v_order_status, v_payment_status
    FROM public.orders
    WHERE id = p_order_id;
  END IF;

  -- التحقق من أن الطلب موصل
  IF NOT (
    UPPER(v_order_status) = 'DELIVERED' 
    OR LOWER(v_order_status) = 'delivered'
    OR v_order_status ILIKE '%delivered%'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'الطلب غير موصل',
      'order_id', p_order_id,
      'order_status', v_order_status
    );
  END IF;

  -- تأكيد العمولات
  UPDATE public.commissions
  SET 
    status = 'CONFIRMED',
    updated_at = NOW()
  WHERE order_id = p_order_id
    AND status = 'PENDING';

  GET DIAGNOSTICS v_commission_count = ROW_COUNT;

  -- تأكيد merchant_pending_balance (فقط للطلبات ecommerce)
  IF v_order_source = 'ecommerce' THEN
    UPDATE public.merchant_pending_balance
    SET 
      status = 'CONFIRMED',
      updated_at = NOW()
    WHERE order_id = p_order_id
      AND status = 'PENDING';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'order_source', v_order_source,
    'order_status', v_order_status,
    'payment_status', v_payment_status,
    'commissions_confirmed', v_commission_count,
    'message', 'تم تأكيد العمولات بنجاح'
  );
END;
$$;

-- إضافة تعليقات توضيحية
COMMENT ON FUNCTION public.confirm_commissions_for_delivered_orders() IS 
'تأكيد العمولات للطلبات الموصلة الموجودة - يمكن استدعاؤها يدوياً: SELECT confirm_commissions_for_delivered_orders()';

COMMENT ON FUNCTION public.confirm_commissions_for_order(UUID) IS 
'تأكيد عمولات طلب محدد - يمكن استدعاؤها يدوياً: SELECT confirm_commissions_for_order(''order_id'')';
