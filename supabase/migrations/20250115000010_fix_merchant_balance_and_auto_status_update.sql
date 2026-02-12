-- ============================================================================
-- إصلاح merchant_pending_balance وإنشاء نظام تحديث تلقائي للحالات
-- ============================================================================

-- 1. إنشاء جدول merchant_pending_balance إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS public.merchant_pending_balance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id UUID NOT NULL,
  order_item_id UUID,
  amount_sar NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'PAID_OUT')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(merchant_id, order_id, order_item_id)
);

CREATE INDEX IF NOT EXISTS idx_merchant_pending_balance_merchant ON public.merchant_pending_balance(merchant_id, status);
CREATE INDEX IF NOT EXISTS idx_merchant_pending_balance_order ON public.merchant_pending_balance(order_id);

COMMENT ON TABLE public.merchant_pending_balance IS 'الرصيد المعلق للتجار - يتم تأكيده عند التوصيل';

-- 2. إصلاح function create_merchant_pending_balance_trigger
CREATE OR REPLACE FUNCTION public.create_merchant_pending_balance_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item RECORD;
  v_merchant_id UUID; -- merchant_id من products (يشير إلى merchants.id)
  v_merchant_profile_id UUID; -- profile_id من merchants (يشير إلى profiles.id)
  v_merchant_share NUMERIC;
  v_platform_share NUMERIC;
  v_affiliate_commission NUMERIC;
BEGIN
  -- التحقق من أن الطلب تم دفعه (استخدام COMPLETED)
  IF NEW.payment_status = 'COMPLETED' AND (OLD.payment_status IS DISTINCT FROM 'COMPLETED' OR OLD IS NULL) THEN
    
    -- المرور على جميع منتجات الطلب
    FOR v_item IN 
      SELECT 
        oi.id,
        oi.product_id,
        oi.unit_price_sar,
        oi.quantity,
        oi.commission_sar,
        p.merchant_id,
        p.merchant_base_price_sar,
        m.profile_id AS merchant_profile_id -- ✅ الحصول على profile_id من merchants
      FROM public.ecommerce_order_items oi
      JOIN public.products p ON p.id = oi.product_id
      LEFT JOIN public.merchants m ON m.id = p.merchant_id -- ✅ ربط مع merchants للحصول على profile_id
      WHERE oi.order_id = NEW.id
        AND m.profile_id IS NOT NULL -- ✅ التأكد من وجود profile_id
    LOOP
      v_merchant_id := v_item.merchant_id;
      v_merchant_profile_id := v_item.merchant_profile_id; -- ✅ استخدام profile_id
      
      -- حساب نصيب التاجر (السعر الأساسي للمنتج × الكمية)
      v_merchant_share := COALESCE(v_item.merchant_base_price_sar, 0) * v_item.quantity;
      
      -- حساب نصيب المنصة (سعر البيع - السعر الأساسي - العمولة)
      v_platform_share := (v_item.unit_price_sar * v_item.quantity) - v_merchant_share - COALESCE(v_item.commission_sar, 0);
      
      -- إضافة الرصيد المعلق للتاجر (ON CONFLICT لتجنب التكرار)
      -- ✅ استخدام merchant_profile_id بدلاً من merchant_id
      INSERT INTO public.merchant_pending_balance (
        merchant_id,
        order_id,
        order_item_id,
        amount_sar,
        status,
        created_at
      )
      VALUES (
        v_merchant_profile_id, -- ✅ استخدام profile_id
        NEW.id,
        v_item.id,
        v_merchant_share,
        'PENDING',
        NOW()
      )
      ON CONFLICT (merchant_id, order_id, order_item_id) DO UPDATE SET
        amount_sar = EXCLUDED.amount_sar,
        updated_at = NOW();
      
      -- إضافة إيرادات المنصة
      -- ✅ platform_revenue.merchant_id يشير إلى profiles(id)
      INSERT INTO public.platform_revenue (
        order_id,
        order_item_id,
        merchant_id,
        merchant_base_price_sar,
        platform_share_sar,
        affiliate_commission_sar,
        final_sale_price_sar,
        status,
        created_at
      )
      VALUES (
        NEW.id,
        v_item.id,
        v_merchant_profile_id, -- ✅ استخدام profile_id
        v_merchant_share,
        v_platform_share,
        COALESCE(v_item.commission_sar, 0),
        v_item.unit_price_sar * v_item.quantity,
        'PENDING',
        NOW()
      )
      ON CONFLICT DO NOTHING; -- تجنب التكرار (إذا كان هناك UNIQUE constraint)
      
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. Function لتحديث حالة الطلب بناءً على حالة الشحن
CREATE OR REPLACE FUNCTION public.update_order_status_from_shipping()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_order_source TEXT;
  v_new_payment_status TEXT;
  v_new_delivery_status TEXT;
