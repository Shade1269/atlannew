-- ============================================
-- Update Wallet Balance to Include Referral Commissions
-- تحديث رصيد المحفظة ليشمل عمولات الإحالة المؤكدة
-- ============================================

-- Function: Update wallet on commission confirmation
-- ✅ تحديث: إضافة عائد الإحالات المؤكدة إلى الرصيد المتاح
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
  v_pending_referral_total numeric;
  v_confirmed_referral_total numeric;
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

  -- ✅ إضافة حساب عائد الإحالات المؤكدة
  SELECT 
    COALESCE(SUM(total_commission) FILTER (WHERE status = 'pending'), 0),
    COALESCE(SUM(total_commission) FILTER (WHERE status = 'confirmed'), 0)
  INTO v_pending_referral_total, v_confirmed_referral_total
  FROM referral_commissions
  WHERE referrer_profile_id = v_affiliate_id;

  -- ✅ تحديث رصيد المحفظة بناءً على الحساب الفعلي (العمولات + الإحالات)
  UPDATE public.wallet_balances
  SET 
    pending_balance_sar = v_pending_total + v_pending_referral_total,
    available_balance_sar = v_confirmed_total + v_confirmed_referral_total,
    lifetime_earnings_sar = (v_pending_total + v_confirmed_total) + (v_pending_referral_total + v_confirmed_referral_total),
    updated_at = NOW()
  WHERE affiliate_profile_id = v_affiliate_id;

  -- تسجيل المعاملة فقط عند التأكيد (إذا كانت موجودة)
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

-- Function: Update wallet when referral commission is confirmed
-- ✅ تحديث: تحديث رصيد المحفظة عند تأكيد عمولة إحالة
CREATE OR REPLACE FUNCTION public.update_wallet_on_referral_commission_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_affiliate_id uuid;
  v_pending_total numeric;
  v_confirmed_total numeric;
  v_pending_referral_total numeric;
  v_confirmed_referral_total numeric;
BEGIN
  -- الحصول على referrer_profile_id
  v_affiliate_id := NEW.referrer_profile_id;
  
  IF v_affiliate_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- ✅ إعادة حساب الرصيد من جدول commissions
  SELECT 
    COALESCE(SUM(amount_sar) FILTER (WHERE status = 'PENDING'), 0),
    COALESCE(SUM(amount_sar) FILTER (WHERE status = 'CONFIRMED'), 0)
  INTO v_pending_total, v_confirmed_total
  FROM commissions
  WHERE (affiliate_id = v_affiliate_id OR affiliate_profile_id = v_affiliate_id);

  -- ✅ إعادة حساب عائد الإحالات
  SELECT 
    COALESCE(SUM(total_commission) FILTER (WHERE status = 'pending'), 0),
    COALESCE(SUM(total_commission) FILTER (WHERE status = 'confirmed'), 0)
  INTO v_pending_referral_total, v_confirmed_referral_total
  FROM referral_commissions
  WHERE referrer_profile_id = v_affiliate_id;

  -- ✅ تحديث رصيد المحفظة بناءً على الحساب الفعلي (العمولات + الإحالات)
  UPDATE public.wallet_balances
  SET 
    pending_balance_sar = v_pending_total + v_pending_referral_total,
    available_balance_sar = v_confirmed_total + v_confirmed_referral_total,
    lifetime_earnings_sar = (v_pending_total + v_confirmed_total) + (v_pending_referral_total + v_confirmed_referral_total),
    updated_at = NOW()
  WHERE affiliate_profile_id = v_affiliate_id;

  -- تسجيل المعاملة عند التأكيد
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    BEGIN
      PERFORM public.record_wallet_transaction(
        v_affiliate_id,
        'COMMISSION',
        NEW.total_commission,
        NEW.id,
        'referral_commission',
        'عمولة إحالة مؤكدة من الطلب #' || COALESCE(NEW.order_id::text, 'N/A')
      );
    EXCEPTION WHEN OTHERS THEN
      -- إذا لم تكن function موجودة، نتجاهل الخطأ
      NULL;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger: Update wallet when referral commission is inserted (for new confirmed commissions)
