-- ============================================================================
-- مزامنة رصيد المحفظة مع جدول العمولات
-- ============================================================================

-- Function لإعادة حساب رصيد المحفظة بناءً على العمولات الفعلية
CREATE OR REPLACE FUNCTION public.sync_wallet_balances_with_commissions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_affiliate RECORD;
  v_pending_total numeric;
  v_confirmed_total numeric;
  v_updated_count integer := 0;
  v_results jsonb[] := '{}';
  v_result jsonb;
BEGIN
  -- المرور على جميع المسوقين الذين لديهم محفظة
  FOR v_affiliate IN 
    SELECT DISTINCT 
      wb.affiliate_profile_id,
      wb.id as wallet_id
    FROM wallet_balances wb
  LOOP
    -- حساب إجمالي العمولات المعلقة والمؤكدة من جدول commissions
    SELECT 
      COALESCE(SUM(amount_sar) FILTER (WHERE status = 'PENDING'), 0),
      COALESCE(SUM(amount_sar) FILTER (WHERE status = 'CONFIRMED'), 0)
    INTO v_pending_total, v_confirmed_total
    FROM commissions
    WHERE (affiliate_id = v_affiliate.affiliate_profile_id 
           OR affiliate_profile_id = v_affiliate.affiliate_profile_id);

    -- تحديث رصيد المحفظة
    UPDATE wallet_balances
    SET 
      pending_balance_sar = v_pending_total,
      available_balance_sar = v_confirmed_total,
      lifetime_earnings_sar = v_pending_total + v_confirmed_total,
      updated_at = NOW()
    WHERE affiliate_profile_id = v_affiliate.affiliate_profile_id;

    -- إضافة النتيجة
    v_result := jsonb_build_object(
      'affiliate_profile_id', v_affiliate.affiliate_profile_id,
      'old_pending', (SELECT pending_balance_sar FROM wallet_balances WHERE id = v_affiliate.wallet_id),
      'new_pending', v_pending_total,
      'old_available', (SELECT available_balance_sar FROM wallet_balances WHERE id = v_affiliate.wallet_id),
      'new_available', v_confirmed_total
    );
    
    v_results := array_append(v_results, v_result);
    v_updated_count := v_updated_count + 1;
  END LOOP;

  -- إرجاع النتيجة
  RETURN jsonb_build_object(
    'success', true,
    'total_updated', v_updated_count,
    'results', v_results
  );
END;
$$;

-- Function لإعادة حساب رصيد محفظة مسوق محدد
CREATE OR REPLACE FUNCTION public.sync_wallet_balance_for_affiliate(p_affiliate_profile_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pending_total numeric;
  v_confirmed_total numeric;
  v_old_pending numeric;
  v_old_available numeric;
BEGIN
  -- الحصول على القيم القديمة
  SELECT pending_balance_sar, available_balance_sar 
  INTO v_old_pending, v_old_available
  FROM wallet_balances
  WHERE affiliate_profile_id = p_affiliate_profile_id;

  -- حساب إجمالي العمولات المعلقة والمؤكدة
  SELECT 
    COALESCE(SUM(amount_sar) FILTER (WHERE status = 'PENDING'), 0),
    COALESCE(SUM(amount_sar) FILTER (WHERE status = 'CONFIRMED'), 0)
  INTO v_pending_total, v_confirmed_total
  FROM commissions
  WHERE (affiliate_id = p_affiliate_profile_id 
         OR affiliate_profile_id = p_affiliate_profile_id);

  -- تحديث رصيد المحفظة
  UPDATE wallet_balances
  SET 
    pending_balance_sar = v_pending_total,
    available_balance_sar = v_confirmed_total,
    lifetime_earnings_sar = v_pending_total + v_confirmed_total,
    updated_at = NOW()
  WHERE affiliate_profile_id = p_affiliate_profile_id;

  -- إرجاع النتيجة
  RETURN jsonb_build_object(
    'success', true,
    'affiliate_profile_id', p_affiliate_profile_id,
    'old_pending', v_old_pending,
    'new_pending', v_pending_total,
    'old_available', v_old_available,
    'new_available', v_confirmed_total,
    'difference_pending', v_pending_total - COALESCE(v_old_pending, 0),
    'difference_available', v_confirmed_total - COALESCE(v_old_available, 0)
  );
END;
$$;

-- إضافة تعليقات توضيحية
COMMENT ON FUNCTION public.sync_wallet_balances_with_commissions() IS 
'مزامنة رصيد جميع المحافظ مع جدول العمولات - يعيد حساب pending_balance_sar و available_balance_sar بناءً على commissions الفعلية';

COMMENT ON FUNCTION public.sync_wallet_balance_for_affiliate(uuid) IS 
'مزامنة رصيد محفظة مسوق محدد مع جدول العمولات';
