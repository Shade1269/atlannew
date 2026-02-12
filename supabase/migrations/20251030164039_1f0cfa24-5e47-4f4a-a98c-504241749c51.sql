-- Create affiliate subscriptions table
CREATE TABLE IF NOT EXISTS public.affiliate_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'expired', 'pending')),
  subscription_amount DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  payment_transaction_id TEXT,
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.affiliate_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for affiliate subscriptions
CREATE POLICY "Affiliates can view their own subscriptions"
ON public.affiliate_subscriptions
FOR SELECT
USING (
  profile_id IN (
    SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Affiliates can create their own subscriptions"
ON public.affiliate_subscriptions
FOR INSERT
WITH CHECK (
  profile_id IN (
    SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all subscriptions"
ON public.affiliate_subscriptions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE auth_user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update all subscriptions"
ON public.affiliate_subscriptions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE auth_user_id = auth.uid() AND role = 'admin'
  )
);

-- Create index for better performance
CREATE INDEX idx_affiliate_subscriptions_profile_id ON public.affiliate_subscriptions(profile_id);
CREATE INDEX idx_affiliate_subscriptions_status ON public.affiliate_subscriptions(status);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_affiliate_subscriptions_updated_at
BEFORE UPDATE ON public.affiliate_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();