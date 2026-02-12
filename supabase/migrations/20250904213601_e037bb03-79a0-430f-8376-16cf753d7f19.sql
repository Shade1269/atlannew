-- Reduce OTP expiry time to 5 minutes to improve security
ALTER TABLE public.whatsapp_otp 
ALTER COLUMN expires_at SET DEFAULT (now() + interval '5 minutes');