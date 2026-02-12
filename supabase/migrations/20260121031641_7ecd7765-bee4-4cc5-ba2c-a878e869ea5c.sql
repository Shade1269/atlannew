-- 1) Fix trigger_generate_commissions_on_payment to NOT pass parameter
DROP TRIGGER IF EXISTS trg_generate_commissions_on_payment ON public.ecommerce_orders;

CREATE OR REPLACE FUNCTION public.trigger_generate_commissions_on_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- فقط عند تغيير الحالة إلى PAID
  IF NEW.payment_status = 'PAID' AND (OLD.payment_status IS NULL OR OLD.payment_status::text != 'PAID') THEN
    -- استدعاء الدالة المصححة لإنشاء العمولات
    PERFORM public._generate_commissions_for_order(NEW.id);
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_generate_commissions_on_payment
  AFTER UPDATE OF payment_status ON public.ecommerce_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_generate_commissions_on_payment();

-- 2) Fix create_merchant_pending_balance - use affiliate_store_id instead of affiliate_id
DROP TRIGGER IF EXISTS trg_create_merchant_pending ON public.ecommerce_orders;

CREATE OR REPLACE FUNCTION public.create_merchant_pending_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_item RECORD;
  v_merchant_id UUID;
  v_affiliate_id UUID;
  v_affiliate_store_id UUID;
  v_merchant_base NUMERIC;
  v_platform_share NUMERIC;
  v_affiliate_commission NUMERIC;
BEGIN
  -- التحقق من أن الطلب تم دفعه
  IF NEW.payment_status = 'PAID' AND (OLD.payment_status IS DISTINCT FROM 'PAID' OR OLD IS NULL) THEN
    
    -- الحصول على affiliate_store_id و affiliate_id من الطلب مباشرة
    v_affiliate_store_id := NEW.affiliate_store_id;
    
    -- الحصول على profile_id من affiliate_stores
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
        p.merchant_base_price_sar
      FROM public.ecommerce_order_items oi
      JOIN public.products p ON p.id = oi.product_id
      WHERE oi.order_id = NEW.id
    LOOP
      v_merchant_id := v_item.merchant_id;
      
      -- حساب المبالغ
      v_merchant_base := COALESCE(v_item.merchant_base_price_sar, v_item.unit_price_sar * 0.75) * v_item.quantity;
      v_platform_share := v_merchant_base * 0.25;
      v_affiliate_commission := COALESCE(v_item.commission_sar, 0);
      
      -- تحديث رصيد التاجر المعلق (إذا كان موجوداً)
      UPDATE public.merchant_wallet_balances
      SET 
        pending_balance_sar = pending_balance_sar + v_merchant_base,
        updated_at = NOW()
      WHERE merchant_id = v_merchant_id;
      
      -- تسجيل أرباح المنصة
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
        v_merchant_id,
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