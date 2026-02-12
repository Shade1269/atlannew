-- ============================================================================
-- إصلاح Trigger لتأكيد العمولات تلقائياً عند التوصيل
-- ============================================================================

-- ✅ Function محسّنة لتأكيد العمولات عند تغيير status في ecommerce_orders إلى DELIVERED
CREATE OR REPLACE FUNCTION public.confirm_commissions_on_ecommerce_delivery()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_status TEXT;
  v_new_status TEXT;
BEGIN
  -- تحويل الحالة إلى نص للمقارنة
  v_old_status := COALESCE(OLD.status::text, '');
  v_new_status := NEW.status::text;

  -- ✅ التحقق من أن الحالة تغيرت إلى DELIVERED
  IF (
    (UPPER(v_new_status) = 'DELIVERED' OR LOWER(v_new_status) = 'delivered')
    AND (v_old_status IS NULL OR UPPER(v_old_status) != 'DELIVERED' AND LOWER(v_old_status) != 'delivered')
  ) THEN
    -- ✅ تحديث حالة العمولات من PENDING إلى CONFIRMED
    UPDATE public.commissions
    SET 
      status = 'CONFIRMED',
      updated_at = NOW()
    WHERE order_id = NEW.id
      AND status = 'PENDING';

    -- ✅ تحديث حالة merchant_pending_balance من PENDING إلى CONFIRMED
    UPDATE public.merchant_pending_balance
    SET 
      status = 'CONFIRMED',
      updated_at = NOW()
    WHERE order_id = NEW.id
      AND status = 'PENDING';

    RAISE NOTICE '[Auto Confirm] Confirmed commissions for ecommerce order: %, old_status: %, new_status: %', 
      NEW.id, v_old_status, v_new_status;
  END IF;

  RETURN NEW;
END;
$$;

-- ✅ حذف Trigger القديم وإعادة إنشاؤه
DROP TRIGGER IF EXISTS trg_confirm_commissions_on_ecommerce_delivery ON public.ecommerce_orders;

CREATE TRIGGER trg_confirm_commissions_on_ecommerce_delivery
  AFTER UPDATE OF status ON public.ecommerce_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.confirm_commissions_on_ecommerce_delivery();

-- ✅ إضافة تعليق توضيحي
COMMENT ON FUNCTION public.confirm_commissions_on_ecommerce_delivery() IS 
'تأكيد العمولات تلقائياً عند تغيير status في ecommerce_orders إلى DELIVERED - يعمل تلقائياً بدون تدخل';

-- ============================================================================
-- ✅ Function إضافية: تأكيد العمولات عند تغيير payment_status إلى COMPLETED (إذا كان الطلب موصل)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.confirm_commissions_on_payment_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_status TEXT;
BEGIN
  -- ✅ إذا تم الدفع وكان الطلب موصل، تأكيد العمولات
  IF (
    NEW.payment_status = 'COMPLETED'
    AND (OLD.payment_status IS NULL OR OLD.payment_status != 'COMPLETED')
  ) THEN
    -- جلب حالة الطلب
    v_order_status := NEW.status::text;

    -- إذا كان الطلب موصل، تأكيد العمولات
    IF (
      UPPER(v_order_status) = 'DELIVERED' 
      OR LOWER(v_order_status) = 'delivered'
    ) THEN
      UPDATE public.commissions
      SET 
        status = 'CONFIRMED',
        updated_at = NOW()
      WHERE order_id = NEW.id
        AND status = 'PENDING';

      UPDATE public.merchant_pending_balance
      SET 
        status = 'CONFIRMED',
        updated_at = NOW()
      WHERE order_id = NEW.id
        AND status = 'PENDING';

      RAISE NOTICE '[Auto Confirm] Confirmed commissions for paid and delivered order: %', NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- ✅ Trigger على payment_status
DROP TRIGGER IF EXISTS trg_confirm_commissions_on_payment_completed ON public.ecommerce_orders;

CREATE TRIGGER trg_confirm_commissions_on_payment_completed
  AFTER UPDATE OF payment_status ON public.ecommerce_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.confirm_commissions_on_payment_completed();