DROP TRIGGER IF EXISTS trg_update_wallet_on_referral_commission_insert ON public.referral_commissions;
CREATE TRIGGER trg_update_wallet_on_referral_commission_insert
  AFTER INSERT ON public.referral_commissions
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed')
  EXECUTE FUNCTION public.update_wallet_on_referral_commission_confirmed();

-- Trigger: Update wallet when referral commission status is updated
DROP TRIGGER IF EXISTS trg_update_wallet_on_referral_commission_update ON public.referral_commissions;
CREATE TRIGGER trg_update_wallet_on_referral_commission_update
  AFTER UPDATE OF status ON public.referral_commissions
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed'))
  EXECUTE FUNCTION public.update_wallet_on_referral_commission_confirmed();

-- Function: Sync all wallet balances with commissions and referral commissions
-- ✅ تحديث: مزامنة جميع أرصدة المحافظ مع العمولات وعائد الإحالات
CREATE OR REPLACE FUNCTION public.sync_all_wallet_balances()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_affiliate_record RECORD;
  v_pending_total numeric;
  v_confirmed_total numeric;
  v_pending_referral_total numeric;
  v_confirmed_referral_total numeric;
  v_updated_count INTEGER := 0;
BEGIN
  -- المرور على جميع المسوقين
  FOR v_affiliate_record IN
    SELECT DISTINCT affiliate_profile_id
    FROM wallet_balances
    WHERE affiliate_profile_id IS NOT NULL
  LOOP
    -- حساب العمولات
    SELECT 
      COALESCE(SUM(amount_sar) FILTER (WHERE status = 'PENDING'), 0),
      COALESCE(SUM(amount_sar) FILTER (WHERE status = 'CONFIRMED'), 0)
    INTO v_pending_total, v_confirmed_total
    FROM commissions
    WHERE (affiliate_id = v_affiliate_record.affiliate_profile_id 
           OR affiliate_profile_id = v_affiliate_record.affiliate_profile_id);

    -- حساب عائد الإحالات
    SELECT 
      COALESCE(SUM(total_commission) FILTER (WHERE status = 'pending'), 0),
      COALESCE(SUM(total_commission) FILTER (WHERE status = 'confirmed'), 0)
    INTO v_pending_referral_total, v_confirmed_referral_total
    FROM referral_commissions
    WHERE referrer_profile_id = v_affiliate_record.affiliate_profile_id;

    -- تحديث رصيد المحفظة
    UPDATE public.wallet_balances
    SET 
      pending_balance_sar = v_pending_total + v_pending_referral_total,
      available_balance_sar = v_confirmed_total + v_confirmed_referral_total,
      lifetime_earnings_sar = (v_pending_total + v_confirmed_total) + (v_pending_referral_total + v_confirmed_referral_total),
      updated_at = NOW()
    WHERE affiliate_profile_id = v_affiliate_record.affiliate_profile_id;

    v_updated_count := v_updated_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'updated_wallets', v_updated_count,
    'message', 'تم مزامنة ' || v_updated_count || ' محفظة'
  );
END;
$$;

-- إضافة تعليقات توضيحية
COMMENT ON FUNCTION public.update_wallet_on_commission_confirmed() IS 
'مزامنة تلقائية للمحفظة عند إنشاء أو تحديث عمولة - يعيد حساب الرصيد من جدول commissions و referral_commissions لضمان الدقة';

COMMENT ON FUNCTION public.update_wallet_on_referral_commission_confirmed() IS 
'مزامنة تلقائية للمحفظة عند تأكيد عمولة إحالة - يضيف عائد الإحالات المؤكدة إلى الرصيد المتاح';

COMMENT ON FUNCTION public.sync_all_wallet_balances() IS 
'مزامنة جميع أرصدة المحافظ مع العمولات وعائد الإحالات - للاستخدام اليدوي';
