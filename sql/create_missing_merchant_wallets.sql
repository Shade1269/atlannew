-- ============================================
-- Script to create wallets for existing merchants
-- ============================================

-- Insert wallet balances for all merchants who don't have one yet
INSERT INTO public.merchant_wallet_balances (
  merchant_id,
  available_balance_sar,
  pending_balance_sar,
  lifetime_earnings_sar,
  total_withdrawn_sar,
  minimum_withdrawal_sar
)
SELECT 
  p.id as merchant_id,
  0.00 as available_balance_sar,
  0.00 as pending_balance_sar,
  0.00 as lifetime_earnings_sar,
  0.00 as total_withdrawn_sar,
  100.00 as minimum_withdrawal_sar
FROM public.profiles p
WHERE p.role = 'merchant'
  AND NOT EXISTS (
    SELECT 1 
    FROM public.merchant_wallet_balances mwb 
    WHERE mwb.merchant_id = p.id
  )
ON CONFLICT (merchant_id) DO NOTHING;

-- Show results
SELECT 
  COUNT(*) as total_merchant_wallets_created
FROM public.merchant_wallet_balances;
