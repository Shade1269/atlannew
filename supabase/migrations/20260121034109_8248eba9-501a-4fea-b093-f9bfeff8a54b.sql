-- إنشاء محافظ للتجار الذين ليس لديهم محفظة
INSERT INTO merchant_wallet_balances (merchant_id, pending_balance_sar, available_balance_sar, total_withdrawn_sar, lifetime_earnings_sar, minimum_withdrawal_sar)
SELECT 
  m.id,
  0,
  0,
  0,
  0,
  100
FROM merchants m
LEFT JOIN merchant_wallet_balances mwb ON mwb.merchant_id = m.id
WHERE mwb.id IS NULL
ON CONFLICT (merchant_id) DO NOTHING;

-- إنشاء function لإنشاء محفظة التاجر تلقائياً
CREATE OR REPLACE FUNCTION public.create_merchant_wallet_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- إنشاء trigger لإنشاء محفظة عند إضافة تاجر جديد
DROP TRIGGER IF EXISTS trg_create_merchant_wallet ON public.merchants;
CREATE TRIGGER trg_create_merchant_wallet
AFTER INSERT ON public.merchants
FOR EACH ROW
EXECUTE FUNCTION public.create_merchant_wallet_on_insert();