BEGIN
  -- استخدام order_id مباشرة من shipments_tracking
  v_order_id := NEW.order_id;

  IF v_order_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- تحديد مصدر الطلب من order_hub
  SELECT 
    oh.source
  INTO v_order_source
  FROM public.order_hub oh
  WHERE oh.source_order_id = v_order_id
  LIMIT 1;

  -- إذا لم نجد في order_hub، نحاول تحديده مباشرة
  IF v_order_source IS NULL THEN
    SELECT 
      CASE 
        WHEN EXISTS (SELECT 1 FROM public.ecommerce_orders WHERE id = v_order_id) THEN 'ecommerce'
        WHEN EXISTS (SELECT 1 FROM public.orders WHERE id = v_order_id) THEN 'legacy'
        ELSE NULL
      END INTO v_order_source;
  END IF;

  -- تحديد الحالات الجديدة بناءً على حالة الشحن
  -- حالة الشحن في shipments_tracking: PREPARING, PICKED_UP, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, FAILED, RETURNED
  -- ✅ payment_status enum: 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED'
  CASE UPPER(NEW.current_status)
    WHEN 'DELIVERED' THEN
      v_new_payment_status := 'COMPLETED'; -- ✅ القيمة الصحيحة في enum
      v_new_delivery_status := 'delivered';
    WHEN 'OUT_FOR_DELIVERY' THEN
      v_new_payment_status := 'COMPLETED'; -- الدفع مكتمل عند الشحن
      v_new_delivery_status := 'shipped';
    WHEN 'IN_TRANSIT' THEN
      v_new_payment_status := 'COMPLETED';
      v_new_delivery_status := 'shipped';
    WHEN 'PICKED_UP' THEN
      v_new_payment_status := 'COMPLETED';
      v_new_delivery_status := 'processing';
    WHEN 'FAILED', 'RETURNED' THEN
      v_new_payment_status := 'REFUNDED';
      v_new_delivery_status := 'cancelled';
    ELSE
      -- للحالات الأخرى (PREPARING, pending)، لا نغير الحالة
      RETURN NEW;
  END CASE;

  -- تحديث حالة الدفع والتوصيل في الجدول المناسب
  IF v_order_source = 'ecommerce' THEN
    -- ✅ التحقق من أن القيمة الجديدة مختلفة قبل التحديث
    -- تحويل enum إلى text للمقارنة
    IF EXISTS (
      SELECT 1 FROM public.ecommerce_orders 
      WHERE id = v_order_id 
        AND (
          payment_status::text != v_new_payment_status 
          OR status != v_new_delivery_status
        )
    ) THEN
      UPDATE public.ecommerce_orders
      SET 
        payment_status = v_new_payment_status::payment_status, -- ✅ تحويل text إلى enum type
        status = v_new_delivery_status,
        updated_at = NOW()
      WHERE id = v_order_id;
    END IF;
  ELSIF v_order_source = 'legacy' THEN
    UPDATE public.orders
    SET 
      status = v_new_delivery_status,
      updated_at = NOW()
    WHERE id = v_order_id
      AND status != v_new_delivery_status;
  END IF;

  RETURN NEW;
END;
$$;

-- 4. Trigger لتحديث حالة الطلب عند تحديث حالة الشحن
DROP TRIGGER IF EXISTS trg_update_order_status_from_shipping ON public.shipments_tracking;

