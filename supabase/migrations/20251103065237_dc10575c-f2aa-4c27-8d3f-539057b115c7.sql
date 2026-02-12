-- إصلاح trigger الذي يستخدم PAID بدلاً من COMPLETED

-- حذف الـ trigger والـ function القديمين
DROP TRIGGER IF EXISTS create_merchant_pending_balance ON public.ecommerce_orders;
DROP FUNCTION IF EXISTS public.create_merchant_pending_balance_trigger();

-- إعادة إنشاء function بالقيمة الصحيحة
CREATE OR REPLACE FUNCTION public.create_merchant_pending_balance_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_item RECORD;
  v_merchant_id UUID;
  v_merchant_share NUMERIC;
  v_platform_share NUMERIC;
  v_affiliate_commission NUMERIC;
BEGIN
  -- التحقق من أن الطلب تم دفعه (استخدام COMPLETED بدلاً من PAID)
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
        p.merchant_base_price_sar
      FROM public.ecommerce_order_items oi
      JOIN public.products p ON p.id = oi.product_id
      WHERE oi.order_id = NEW.id
    LOOP
      v_merchant_id := v_item.merchant_id;
      
      -- حساب نصيب التاجر (السعر الأساسي للمنتج × الكمية)
      v_merchant_share := COALESCE(v_item.merchant_base_price_sar, 0) * v_item.quantity;
      
      -- حساب نصيب المنصة (سعر البيع - السعر الأساسي - العمولة)
      v_platform_share := (v_item.unit_price_sar * v_item.quantity) - v_merchant_share - COALESCE(v_item.commission_sar, 0);
      
      -- إضافة الرصيد المعلق للتاجر
      INSERT INTO public.merchant_pending_balance (
        merchant_id,
        order_id,
        order_item_id,
        amount_sar,
        status,
        created_at
      )
      VALUES (
        v_merchant_id,
        NEW.id,
        v_item.id,
        v_merchant_share,
        'PENDING',
        NOW()
      );
      
      -- إضافة إيرادات المنصة
      INSERT INTO public.platform_revenue (
        source,
        source_order_id,
        order_item_id,
        merchant_id,
        amount_sar,
        revenue_type,
        created_at
      )
      VALUES (
        'ECOMMERCE',
        NEW.id,
        v_item.id,
        v_merchant_id,
        v_platform_share,
        'MARKUP',
        NOW()
      );
      
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إعادة إنشاء الـ trigger
CREATE TRIGGER create_merchant_pending_balance
  AFTER INSERT OR UPDATE OF payment_status ON public.ecommerce_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.create_merchant_pending_balance_trigger();