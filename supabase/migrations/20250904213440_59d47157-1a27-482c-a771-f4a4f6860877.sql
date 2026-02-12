-- Create table for WhatsApp OTP codes
CREATE TABLE public.whatsapp_otp (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  user_id UUID NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '10 minutes'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  attempts INTEGER NOT NULL DEFAULT 0
);

-- Enable Row Level Security
ALTER TABLE public.whatsapp_otp ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own OTP codes" 
ON public.whatsapp_otp 
FOR SELECT 
USING (phone IN (
  SELECT profiles.phone FROM profiles WHERE profiles.auth_user_id = auth.uid()
) OR user_id = auth.uid());

-- Allow service role to manage OTP codes
CREATE POLICY "Service role can manage OTP codes" 
ON public.whatsapp_otp 
FOR ALL 
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Create index for performance
CREATE INDEX idx_whatsapp_otp_phone ON public.whatsapp_otp(phone);
CREATE INDEX idx_whatsapp_otp_expires_at ON public.whatsapp_otp(expires_at);

-- Function to clean expired OTP codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_otp()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.whatsapp_otp 
  WHERE expires_at < now();
END;
$$;