-- ============================================================================
-- تحديث حساب العمولات: بناءً على الفرق بين سعر التاجر وسعر المتجر مع خصم نسبة المنصة (افتراضي 10%)
-- ============================================================================

-- 0. إضافة إعداد نسبة عمولة المنصة في platform_settings
INSERT INTO public.platform_settings (setting_key, setting_value, description)
VALUES (
    'affiliate_platform_commission_rate',
    '{"rate": 10, "enabled": true}'::jsonb,
    'نسبة عمولة المنصة من عمولة المسوق (افتراضي 10%)'
)
ON CONFLICT (setting_key) DO UPDATE SET
    setting_value = '{"rate": 10, "enabled": true}'::jsonb,
    description = 'نسبة عمولة المنصة من عمولة المسوق (افتراضي 10%)';

-- Function للحصول على نسبة عمولة المنصة من الإعدادات
CREATE OR REPLACE FUNCTION public.get_platform_commission_rate()
RETURNS numeric
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_rate numeric;
  v_setting jsonb;
BEGIN
  -- الحصول على الإعداد من platform_settings
  SELECT setting_value INTO v_setting
  FROM public.platform_settings
  WHERE setting_key = 'affiliate_platform_commission_rate'
  LIMIT 1;

  -- استخراج النسبة من JSON
  IF v_setting IS NOT NULL AND (v_setting->>'enabled')::boolean = true THEN
    v_rate := COALESCE((v_setting->>'rate')::numeric, 10);
  ELSE
    v_rate := 10; -- القيمة الافتراضية 10%
  END IF;

  -- التأكد من أن النسبة بين 0 و 100
  RETURN GREATEST(0, LEAST(100, v_rate));
END;
$$;