CREATE TRIGGER trg_update_order_status_from_shipping
  AFTER INSERT OR UPDATE OF current_status ON public.shipments_tracking
  FOR EACH ROW
  WHEN (UPPER(NEW.current_status) IN ('DELIVERED', 'OUT_FOR_DELIVERY', 'IN_TRANSIT', 'PICKED_UP', 'FAILED', 'RETURNED'))
  EXECUTE FUNCTION public.update_order_status_from_shipping();

-- 5. Function لتحديث حالة العمولة عند التوصيل
CREATE OR REPLACE FUNCTION public.update_commission_status_on_delivery()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
BEGIN
  -- استخدام order_id مباشرة من shipments_tracking
  v_order_id := NEW.order_id;

  IF v_order_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- عند التوصيل (DELIVERED)، تأكيد العمولات
  IF UPPER(NEW.current_status) = 'DELIVERED' AND (OLD.current_status IS NULL OR UPPER(OLD.current_status) != 'DELIVERED') THEN
    -- تحديث حالة العمولات من PENDING إلى CONFIRMED
    UPDATE public.commissions
    SET 
      status = 'CONFIRMED',
      updated_at = NOW()
    WHERE order_id = v_order_id
      AND status = 'PENDING';

    -- تحديث حالة merchant_pending_balance من PENDING إلى CONFIRMED
    UPDATE public.merchant_pending_balance
    SET 
      status = 'CONFIRMED',
      updated_at = NOW()
    WHERE order_id = v_order_id
      AND status = 'PENDING';

    RAISE NOTICE '[Auto Update] Confirmed commissions and merchant balance for order: %', v_order_id;
  END IF;

  RETURN NEW;
END;
$$;

-- 6. Trigger لتحديث حالة العمولة عند التوصيل
DROP TRIGGER IF EXISTS trg_update_commission_on_delivery ON public.shipments_tracking;

CREATE TRIGGER trg_update_commission_on_delivery
  AFTER UPDATE OF current_status ON public.shipments_tracking
  FOR EACH ROW
  WHEN (UPPER(NEW.current_status) = 'DELIVERED' AND (OLD.current_status IS NULL OR UPPER(OLD.current_status) != 'DELIVERED'))
  EXECUTE FUNCTION public.update_commission_status_on_delivery();

-- 7. Function لتحديث حالة الطلب يدوياً (يمكن استدعاؤها من SQL)
CREATE OR REPLACE FUNCTION public.manual_update_order_status(
  p_order_id UUID,
  p_payment_status TEXT DEFAULT NULL,
  p_delivery_status TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_source TEXT;
  v_result jsonb;
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

  -- تحديث الحالة في الجدول المناسب
  IF v_order_source = 'ecommerce' THEN
    UPDATE public.ecommerce_orders
    SET 
      payment_status = COALESCE(p_payment_status, payment_status),
      status = COALESCE(p_delivery_status, status),
      updated_at = NOW()
    WHERE id = p_order_id;

    -- إذا تم تحديث payment_status إلى COMPLETED، إنشاء العمولات
    IF p_payment_status = 'COMPLETED' THEN
      PERFORM public._generate_commissions_for_order(p_order_id);
    END IF;

    -- إذا تم تحديث delivery_status إلى delivered، تأكيد العمولات
    IF p_delivery_status = 'delivered' THEN
      UPDATE public.commissions
      SET status = 'CONFIRMED', updated_at = NOW()
      WHERE order_id = p_order_id AND status = 'PENDING';

      UPDATE public.merchant_pending_balance
      SET status = 'CONFIRMED', updated_at = NOW()
      WHERE order_id = p_order_id AND status = 'PENDING';
    END IF;

  ELSIF v_order_source = 'legacy' THEN
    UPDATE public.orders
    SET 
      status = COALESCE(p_delivery_status, status),
      updated_at = NOW()
    WHERE id = p_order_id;

    -- إذا تم تحديث status إلى delivered، إنشاء وتأكيد العمولات
    IF p_delivery_status = 'delivered' THEN
      PERFORM public._generate_commissions_for_order(p_order_id);
      
      UPDATE public.commissions
      SET status = 'CONFIRMED', updated_at = NOW()
      WHERE order_id = p_order_id AND status = 'PENDING';
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'order_source', v_order_source,
    'updated_payment_status', p_payment_status,
    'updated_delivery_status', p_delivery_status
  );
