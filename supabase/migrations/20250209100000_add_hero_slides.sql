-- إضافة عمود hero_slides لدعم عدة بانرات هيرو مع السلايدر
-- hero_slides: مصفوفة [{ id, image_url, title, subtitle, cta_text, cta_link? }]
ALTER TABLE public.affiliate_store_settings
  ADD COLUMN IF NOT EXISTS hero_slides jsonb DEFAULT NULL;

COMMENT ON COLUMN public.affiliate_store_settings.hero_slides IS 'بانرات الهيرو المتعددة للسلايدر: مصفوفة { id, image_url, title, subtitle, cta_text, cta_link? }';
