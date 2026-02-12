
-- Fix: confirm_merchant_balance should convert profile_id to actual merchant_id
CREATE OR REPLACE FUNCTION public.confirm_merchant_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_revenue RECORD;
  v_actual_merchant_id UUID;
BEGIN
  -- التحقق من أن الطلب تم توصيله
  IF NEW.status = 'DELIVERED' AND OLD.status IS DISTINCT FROM 'DELIVERED' THEN
    
    -- المرور على جميع إيرادات هذا الطلب
    FOR v_revenue IN 
      SELECT pr.*, m.id as actual_merchant_id
      FROM public.platform_revenue pr
      LEFT JOIN public.merchants m ON m.profile_id = pr.merchant_id
      WHERE pr.order_id = NEW.source_order_id AND pr.status = 'PENDING'
    LOOP
      -- استخدام merchant_id الفعلي إذا وجد، وإلا استخدام القيمة الأصلية
      v_actual_merchant_id := COALESCE(v_revenue.actual_merchant_id, v_revenue.merchant_id);
      
      -- نقل من pending إلى available
      UPDATE public.merchant_wallet_balances
      SET 
        pending_balance_sar = pending_balance_sar - v_revenue.merchant_base_price_sar,
        updated_at = NOW()
      WHERE merchant_id = v_actual_merchant_id;
      
      -- تسجيل المعاملة فقط إذا وجدت المحفظة
      IF EXISTS (SELECT 1 FROM public.merchant_wallet_balances WHERE merchant_id = v_actual_merchant_id) THEN
        PERFORM public.record_merchant_transaction(
          v_actual_merchant_id,
          'COMMISSION_CONFIRMED',
          v_revenue.merchant_base_price_sar,
          v_revenue.id,
          'platform_revenue',
          'مبيعات مؤكدة من الطلب #' || NEW.order_number
        );
      END IF;
      
      -- تحديث حالة الإيراد
      UPDATE public.platform_revenue
      SET 
        status = 'CONFIRMED',
        confirmed_at = NOW()
      WHERE id = v_revenue.id;
      
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Make sure the trigger is on order_hub
DROP TRIGGER IF EXISTS trg_confirm_merchant_balance ON public.order_hub;
CREATE TRIGGER trg_confirm_merchant_balance
AFTER UPDATE ON public.order_hub
FOR EACH ROW
EXECUTE FUNCTION public.confirm_merchant_balance();