-- 1. تحديث function حساب العمولات لتعتمد على الفرق بين السعرين
-- ✅ تدعم كلا الجدولين: orders و ecommerce_orders
CREATE OR REPLACE FUNCTION public._generate_commissions_for_order(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_affiliate_id uuid;
  v_affiliate_store_id uuid;
  v_order_source text;
  v_count integer;
BEGIN
  -- تحديد مصدر الطلب (orders أو ecommerce_orders)
  SELECT 
    CASE 
      WHEN EXISTS (SELECT 1 FROM public.orders WHERE id = p_order_id) THEN 'orders'
      WHEN EXISTS (SELECT 1 FROM public.ecommerce_orders WHERE id = p_order_id) THEN 'ecommerce_orders'
      ELSE NULL
    END INTO v_order_source;

  IF v_order_source IS NULL THEN
    -- إذا لم نجد الطلب، لا نفعل شيء (قد يكون من جدول آخر)
    RETURN;
  END IF;

  -- الحصول على affiliate_id و affiliate_store_id
  IF v_order_source = 'ecommerce_orders' THEN
    SELECT pf.id, ast.id
      INTO v_affiliate_id, v_affiliate_store_id
    FROM public.ecommerce_orders o
    LEFT JOIN public.affiliate_stores ast ON ast.id = o.affiliate_store_id
    LEFT JOIN public.profiles pf ON pf.id = ast.profile_id
    WHERE o.id = p_order_id;
  ELSE
    SELECT pf.id, ast.id
      INTO v_affiliate_id, v_affiliate_store_id
    FROM public.orders o
    LEFT JOIN public.affiliate_stores ast ON ast.id = o.affiliate_store_id
    LEFT JOIN public.profiles pf ON pf.id = ast.profile_id
    WHERE o.id = p_order_id;
  END IF;

  -- إذا لم يكن هناك مسوق مرتبط، لا ننشئ عمولات
  IF v_affiliate_id IS NULL OR v_affiliate_store_id IS NULL THEN
    RAISE NOTICE '[Commission] No affiliate found for order: %', p_order_id;
    RETURN;
  END IF;

  -- ✅ DEBUG: Log order info
  RAISE NOTICE '[Commission] Generating commissions for order: %, affiliate_id: %, store_id: %', 
    p_order_id, v_affiliate_id, v_affiliate_store_id;

  -- حذف العمولات القديمة لهذا الطلب (لإعادة الحساب)
  DELETE FROM public.commissions WHERE order_id = p_order_id;

  -- إنشاء عمولات جديدة بناءً على الفرق بين السعرين
  IF v_order_source = 'ecommerce_orders' THEN
    -- استخدام ecommerce_order_items
    INSERT INTO public.commissions (
      order_id,
      order_item_id,
      affiliate_id,
      affiliate_profile_id,
      commission_rate,
      amount_sar,
      status,
      created_at,
      updated_at
    )
    SELECT
      oi.order_id,
      oi.id AS order_item_id,
      v_affiliate_id AS affiliate_id,
      v_affiliate_id AS affiliate_profile_id,
      0 AS commission_rate, -- لا نستخدم نسبة، نستخدم الفرق المباشر
      -- ✅ حساب العمولة: الفرق بين سعر البيع (unit_price_sar) وسعر التاجر (price_sar) - نسبة المنصة من الإعدادات
      ROUND(
        GREATEST(
          ((oi.unit_price_sar - p.price_sar) * oi.quantity) * (1 - public.get_platform_commission_rate() / 100.0),
          0
        ),
        2
      ) AS amount_sar,
      'PENDING'::text AS status,
      NOW(),
      NOW()
    FROM public.ecommerce_order_items oi
    JOIN public.products p ON p.id = oi.product_id
    WHERE oi.order_id = p_order_id
      AND oi.unit_price_sar > p.price_sar -- فقط إذا كان سعر البيع أكبر من سعر التاجر
      AND oi.unit_price_sar IS NOT NULL
      AND p.price_sar IS NOT NULL;

  -- ✅ DEBUG: Log commission count
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '[Commission] Created % commissions for order: %', v_count, p_order_id;

    -- تحديث إجمالي العمولة في ecommerce_orders
    UPDATE public.ecommerce_orders o
    SET affiliate_commission_sar = COALESCE((
          SELECT SUM(c.amount_sar) FROM public.commissions c WHERE c.order_id = o.id
        ), 0),
        updated_at = NOW()
    WHERE o.id = p_order_id;
  ELSE
    -- استخدام order_items (الجدول القديم)
    INSERT INTO public.commissions (
      order_id,
      order_item_id,
      affiliate_id,
      affiliate_profile_id,
      commission_rate,
      amount_sar,
      status,
      created_at,
      updated_at
    )
    SELECT
      oi.order_id,
      oi.id AS order_item_id,
      v_affiliate_id AS affiliate_id,
      v_affiliate_id AS affiliate_profile_id,
      0 AS commission_rate,
      ROUND(
        GREATEST(
          ((oi.product_price_sar - p.price_sar) * oi.quantity) * (1 - public.get_platform_commission_rate() / 100.0),
          0
        ),
        2
      ) AS amount_sar,
      'PENDING'::text AS status,
      NOW(),
      NOW()
    FROM public.order_items oi
    JOIN public.products p ON p.id = oi.product_id
    WHERE oi.order_id = p_order_id
      AND oi.product_price_sar > p.price_sar
      AND oi.product_price_sar IS NOT NULL
      AND p.price_sar IS NOT NULL;

  -- ✅ DEBUG: Log commission count (for orders table)
  IF v_order_source = 'orders' THEN
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '[Commission] Created % commissions for order: %', v_count, p_order_id;
  END IF;

    -- تحديث إجمالي العمولة في orders
    UPDATE public.orders o
    SET affiliate_commission_sar = COALESCE((
          SELECT SUM(c.amount_sar) FROM public.commissions c WHERE c.order_id = o.id
        ), 0),
        updated_at = NOW()
    WHERE o.id = p_order_id;
  END IF;
END;
$$;

-- 2. Function لإعادة حساب العمولات للمبيعات السابقة
CREATE OR REPLACE FUNCTION public.recalculate_commissions_for_past_orders()
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_order RECORD;
  v_old_total numeric;
  v_new_total numeric;
  v_results jsonb[] := '{}';
  v_count integer := 0;
  v_result jsonb;
BEGIN
  -- إعادة حساب العمولات لجميع الطلبات المدفوعة من كلا الجدولين
  FOR v_order IN 
    SELECT DISTINCT o.id, o.affiliate_store_id, 'ecommerce_orders' as source
    FROM public.ecommerce_orders o
    WHERE (o.payment_status = 'COMPLETED' OR o.payment_status = 'PENDING')
      AND o.affiliate_store_id IS NOT NULL
    UNION
    -- جدول orders: نستخدم CAST إلى text لتجنب مشاكل enum
    SELECT DISTINCT o.id, o.affiliate_store_id, 'orders' as source
    FROM public.orders o
    WHERE o.affiliate_store_id IS NOT NULL
      AND o.status::text IN ('delivered', 'completed', 'confirmed', 'shipped')
    ORDER BY id DESC
  LOOP
    -- الحصول على العمولة القديمة
    SELECT COALESCE(SUM(amount_sar), 0) INTO v_old_total
    FROM public.commissions
    WHERE order_id = v_order.id;

    -- إعادة حساب العمولة
    PERFORM public._generate_commissions_for_order(v_order.id);

    -- الحصول على العمولة الجديدة
    SELECT COALESCE(SUM(amount_sar), 0) INTO v_new_total
    FROM public.commissions
    WHERE order_id = v_order.id;

    -- إضافة النتيجة للقائمة
    v_result := jsonb_build_object(
      'order_id', v_order.id,
      'old_commission', v_old_total,
      'new_commission', v_new_total,
      'difference', v_new_total - v_old_total
    );
    
    v_results := array_append(v_results, v_result);
    v_count := v_count + 1;
  END LOOP;

  -- إرجاع النتيجة النهائية
  RETURN jsonb_build_object(
    'success', true,
    'total_updated', v_count,
    'results', v_results
  );
END;
$$;

-- 3. Function لإعادة حساب عمولة طلب محدد
CREATE OR REPLACE FUNCTION public.recalculate_commission_for_order(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_old_total numeric;
  v_new_total numeric;
  v_result jsonb;
BEGIN
  -- الحصول على العمولة القديمة
  SELECT COALESCE(SUM(amount_sar), 0) INTO v_old_total
  FROM public.commissions
  WHERE order_id = p_order_id;

  -- إعادة حساب العمولة
  PERFORM public._generate_commissions_for_order(p_order_id);

  -- الحصول على العمولة الجديدة
  SELECT COALESCE(SUM(amount_sar), 0) INTO v_new_total
  FROM public.commissions
  WHERE order_id = p_order_id;

  -- إرجاع النتيجة
  v_result := jsonb_build_object(
    'order_id', p_order_id,
    'old_commission', v_old_total,
    'new_commission', v_new_total,
    'difference', v_new_total - v_old_total,
    'success', true
  );

  RETURN v_result;
END;
$$;

-- 4. إضافة تعليقات توضيحية
COMMENT ON FUNCTION public._generate_commissions_for_order(uuid) IS 
'تحسب العمولات بناءً على الفرق بين سعر التاجر وسعر المتجر مع خصم نسبة المنصة من الإعدادات (افتراضي 10%). تدعم كلا من orders و ecommerce_orders';

COMMENT ON FUNCTION public.get_platform_commission_rate() IS 
'تُرجع نسبة عمولة المنصة من الإعدادات (افتراضي 10%)';

COMMENT ON FUNCTION public.recalculate_commissions_for_past_orders() IS 
'إعادة حساب العمولات لجميع المبيعات السابقة بناءً على النظام الجديد';

COMMENT ON FUNCTION public.recalculate_commission_for_order(uuid) IS 
'إعادة حساب عمولة طلب محدد بناءً على النظام الجديد';
