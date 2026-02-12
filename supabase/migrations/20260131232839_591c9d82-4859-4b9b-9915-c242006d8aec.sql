-- إصلاح الدوال المتبقية بدون search_path

-- 1. تحديث دالة auto_confirm_commissions
CREATE OR REPLACE FUNCTION public.auto_confirm_commissions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF (
    (NEW.status::text ILIKE '%delivered%' OR UPPER(NEW.status::text) = 'DELIVERED')
    AND NEW.payment_status = 'COMPLETED'
  ) THEN
    UPDATE public.commissions
    SET 
      status = 'CONFIRMED',
      updated_at = NOW()
    WHERE order_id = NEW.id
      AND status = 'PENDING';

    UPDATE public.merchant_pending_balance
    SET 
      status = 'CONFIRMED',
      updated_at = NOW()
    WHERE order_id = NEW.id
      AND status = 'PENDING';
  END IF;

  RETURN NEW;
END;
$function$;

-- 2. تحديث دالة create_merchant_wallet_on_insert
CREATE OR REPLACE FUNCTION public.create_merchant_wallet_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.merchant_wallet_balances (
    merchant_id,
    pending_balance_sar,
    available_balance_sar,
    total_withdrawn_sar,
    lifetime_earnings_sar,
    minimum_withdrawal_sar
  ) VALUES (
    NEW.id,
    0,
    0,
    0,
    0,
    100
  )
  ON CONFLICT (merchant_id) DO NOTHING;
  
  RETURN NEW;
END;
$function$;