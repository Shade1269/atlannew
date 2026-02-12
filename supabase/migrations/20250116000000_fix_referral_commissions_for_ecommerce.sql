-- ============================================
-- Fix Referral Commissions for Ecommerce Orders
-- إصلاح عمولات الإحالة للطلبات الإلكترونية
-- ============================================

-- 1. تحديث جدول referral_commissions لدعم ecommerce_orders و orders
-- إزالة الـ foreign key constraints الصارمة لأننا نريد دعم كلا الجدولين
ALTER TABLE public.referral_commissions
  DROP CONSTRAINT IF EXISTS referral_commissions_order_id_fkey,
  DROP CONSTRAINT IF EXISTS referral_commissions_order_item_id_fkey;
  
-- ملاحظة: لا يمكن إنشاء foreign key يشير إلى جدولين مختلفين
-- سنستخدم triggers للتحقق بدلاً من foreign key constraints

-- إضافة عمود لتحديد نوع الطلب (legacy أو ecommerce)
ALTER TABLE public.referral_commissions
  ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'legacy' CHECK (order_type IN ('legacy', 'ecommerce'));

-- إنشاء unique index لتجنب التكرار
CREATE UNIQUE INDEX IF NOT EXISTS idx_referral_commissions_unique 
  ON public.referral_commissions(order_id, order_item_id, COALESCE(order_type, 'legacy'));

-- 2. إنشاء function لإنشاء عمولات الإحالة من ecommerce_order_items
CREATE OR REPLACE FUNCTION create_referral_commission_from_ecommerce()
RETURNS TRIGGER AS $$
DECLARE
  v_referred_by UUID;
  v_referrer_profile_id UUID;
  v_commission_per_item DECIMAL(10,2) := 1.00; -- 1 ريال لكل قطعة
  v_total_commission DECIMAL(10,2);
  v_affiliate_store_id UUID;
  v_order_status TEXT;
  v_payment_status TEXT;
  v_commission_status TEXT := 'pending';
BEGIN
  -- الحصول على affiliate_store_id من ecommerce_orders
  SELECT 
    o.affiliate_store_id,
    o.status::TEXT,
    o.payment_status::TEXT
  INTO 
    v_affiliate_store_id,
    v_order_status,
    v_payment_status
  FROM public.ecommerce_orders o
  WHERE o.id = NEW.order_id;

  -- إذا كان هناك متجر مسوق مرتبط بالطلب، تحقق من الإحالة
  IF v_affiliate_store_id IS NOT NULL THEN
    SELECT referred_by INTO v_referred_by
    FROM public.affiliate_stores
    WHERE id = v_affiliate_store_id;
    
    -- إذا كان هناك محال، أنشئ عمولة
    IF v_referred_by IS NOT NULL THEN
      v_referrer_profile_id := v_referred_by;
      
      -- حساب إجمالي العمولة (1 ريال لكل قطعة)
      v_total_commission := NEW.quantity * v_commission_per_item;
      
      -- تحديد حالة العمولة بناءً على حالة الطلب
      -- إذا كان الطلب موصل (DELIVERED) ومدفوع (COMPLETED)، العمولة مؤكدة
      IF (
        (UPPER(v_order_status) = 'DELIVERED' OR LOWER(v_order_status) = 'delivered')
        AND (v_payment_status = 'COMPLETED')
      ) THEN
        v_commission_status := 'confirmed';
      ELSE
        v_commission_status := 'pending';
      END IF;
      
      -- إنشاء سجل عمولة الإحالة
      INSERT INTO public.referral_commissions (
        referrer_profile_id,
        referred_store_id,
        order_id,
        order_item_id,
        product_id,
        quantity,
        commission_per_item,
        total_commission,
        status,
        order_type,
        confirmed_at,
        created_at
      ) VALUES (
        v_referrer_profile_id,
        v_affiliate_store_id,
        NEW.order_id,
        NEW.id,
        NEW.product_id,
        NEW.quantity,
        v_commission_per_item,
        v_total_commission,
        v_commission_status,
        'ecommerce',
        CASE WHEN v_commission_status = 'confirmed' THEN NOW() ELSE NULL END,
        NOW()
      )
      ON CONFLICT (order_id, order_item_id, COALESCE(order_type, 'legacy')) DO NOTHING; -- تجنب التكرار
      
      -- تحديث إجمالي الأرباح للمحال (فقط إذا كانت مؤكدة)
      IF v_commission_status = 'confirmed' THEN
        UPDATE public.profiles
        SET total_earnings = COALESCE(total_earnings, 0) + v_total_commission
        WHERE id = v_referrer_profile_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. إنشاء trigger لإنشاء عمولات الإحالة عند إنشاء ecommerce_order_items
