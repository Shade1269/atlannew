-- Create affiliate agreements table to store electronic signatures
CREATE TABLE public.affiliate_agreements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agreement_version VARCHAR(20) NOT NULL DEFAULT '1.0',
  full_name TEXT NOT NULL,
  phone_number TEXT,
  email TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  agreed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  agreement_content_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.affiliate_agreements ENABLE ROW LEVEL SECURITY;

-- Users can view their own agreements
CREATE POLICY "Users can view own agreements"
ON public.affiliate_agreements
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own agreements
CREATE POLICY "Users can create own agreements"
ON public.affiliate_agreements
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_affiliate_agreements_user_id ON public.affiliate_agreements(user_id);
CREATE INDEX idx_affiliate_agreements_agreed_at ON public.affiliate_agreements(agreed_at DESC);

-- Add has_signed_agreement column to profiles if not exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_signed_agreement BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS agreement_signed_at TIMESTAMP WITH TIME ZONE;