-- Create table for storing affiliate payment information
CREATE TABLE IF NOT EXISTS public.affiliate_payment_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Bank transfer info
  bank_name TEXT,
  bank_account_name TEXT,
  bank_account_number TEXT,
  iban TEXT,
  
  -- Digital wallet info
  stc_pay_number TEXT,
  wallet_number TEXT,
  
  -- Preferred payment method
  preferred_payment_method TEXT DEFAULT 'bank_transfer',
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(profile_id)
);

-- Enable RLS
ALTER TABLE public.affiliate_payment_info ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own payment info
CREATE POLICY "Users can view own payment info"
  ON public.affiliate_payment_info
  FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM public.profiles
      WHERE auth_user_id = auth.uid()
    )
  );

-- Policy: Users can insert their own payment info
CREATE POLICY "Users can insert own payment info"
  ON public.affiliate_payment_info
  FOR INSERT
  WITH CHECK (
    profile_id IN (
      SELECT id FROM public.profiles
      WHERE auth_user_id = auth.uid()
    )
  );

-- Policy: Users can update their own payment info
CREATE POLICY "Users can update own payment info"
  ON public.affiliate_payment_info
  FOR UPDATE
  USING (
    profile_id IN (
      SELECT id FROM public.profiles
      WHERE auth_user_id = auth.uid()
    )
  );

-- Trigger to update updated_at
CREATE TRIGGER update_affiliate_payment_info_updated_at
  BEFORE UPDATE ON public.affiliate_payment_info
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_timestamp();