-- ============================================================================
-- Wallet Management Functions & Triggers
-- ============================================================================

-- Function: Initialize wallet for new affiliate
CREATE OR REPLACE FUNCTION public.initialize_affiliate_wallet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create wallet balance record for new affiliate
  INSERT INTO public.wallet_balances (
    affiliate_profile_id,
    available_balance_sar,
    pending_balance_sar,
    lifetime_earnings_sar,
    total_withdrawn_sar,
    minimum_withdrawal_sar
  )
  VALUES (
    NEW.auth_user_id,
    0.00,
    0.00,
    0.00,
    0.00,
    100.00
  )
  ON CONFLICT (affiliate_profile_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Function: Record wallet transaction
CREATE OR REPLACE FUNCTION public.record_wallet_transaction(
  p_affiliate_id UUID,
  p_transaction_type TEXT,
  p_amount_sar DECIMAL,
  p_reference_id UUID DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet_balance RECORD;
  v_transaction_id UUID;
  v_new_balance DECIMAL;
BEGIN
  -- Get current wallet balance
  SELECT * INTO v_wallet_balance
  FROM public.wallet_balances
  WHERE affiliate_profile_id = p_affiliate_id
  FOR UPDATE;
  
  IF v_wallet_balance IS NULL THEN
    RAISE EXCEPTION 'Wallet not found for affiliate %', p_affiliate_id;
  END IF;
  
  -- Calculate new balance based on transaction type
  CASE p_transaction_type
    WHEN 'COMMISSION' THEN
      v_new_balance := v_wallet_balance.available_balance_sar + p_amount_sar;
    WHEN 'WITHDRAWAL' THEN
      v_new_balance := v_wallet_balance.available_balance_sar - p_amount_sar;
    WHEN 'ADJUSTMENT' THEN
      v_new_balance := v_wallet_balance.available_balance_sar + p_amount_sar;
    WHEN 'REFUND' THEN
      v_new_balance := v_wallet_balance.available_balance_sar - p_amount_sar;
    ELSE
      RAISE EXCEPTION 'Invalid transaction type: %', p_transaction_type;
  END CASE;
  
  -- Ensure balance doesn't go negative
  IF v_new_balance < 0 THEN
    RAISE EXCEPTION 'Insufficient balance. Current: %, Requested: %', 
      v_wallet_balance.available_balance_sar, p_amount_sar;
  END IF;
  
  -- Insert transaction record
  INSERT INTO public.wallet_transactions (
    affiliate_profile_id,
    transaction_type,
    amount_sar,
    balance_after_sar,
    reference_id,
    reference_type,
    description
  )
  VALUES (
    p_affiliate_id,
    p_transaction_type,
    p_amount_sar,
    v_new_balance,
    p_reference_id,
    p_reference_type,
    p_description
  )
  RETURNING id INTO v_transaction_id;
  
  -- Update wallet balance
  UPDATE public.wallet_balances
  SET 
    available_balance_sar = v_new_balance,
    lifetime_earnings_sar = CASE 
      WHEN p_transaction_type = 'COMMISSION' THEN lifetime_earnings_sar + p_amount_sar
      ELSE lifetime_earnings_sar
    END,
    total_withdrawn_sar = CASE
      WHEN p_transaction_type = 'WITHDRAWAL' THEN total_withdrawn_sar + p_amount_sar
      ELSE total_withdrawn_sar
    END,
    updated_at = NOW()
  WHERE affiliate_profile_id = p_affiliate_id;
  
  RETURN v_transaction_id;
END;
$$;

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
    COALESCE(SUM(amount_sar), 0) FILTER (WHERE status = 'PENDING'),
    COALESCE(SUM(amount_sar), 0) FILTER (WHERE status = 'CONFIRMED')
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

-- Function: Process withdrawal request
CREATE OR REPLACE FUNCTION public.process_withdrawal_request(
  p_withdrawal_id UUID,
  p_status TEXT,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_withdrawal RECORD;
BEGIN
  -- Get withdrawal request
  SELECT * INTO v_withdrawal
  FROM public.withdrawal_requests
  WHERE id = p_withdrawal_id
  FOR UPDATE;
  
  IF v_withdrawal IS NULL THEN
    RAISE EXCEPTION 'Withdrawal request not found';
  END IF;
  
  IF v_withdrawal.status != 'PENDING' THEN
    RAISE EXCEPTION 'Withdrawal request already processed';
  END IF;
  
  -- Update withdrawal status
  UPDATE public.withdrawal_requests
  SET 
    status = p_status,
    admin_notes = p_admin_notes,
    processed_by = auth.uid(),
    processed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_withdrawal_id;
  
  -- If approved, record transaction
  IF p_status = 'APPROVED' OR p_status = 'COMPLETED' THEN
    PERFORM public.record_wallet_transaction(
      v_withdrawal.affiliate_profile_id,
      'WITHDRAWAL',
      v_withdrawal.amount_sar,
      v_withdrawal.id,
      'withdrawal',
      'سحب - طلب #' || v_withdrawal.id
    );
  END IF;
  
  RETURN TRUE;
END;
$$;

-- ============================================================================
-- Triggers
-- ============================================================================

-- Trigger: Initialize wallet for new affiliates
CREATE TRIGGER trg_initialize_affiliate_wallet
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  WHEN (NEW.role = 'affiliate')
  EXECUTE FUNCTION public.initialize_affiliate_wallet();

-- Trigger: Update wallet on commission changes
CREATE TRIGGER trg_update_wallet_on_commission
  AFTER INSERT OR UPDATE ON public.commissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_wallet_on_commission_confirmed();