DROP TRIGGER IF EXISTS trigger_create_referral_commission_from_ecommerce ON public.ecommerce_order_items;
CREATE TRIGGER trigger_create_referral_commission_from_ecommerce
  AFTER INSERT ON public.ecommerce_order_items
  FOR EACH ROW
  EXECUTE FUNCTION create_referral_commission_from_ecommerce();

-- 4. إنشاء function لتحديث حالة عمولات الإحالة عند تحديث حالة الطلب
CREATE OR REPLACE FUNCTION update_referral_commission_status_on_order_update()
RETURNS TRIGGER AS $$
DECLARE
  v_is_delivered BOOLEAN := FALSE;
  v_is_paid BOOLEAN := FALSE;
BEGIN
  -- التحقق من أن الطلب موصل
  v_is_delivered := (
    UPPER(NEW.status::text) = 'DELIVERED' 
    OR LOWER(NEW.status::text) = 'delivered'
  );

  -- التحقق من أن الطلب مدفوع
  v_is_paid := (NEW.payment_status = 'COMPLETED');

  -- إذا كان الطلب موصل ومدفوع، تأكيد عمولات الإحالة
  IF v_is_delivered AND v_is_paid THEN
    UPDATE public.referral_commissions
    SET 
      status = 'confirmed',
      confirmed_at = COALESCE(confirmed_at, NOW()),
      updated_at = NOW()
    WHERE order_id = NEW.id
      AND status = 'pending'
      AND order_type = 'ecommerce';

    -- تحديث إجمالي الأرباح للمحالين
    UPDATE public.profiles p
    SET total_earnings = COALESCE(p.total_earnings, 0) + COALESCE(rc.total_commission, 0)
    FROM public.referral_commissions rc
    WHERE rc.referrer_profile_id = p.id
      AND rc.order_id = NEW.id
      AND rc.status = 'confirmed'
      AND rc.order_type = 'ecommerce'
      AND rc.confirmed_at = (
        SELECT MAX(confirmed_at) 
        FROM public.referral_commissions 
        WHERE order_id = NEW.id 
        AND referrer_profile_id = p.id
      );

    RAISE NOTICE '[Referral Commission] Confirmed referral commissions for ecommerce order: %', NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. إنشاء trigger لتحديث حالة عمولات الإحالة عند تحديث ecommerce_orders
DROP TRIGGER IF EXISTS trg_update_referral_commission_status ON public.ecommerce_orders;
CREATE TRIGGER trg_update_referral_commission_status
  AFTER UPDATE OF status, payment_status ON public.ecommerce_orders
  FOR EACH ROW
  WHEN (
    (OLD.status IS DISTINCT FROM NEW.status OR OLD.payment_status IS DISTINCT FROM NEW.payment_status)
    AND (
      (UPPER(NEW.status::text) = 'DELIVERED' OR LOWER(NEW.status::text) = 'delivered')
      AND NEW.payment_status = 'COMPLETED'
    )
  )
  EXECUTE FUNCTION update_referral_commission_status_on_order_update();

-- 6. Function لمعالجة الطلبات الموجودة (للمعالجة اليدوية)
CREATE OR REPLACE FUNCTION process_existing_referral_commissions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_processed_count INTEGER := 0;
  v_order_record RECORD;