COMMENT ON FUNCTION public.confirm_commissions_on_payment_completed() IS 
'تأكيد العمولات تلقائياً عند الدفع إذا كان الطلب موصل';

-- ============================================================================
-- ✅ Function: تأكيد العمولات عند تحديث status و payment_status معاً
-- ============================================================================

CREATE OR REPLACE FUNCTION public.auto_confirm_commissions_on_order_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_delivered BOOLEAN := FALSE;
  v_is_paid BOOLEAN := FALSE;
BEGIN
  -- ✅ التحقق من أن الطلب موصل
  v_is_delivered := (
    UPPER(NEW.status::text) = 'DELIVERED' 
    OR LOWER(NEW.status::text) = 'delivered'
  );

  -- ✅ التحقق من أن الطلب مدفوع
  v_is_paid := (NEW.payment_status = 'COMPLETED');

  -- ✅ إذا كان الطلب موصل ومدفوع، تأكيد العمولات
  IF v_is_delivered AND v_is_paid THEN
    -- التحقق من أن هناك عمولات معلقة
    IF EXISTS (
      SELECT 1 FROM public.commissions 
      WHERE order_id = NEW.id 
      AND status = 'PENDING'
    ) THEN
      UPDATE public.commissions
      SET 
        status = 'CONFIRMED',
        updated_at = NOW()
      WHERE order_id = NEW.id
        AND status = 'PENDING';

      UPDATE public.merchant_pending_balance
      SET 
        status = 'CONFIRMED',
        updated_at = NOW()
      WHERE order_id = NEW.id
        AND status = 'PENDING';

      RAISE NOTICE '[Auto Confirm] Confirmed commissions for order: % (delivered: %, paid: %)', 
        NEW.id, v_is_delivered, v_is_paid;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- ✅ Trigger شامل على UPDATE (لأي تغيير في status أو payment_status)
DROP TRIGGER IF EXISTS trg_auto_confirm_commissions_on_order_update ON public.ecommerce_orders;

CREATE TRIGGER trg_auto_confirm_commissions_on_order_update
  AFTER UPDATE ON public.ecommerce_orders
  FOR EACH ROW
  WHEN (
    (NEW.status IS DISTINCT FROM OLD.status OR NEW.payment_status IS DISTINCT FROM OLD.payment_status)
  )
  EXECUTE FUNCTION public.auto_confirm_commissions_on_order_update();

COMMENT ON FUNCTION public.auto_confirm_commissions_on_order_update() IS 
'تأكيد العمولات تلقائياً عند أي تحديث في status أو payment_status - يعمل تلقائياً بدون تدخل';

-- ============================================================================
-- ✅ Function: معالجة الطلبات الموجودة التي هي موصلة ومدفوعة لكن عمولاتها معلقة
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fix_pending_commissions_for_existing_orders()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
  v_order RECORD;
BEGIN
  -- البحث عن جميع الطلبات الموصلة والمدفوعة التي لديها عمولات معلقة
  FOR v_order IN
    SELECT DISTINCT o.id
    FROM public.ecommerce_orders o
    WHERE (
      UPPER(o.status::text) = 'DELIVERED' 
      OR LOWER(o.status::text) = 'delivered'
    )
      AND o.payment_status = 'COMPLETED'
      AND EXISTS (
        SELECT 1 FROM public.commissions c 
        WHERE c.order_id = o.id 
        AND c.status = 'PENDING'
      )
  LOOP
    -- تأكيد العمولات
    UPDATE public.commissions
    SET 
      status = 'CONFIRMED',
      updated_at = NOW()
    WHERE order_id = v_order.id
      AND status = 'PENDING';

    -- تأكيد merchant_pending_balance
    UPDATE public.merchant_pending_balance
    SET 
      status = 'CONFIRMED',
      updated_at = NOW()
    WHERE order_id = v_order.id
      AND status = 'PENDING';

    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'orders_processed', v_count,
    'message', 'تم تأكيد العمولات للطلبات الموصلة والمدفوعة الموجودة'
  );
END;
$$;

COMMENT ON FUNCTION public.fix_pending_commissions_for_existing_orders() IS 
'معالجة الطلبات الموجودة - يمكن استدعاؤها مرة واحدة: SELECT fix_pending_commissions_for_existing_orders()';
