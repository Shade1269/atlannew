-- إضافة حقول التحكم بالإعلانات والعروض والعد التنازلي
ALTER TABLE public.affiliate_store_settings
ADD COLUMN IF NOT EXISTS announcements jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS countdown_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS countdown_end_date timestamptz,
ADD COLUMN IF NOT EXISTS countdown_title text DEFAULT 'عرض خاص ينتهي قريباً',
ADD COLUMN IF NOT EXISTS countdown_subtitle text,
ADD COLUMN IF NOT EXISTS promo_banner_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS promo_banner_title text,
ADD COLUMN IF NOT EXISTS promo_banner_subtitle text,
ADD COLUMN IF NOT EXISTS promo_banner_discount text,
ADD COLUMN IF NOT EXISTS promo_banner_image_url text,
ADD COLUMN IF NOT EXISTS promo_banner_link text,
ADD COLUMN IF NOT EXISTS default_hero_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS whatsapp_number text,
ADD COLUMN IF NOT EXISTS store_email text,
ADD COLUMN IF NOT EXISTS ai_recommendations_enabled boolean DEFAULT true;

-- إضافة تعليقات توضيحية
COMMENT ON COLUMN public.affiliate_store_settings.announcements IS 'قائمة الإعلانات المتحركة [{text, icon, color}]';
COMMENT ON COLUMN public.affiliate_store_settings.countdown_enabled IS 'تفعيل العد التنازلي';
COMMENT ON COLUMN public.affiliate_store_settings.countdown_end_date IS 'تاريخ انتهاء العد التنازلي';
COMMENT ON COLUMN public.affiliate_store_settings.promo_banner_enabled IS 'تفعيل بانر العروض';
COMMENT ON COLUMN public.affiliate_store_settings.social_links IS 'روابط التواصل الاجتماعي {twitter, instagram, tiktok}';
COMMENT ON COLUMN public.affiliate_store_settings.ai_recommendations_enabled IS 'تفعيل التوصيات الذكية';