-- ============================================================================
-- Drop and recreate Withdrawal Requests Table
-- ============================================================================

DROP TABLE IF EXISTS public.withdrawal_requests CASCADE;

CREATE TABLE public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_profile_id UUID NOT NULL,
  amount_sar DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('BANK_TRANSFER', 'WALLET', 'CASH')),
  bank_details JSONB,
  notes TEXT,
  admin_notes TEXT,
  processed_by UUID,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT min_withdrawal_amount CHECK (amount_sar >= 100)
);

CREATE INDEX idx_withdrawal_requests_affiliate
  ON public.withdrawal_requests(affiliate_profile_id, created_at DESC);

CREATE INDEX idx_withdrawal_requests_status
  ON public.withdrawal_requests(status, created_at DESC);

CREATE TRIGGER _update_withdrawal_requests_updated_at
  BEFORE UPDATE ON public.withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION public._update_updated_at();

-- Enable Row Level Security
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users view their withdrawal requests"
  ON public.withdrawal_requests
  FOR SELECT
  USING (affiliate_profile_id = auth.uid());

CREATE POLICY "Users create their withdrawal requests"
  ON public.withdrawal_requests
  FOR INSERT
  WITH CHECK (affiliate_profile_id = auth.uid());