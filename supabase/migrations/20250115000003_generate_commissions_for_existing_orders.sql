-- ============================================================================
-- إعادة حساب وإنشاء العمولات للطلبات المدفوعة الموجودة
-- ============================================================================

-- 1. Function لإعادة حساب العمولات لجميع الطلبات المدفوعة الموجودة
-- هذا سينشئ العمولات للطلبات التي تم دفعها قبل إنشاء trigger
DO $$
DECLARE
  v_order RECORD;
  v_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'بدء إعادة حساب العمولات للطلبات المدفوعة...';

  -- إعادة حساب العمولات لجميع الطلبات المدفوعة أو المعلقة من جدول ecommerce_orders
  -- ملاحظة: ننشئ عمولات للطلبات PENDING أيضاً لأن affiliate_commission_sar موجود
  FOR v_order IN 
    SELECT DISTINCT o.id, o.affiliate_store_id, o.created_at
    FROM public.ecommerce_orders o
    WHERE o.affiliate_store_id IS NOT NULL
      AND (o.payment_status = 'COMPLETED' OR o.payment_status = 'PENDING')
      AND NOT EXISTS (
        SELECT 1 FROM public.commissions c WHERE c.order_id = o.id
      )
    ORDER BY o.created_at DESC
  LOOP
    BEGIN
      PERFORM public._generate_commissions_for_order(v_order.id);
      v_count := v_count + 1;
      
      IF v_count % 10 = 0 THEN
        RAISE NOTICE 'تم معالجة % طلبات...', v_count;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'خطأ في معالجة الطلب %: %', v_order.id, SQLERRM;
    END;
  END LOOP;

  -- إعادة حساب العمولات لجميع الطلبات المكتملة من جدول orders (القديم)
  FOR v_order IN 
    SELECT DISTINCT o.id, o.affiliate_store_id, o.created_at
    FROM public.orders o
    WHERE o.status::text IN ('delivered', 'completed', 'confirmed', 'shipped')
      AND o.affiliate_store_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.commissions c WHERE c.order_id = o.id
      )
    ORDER BY o.created_at DESC
  LOOP
    BEGIN
      PERFORM public._generate_commissions_for_order(v_order.id);
      v_count := v_count + 1;
      
      IF v_count % 10 = 0 THEN
        RAISE NOTICE 'تم معالجة % طلبات...', v_count;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'خطأ في معالجة الطلب %: %', v_order.id, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE 'تم إعادة حساب العمولات لـ % طلب بنجاح', v_count;
END $$;

-- 2. إضافة تعليق توضيحي
COMMENT ON FUNCTION public._generate_commissions_for_order(uuid) IS 
'تحسب العمولات بناءً على الفرق بين سعر التاجر وسعر المتجر مع خصم نسبة المنصة من الإعدادات (افتراضي 10%). تدعم كلا من orders و ecommerce_orders. يتم استدعاؤها تلقائياً عند دفع الطلب عبر trigger.';
