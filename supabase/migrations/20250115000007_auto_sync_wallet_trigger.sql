-- ============================================================================
-- Trigger تلقائي لمزامنة المحفظة عند تغيير العمولات
-- ============================================================================

-- ✅ تحديث trigger الموجود ليعيد حساب الرصيد تلقائياً
-- (تم تحديثه في migration 20251027042419)

-- إضافة trigger إضافي لضمان المزامنة عند حذف العمولات
CREATE OR REPLACE FUNCTION public.update_wallet_on_commission_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_affiliate_id uuid;
  v_pending_total numeric;
  v_confirmed_total numeric;
BEGIN
  -- تحديد affiliate_id
  v_affiliate_id := COALESCE(OLD.affiliate_id, OLD.affiliate_profile_id);
  
  IF v_affiliate_id IS NULL THEN
    RETURN OLD;
  END IF;

  -- إعادة حساب الرصيد من جدول commissions
  SELECT 
    COALESCE(SUM(amount_sar), 0) FILTER (WHERE status = 'PENDING'),
    COALESCE(SUM(amount_sar), 0) FILTER (WHERE status = 'CONFIRMED')
  INTO v_pending_total, v_confirmed_total
  FROM commissions
  WHERE affiliate_id = v_affiliate_id OR affiliate_profile_id = v_affiliate_id;

  -- تحديث رصيد المحفظة
  UPDATE public.wallet_balances
  SET 
    pending_balance_sar = v_pending_total,
    available_balance_sar = v_confirmed_total,
    lifetime_earnings_sar = v_pending_total + v_confirmed_total,
    updated_at = NOW()
  WHERE affiliate_profile_id = v_affiliate_id;
  
  RETURN OLD;
END;
$$;

-- Trigger عند حذف عمولة
DROP TRIGGER IF EXISTS trg_update_wallet_on_commission_delete ON public.commissions;
CREATE TRIGGER trg_update_wallet_on_commission_delete
  AFTER DELETE ON public.commissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_wallet_on_commission_delete();

-- إضافة تعليق توضيحي
COMMENT ON FUNCTION public.update_wallet_on_commission_delete() IS 
'مزامنة تلقائية للمحفظة عند حذف عمولة - يعيد حساب الرصيد من جدول commissions';
