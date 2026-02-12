-- ============================================================================
-- تحديث trigger لمزامنة تلقائية للمحفظة
-- ============================================================================

-- Function: Update wallet on commission confirmation
-- ✅ تحديث: إعادة حساب الرصيد تلقائياً من جدول commissions لضمان المزامنة
CREATE OR REPLACE FUNCTION public.update_wallet_on_commission_confirmed()
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
  -- تحديد affiliate_id من كلا الحقلين
  v_affiliate_id := COALESCE(NEW.affiliate_id, NEW.affiliate_profile_id);
  
  IF v_affiliate_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- ✅ إعادة حساب الرصيد من جدول commissions (مزامنة تلقائية)
  -- نبحث في كلا الحقلين affiliate_id و affiliate_profile_id
  SELECT 
    COALESCE(SUM(amount_sar) FILTER (WHERE status = 'PENDING'), 0),
    COALESCE(SUM(amount_sar) FILTER (WHERE status = 'CONFIRMED'), 0)
  INTO v_pending_total, v_confirmed_total
  FROM commissions
  WHERE (affiliate_id = v_affiliate_id OR affiliate_profile_id = v_affiliate_id);

  -- تحديث رصيد المحفظة بناءً على الحساب الفعلي
  UPDATE public.wallet_balances
  SET 
    pending_balance_sar = v_pending_total,
    available_balance_sar = v_confirmed_total,
    lifetime_earnings_sar = v_pending_total + v_confirmed_total,
    updated_at = NOW()
  WHERE affiliate_profile_id = v_affiliate_id;

  -- تسجيل المعاملة فقط عند التأكيد (إذا كانت function موجودة)
  IF NEW.status = 'CONFIRMED' AND (OLD.status IS NULL OR OLD.status != 'CONFIRMED') THEN
    -- التحقق من وجود function record_wallet_transaction
    BEGIN
      PERFORM public.record_wallet_transaction(
        v_affiliate_id,
        'COMMISSION',
        NEW.amount_sar,
        NEW.id,
        'commission',
        'عمولة مؤكدة من الطلب #' || COALESCE(NEW.order_id::text, 'N/A')
      );
    EXCEPTION WHEN OTHERS THEN
      -- إذا لم تكن function موجودة، نتجاهل الخطأ
      NULL;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- إضافة تعليق توضيحي
COMMENT ON FUNCTION public.update_wallet_on_commission_confirmed() IS 
'مزامنة تلقائية للمحفظة عند إنشاء أو تحديث عمولة - يعيد حساب الرصيد من جدول commissions لضمان الدقة';