END;
$$;

-- 8. إضافة تعليقات توضيحية
COMMENT ON FUNCTION public.update_order_status_from_shipping() IS 
'تحديث حالة الدفع والتوصيل تلقائياً عند تحديث حالة الشحن';

COMMENT ON FUNCTION public.update_commission_status_on_delivery() IS 
'تحديث حالة العمولة تلقائياً عند التوصيل';

COMMENT ON FUNCTION public.manual_update_order_status(UUID, TEXT, TEXT) IS 
'تحديث حالة الطلب يدوياً - يمكن استدعاؤها من SQL: SELECT manual_update_order_status(''order_id'', ''COMPLETED'', ''delivered'')';

-- 9. Function لتأكيد العمولات عند تغيير status في ecommerce_orders إلى DELIVERED
CREATE OR REPLACE FUNCTION public.confirm_commissions_on_ecommerce_delivery()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- ✅ عند تغيير status إلى 'DELIVERED' أو 'delivered'
  IF (
    (UPPER(NEW.status::text) = 'DELIVERED' OR LOWER(NEW.status::text) = 'delivered')
    AND (OLD.status IS NULL OR UPPER(OLD.status::text) != 'DELIVERED' AND LOWER(OLD.status::text) != 'delivered')
  ) THEN
    -- تحديث حالة العمولات من PENDING إلى CONFIRMED
    UPDATE public.commissions
    SET 
      status = 'CONFIRMED',
      updated_at = NOW()
    WHERE order_id = NEW.id
      AND status = 'PENDING';

    -- تحديث حالة merchant_pending_balance من PENDING إلى CONFIRMED
    UPDATE public.merchant_pending_balance
    SET 
      status = 'CONFIRMED',
      updated_at = NOW()
    WHERE order_id = NEW.id
      AND status = 'PENDING';

    RAISE NOTICE '[Auto Confirm] Confirmed commissions for ecommerce order: %', NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- 10. Trigger على ecommerce_orders لتأكيد العمولات عند التوصيل
DROP TRIGGER IF EXISTS trg_confirm_commissions_on_ecommerce_delivery ON public.ecommerce_orders;

CREATE TRIGGER trg_confirm_commissions_on_ecommerce_delivery
  AFTER UPDATE OF status ON public.ecommerce_orders
  FOR EACH ROW
  WHEN (
    (UPPER(NEW.status::text) = 'DELIVERED' OR LOWER(NEW.status::text) = 'delivered')
    AND (OLD.status IS NULL OR UPPER(OLD.status::text) != 'DELIVERED' AND LOWER(OLD.status::text) != 'delivered')
  )
  EXECUTE FUNCTION public.confirm_commissions_on_ecommerce_delivery();

-- 11. إضافة تعليق توضيحي
COMMENT ON FUNCTION public.confirm_commissions_on_ecommerce_delivery() IS 
'تأكيد العمولات تلقائياً عند تغيير status في ecommerce_orders إلى DELIVERED';

-- 12. Function لتأكيد العمولات للطلبات الموصلة الموجودة (للمعالجة اليدوية)
CREATE OR REPLACE FUNCTION public.confirm_commissions_for_delivered_orders()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
  v_order RECORD;
BEGIN
  -- البحث عن جميع الطلبات الموصلة التي لديها عمولات معلقة
  FOR v_order IN
    SELECT DISTINCT o.id
    FROM public.ecommerce_orders o
    WHERE (UPPER(o.status::text) = 'DELIVERED' OR LOWER(o.status::text) = 'delivered')
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
    'message', 'تم تأكيد العمولات للطلبات الموصلة'
  );
END;
$$;

COMMENT ON FUNCTION public.confirm_commissions_for_delivered_orders() IS 
'تأكيد العمولات للطلبات الموصلة الموجودة - يمكن استدعاؤها يدوياً: SELECT confirm_commissions_for_delivered_orders()';
