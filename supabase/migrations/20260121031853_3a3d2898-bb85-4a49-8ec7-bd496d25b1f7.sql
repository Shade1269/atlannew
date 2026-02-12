
-- Fix create_merchant_pending_balance to use merchant's profile_id instead of merchant_id
DROP TRIGGER IF EXISTS trg_create_merchant_pending ON public.ecommerce_orders;

CREATE OR REPLACE FUNCTION public.create_merchant_pending_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_item RECORD;
  v_merchant_profile_id UUID;
  v_affiliate_id UUID;
  v_affiliate_store_id UUID;
  v_merchant_base NUMERIC;
  v_platform_share NUMERIC;
  v_affiliate_commission NUMERIC;
BEGIN
  -- التحقق من أن الطلب تم دفعه
  IF NEW.payment_status = 'PAID' AND (OLD.payment_status IS DISTINCT FROM 'PAID' OR OLD IS NULL) THEN
    
    -- الحصول على affiliate_store_id من الطلب
    v_affiliate_store_id := NEW.affiliate_store_id;
    
    -- الحصول على profile_id من affiliate_stores للمسوق
    IF v_affiliate_store_id IS NOT NULL THEN
      SELECT profile_id INTO v_affiliate_id
      FROM public.affiliate_stores
      WHERE id = v_affiliate_store_id;
    END IF;
    
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
        m.profile_id as merchant_profile_id
      FROM public.ecommerce_order_items oi
      JOIN public.products p ON p.id = oi.product_id
      LEFT JOIN public.merchants m ON m.id = p.merchant_id
      WHERE oi.order_id = NEW.id
    LOOP
      -- استخدام profile_id للتاجر (المطلوب في platform_revenue)
      v_merchant_profile_id := v_item.merchant_profile_id;
      
      -- تخطي إذا لم يوجد تاجر
      IF v_merchant_profile_id IS NULL THEN
        CONTINUE;
      END IF;
      
      -- حساب المبالغ
      v_merchant_base := COALESCE(v_item.merchant_base_price_sar, v_item.unit_price_sar * 0.75) * v_item.quantity;
      v_platform_share := v_merchant_base * 0.25;
      v_affiliate_commission := COALESCE(v_item.commission_sar, 0);
      
      -- تحديث رصيد التاجر المعلق
      UPDATE public.merchant_wallet_balances
      SET 
        pending_balance_sar = pending_balance_sar + v_merchant_base,
        updated_at = NOW()
      WHERE merchant_id = v_item.merchant_id;
      
      -- تسجيل أرباح المنصة مع profile_id للتاجر
      INSERT INTO public.platform_revenue (
        order_id,
        order_item_id,
        merchant_id,
        affiliate_id,
        merchant_base_price_sar,
        platform_share_sar,
        affiliate_commission_sar,
        final_sale_price_sar,
        status
      )
      VALUES (
        NEW.id,
        v_item.id,
        v_merchant_profile_id,  -- استخدام profile_id بدلاً من merchant_id
        v_affiliate_id,
        v_merchant_base,
        v_platform_share,
        v_affiliate_commission,
        v_item.unit_price_sar * v_item.quantity,
        'PENDING'
      )
      ON CONFLICT DO NOTHING;
      
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_create_merchant_pending
  AFTER INSERT OR UPDATE OF payment_status ON public.ecommerce_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.create_merchant_pending_balance();
