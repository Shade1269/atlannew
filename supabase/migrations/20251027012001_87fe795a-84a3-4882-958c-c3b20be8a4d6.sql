-- إضافة حقل external_id لحفظ authentication_uuid من Ding
ALTER TABLE public.whatsapp_otp
ADD COLUMN IF NOT EXISTS external_id TEXT;

-- إضافة index لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_whatsapp_otp_external_id 
ON public.whatsapp_otp(external_id) 
WHERE external_id IS NOT NULL;

COMMENT ON COLUMN public.whatsapp_otp.external_id IS 'Authentication UUID من Ding API';