BEGIN
  -- معالجة جميع الطلبات الإلكترونية الموصلة والمدفوعة
  FOR v_order_record IN
    SELECT 
      eo.id,
      eo.affiliate_store_id,
      eo.status,
      eo.payment_status
    FROM public.ecommerce_orders eo
    WHERE eo.affiliate_store_id IS NOT NULL
      AND (UPPER(eo.status::text) = 'DELIVERED' OR LOWER(eo.status::text) = 'delivered')
      AND eo.payment_status = 'COMPLETED'
      AND NOT EXISTS (
        SELECT 1 
        FROM public.referral_commissions rc 
        WHERE rc.order_id = eo.id 
        AND rc.order_type = 'ecommerce'
      )
  LOOP
    -- إنشاء عمولات الإحالة للعناصر الموجودة
    INSERT INTO public.referral_commissions (
      referrer_profile_id,
      referred_store_id,
      order_id,
      order_item_id,
      product_id,
      quantity,
      commission_per_item,
      total_commission,
      status,
      order_type,
      confirmed_at,
      created_at
    )
    SELECT
      ast.referred_by,
      ast.id,
      eoi.order_id,
      eoi.id,
      eoi.product_id,
      eoi.quantity,
      1.00, -- 1 ريال لكل قطعة
      eoi.quantity * 1.00,
      'confirmed',
      'ecommerce',
      NOW(),
      NOW()
    FROM public.ecommerce_order_items eoi
    JOIN public.affiliate_stores ast ON ast.id = v_order_record.affiliate_store_id
    WHERE eoi.order_id = v_order_record.id
      AND ast.referred_by IS NOT NULL
    ON CONFLICT DO NOTHING;

    v_processed_count := v_processed_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'processed_orders', v_processed_count,
    'message', 'تم معالجة ' || v_processed_count || ' طلب'
  );
END;
$$;

-- 7. إضافة تعليقات توضيحية
COMMENT ON FUNCTION create_referral_commission_from_ecommerce() IS 
'إنشاء عمولات الإحالة تلقائياً عند إنشاء عناصر طلب إلكتروني';

COMMENT ON FUNCTION update_referral_commission_status_on_order_update() IS 
'تحديث حالة عمولات الإحالة تلقائياً عند توصيل ودفع الطلب الإلكتروني';

COMMENT ON FUNCTION process_existing_referral_commissions() IS 
'معالجة الطلبات الموجودة لإنشاء عمولات الإحالة المفقودة';

-- 8. Function لمعالجة الطلبات المفقودة (للطلبات التي تم إنشاؤها قبل الـ trigger)
CREATE OR REPLACE FUNCTION process_missing_referral_commissions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_processed_count INTEGER := 0;
  v_order_item RECORD;
BEGIN
  -- معالجة جميع عناصر الطلبات الإلكترونية التي لم يتم إنشاء عمولات إحالة لها
  FOR v_order_item IN
    SELECT 
      eoi.id,
      eoi.order_id,
      eoi.product_id,
      eoi.quantity,
      eo.affiliate_store_id,
      eo.status,
      eo.payment_status
    FROM public.ecommerce_order_items eoi
    JOIN public.ecommerce_orders eo ON eo.id = eoi.order_id
    WHERE eo.affiliate_store_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 
        FROM public.referral_commissions rc 
        WHERE rc.order_id = eoi.order_id 
        AND rc.order_item_id = eoi.id
        AND rc.order_type = 'ecommerce'
      )
  LOOP
    -- التحقق من وجود محال
    DECLARE
      v_referred_by UUID;
      v_commission_status TEXT;
    BEGIN
      SELECT referred_by INTO v_referred_by
      FROM public.affiliate_stores
      WHERE id = v_order_item.affiliate_store_id;
      
      IF v_referred_by IS NOT NULL THEN
        -- تحديد حالة العمولة
        IF (
          (UPPER(v_order_item.status::text) = 'DELIVERED' OR LOWER(v_order_item.status::text) = 'delivered')
          AND v_order_item.payment_status = 'COMPLETED'
        ) THEN
          v_commission_status := 'confirmed';
        ELSE
          v_commission_status := 'pending';
        END IF;
        
        -- إنشاء عمولة الإحالة
        INSERT INTO public.referral_commissions (
          referrer_profile_id,
          referred_store_id,
          order_id,
          order_item_id,
          product_id,
          quantity,
          commission_per_item,
          total_commission,
          status,
          order_type,
          confirmed_at,
          created_at
        ) VALUES (
          v_referred_by,
          v_order_item.affiliate_store_id,
          v_order_item.order_id,
          v_order_item.id,
          v_order_item.product_id,
          v_order_item.quantity,
          1.00,
          v_order_item.quantity * 1.00,
          v_commission_status,
          'ecommerce',
          CASE WHEN v_commission_status = 'confirmed' THEN NOW() ELSE NULL END,
          NOW()
        )
        ON CONFLICT DO NOTHING;
        
        v_processed_count := v_processed_count + 1;
      END IF;
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'processed_items', v_processed_count,
    'message', 'تم معالجة ' || v_processed_count || ' عنصر طلب'
  );
END;
$$;

COMMENT ON FUNCTION process_missing_referral_commissions() IS 
'معالجة عناصر الطلبات المفقودة لإنشاء عمولات الإحالة - للاستخدام اليدوي';
