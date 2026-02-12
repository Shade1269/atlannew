-- ============================================
-- Fix Referral Commissions Constraints
-- إصلاح قيود عمولات الإحالة
-- ============================================

-- 1. إزالة الـ foreign key constraint على order_item_id لأنه يشير إلى order_items فقط
-- بينما نحتاج دعم كلا الجدولين (order_items و ecommerce_order_items)
ALTER TABLE public.referral_commissions
  DROP CONSTRAINT IF EXISTS referral_commissions_order_item_id_fkey;

-- 2. إنشاء unique index لتجنب التكرار (إذا لم يكن موجوداً)
CREATE UNIQUE INDEX IF NOT EXISTS idx_referral_commissions_unique 
  ON public.referral_commissions(order_id, order_item_id, COALESCE(order_type, 'legacy'));

-- 2. Function لمعالجة الطلبات المفقودة (للطلبات التي تم إنشاؤها قبل الـ trigger)
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
        AND (rc.order_type = 'ecommerce' OR (rc.order_type IS NULL AND NOT EXISTS (
          SELECT 1 FROM public.orders WHERE id = eoi.order_id
        )))
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
        ON CONFLICT (order_id, order_item_id, COALESCE(order_type, 'legacy')) DO NOTHING;
        
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
