-- ============================================================================
-- Create Helper Function for Updated_At Trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION public._update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- Financial Tables: Wallet Transactions, Wallet Balances, Order Returns
-- ============================================================================

-- 1. Wallet Transactions Table
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_profile_id UUID NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('COMMISSION', 'WITHDRAWAL', 'ADJUSTMENT', 'REFUND')),
  amount_sar DECIMAL(10,2) NOT NULL,
  balance_after_sar DECIMAL(10,2) NOT NULL,
  reference_id UUID,
  reference_type TEXT CHECK (reference_type IN ('commission', 'withdrawal', 'order', 'manual')),
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_profile 
  ON public.wallet_transactions(affiliate_profile_id, created_at DESC);

-- 2. Wallet Balances Table
CREATE TABLE IF NOT EXISTS public.wallet_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_profile_id UUID NOT NULL UNIQUE,
  available_balance_sar DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  pending_balance_sar DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  lifetime_earnings_sar DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_withdrawn_sar DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  minimum_withdrawal_sar DECIMAL(10,2) NOT NULL DEFAULT 100.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER _update_wallet_balances_updated_at
  BEFORE UPDATE ON public.wallet_balances
  FOR EACH ROW EXECUTE FUNCTION public._update_updated_at();

-- 3. Order Returns Table
CREATE TABLE IF NOT EXISTS public.order_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  customer_id UUID,
  affiliate_id UUID,
  source_table TEXT NOT NULL CHECK (source_table IN ('ecommerce_orders', 'affiliate_orders', 'order_hub')),
  return_reason TEXT NOT NULL,
  return_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (return_status IN ('PENDING', 'APPROVED', 'REJECTED', 'REFUNDED')),
  returned_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  refund_amount_sar DECIMAL(10,2),
  notes TEXT,
  processed_by UUID,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_returns_order 
  ON public.order_returns(order_id);
CREATE INDEX IF NOT EXISTS idx_order_returns_customer
  ON public.order_returns(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_returns_affiliate
  ON public.order_returns(affiliate_id);

CREATE TRIGGER _update_order_returns_updated_at
  BEFORE UPDATE ON public.order_returns
  FOR EACH ROW EXECUTE FUNCTION public._update_updated_at();

-- ============================================================================
-- Enable Row Level Security
-- ============================================================================

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_returns ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Wallet Transactions Policies
CREATE POLICY "Users view their wallet transactions"
  ON public.wallet_transactions
  FOR SELECT
  USING (affiliate_profile_id = auth.uid());

-- Wallet Balances Policies
CREATE POLICY "Users view their wallet balance"
  ON public.wallet_balances
  FOR SELECT
  USING (affiliate_profile_id = auth.uid());

-- Order Returns Policies (simplified - users see returns for orders they're involved in)
CREATE POLICY "Users view their returns"
  ON public.order_returns
  FOR SELECT
  USING (
    customer_id = auth.uid() OR 
    affiliate_id = auth.uid()
  );