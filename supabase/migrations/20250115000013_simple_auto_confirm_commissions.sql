-- ============================================================================
-- حل بسيط ومباشر: تأكيد العمولات تلقائياً
-- ============================================================================

-- ✅ 1. Function بسيطة جداً - تعمل عند أي UPDATE على ecommerce_orders
CREATE OR REPLACE FUNCTION public.auto_confirm_commissions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- ✅ إذا كان الطلب موصل (DELIVERED) ومدفوع (COMPLETED)
  IF (
    (NEW.status::text ILIKE '%delivered%' OR UPPER(NEW.status::text) = 'DELIVERED')
    AND NEW.payment_status = 'COMPLETED'
  ) THEN
    -- ✅ تحديث جميع العمولات المعلقة لهذا الطلب
    UPDATE public.commissions
    SET 
      status = 'CONFIRMED',
      updated_at = NOW()
    WHERE order_id = NEW.id
      AND status = 'PENDING';

    -- ✅ تحديث merchant_pending_balance
    UPDATE public.merchant_pending_balance
    SET 
      status = 'CONFIRMED',
      updated_at = NOW()
    WHERE order_id = NEW.id
      AND status = 'PENDING';
  END IF;

  RETURN NEW;
END;
$$;

-- ✅ 2. حذف جميع الـ triggers القديمة
DROP TRIGGER IF EXISTS trg_confirm_commissions_on_ecommerce_delivery ON public.ecommerce_orders;
DROP TRIGGER IF EXISTS trg_confirm_commissions_on_payment_completed ON public.ecommerce_orders;
DROP TRIGGER IF EXISTS trg_auto_confirm_commissions_on_order_update ON public.ecommerce_orders;

-- ✅ 3. إنشاء trigger واحد بسيط على UPDATE
CREATE TRIGGER trg_auto_confirm_commissions
  AFTER UPDATE ON public.ecommerce_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_commissions();

-- ✅ 4. معالجة الطلبات الموجودة مباشرة (بدون function)
DO $$
DECLARE
  v_count integer;
BEGIN
  -- تحديث العمولات للطلبات الموصلة والمدفوعة الموجودة
  UPDATE public.commissions
  SET 
    status = 'CONFIRMED',
    updated_at = NOW()
  WHERE status = 'PENDING'
    AND order_id IN (
      SELECT id 
      FROM public.ecommerce_orders 
      WHERE (
        status::text ILIKE '%delivered%' 
        OR UPPER(status::text) = 'DELIVERED'
      )
      AND payment_status = 'COMPLETED'
    );

  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RAISE NOTICE 'تم تأكيد % عمولة للطلبات الموصلة والمدفوعة', v_count;

  -- تحديث merchant_pending_balance
  UPDATE public.merchant_pending_balance
  SET 
    status = 'CONFIRMED',
    updated_at = NOW()
  WHERE status = 'PENDING'
    AND order_id IN (
      SELECT id 
      FROM public.ecommerce_orders 
      WHERE (
        status::text ILIKE '%delivered%' 
        OR UPPER(status::text) = 'DELIVERED'
      )
      AND payment_status = 'COMPLETED'
    );
END $$;

COMMENT ON FUNCTION public.auto_confirm_commissions() IS 
'تأكيد العمولات تلقائياً عند تحديث الطلب - يعمل تلقائياً بدون تدخل';
