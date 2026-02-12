-- إنشاء جدول إعدادات المتجر المتقدمة
CREATE TABLE public.affiliate_store_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL,
  hero_image_url TEXT,
  hero_title TEXT,
  hero_subtitle TEXT,
  hero_description TEXT,
  hero_cta_text TEXT DEFAULT 'تسوق الآن',
  hero_cta_color TEXT DEFAULT 'primary',
  category_display_style TEXT DEFAULT 'grid',
  featured_categories JSONB DEFAULT '[]'::jsonb,
  store_analytics JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء باكت التخزين للصور
INSERT INTO storage.buckets (id, name, public) VALUES ('store-assets', 'store-assets', true);

-- إنشاء سياسات الأمان للجدول
ALTER TABLE public.affiliate_store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners can manage their settings"
ON public.affiliate_store_settings
FOR ALL
USING (store_id IN (
  SELECT affiliate_stores.id
  FROM affiliate_stores
  WHERE affiliate_stores.profile_id IN (
    SELECT profiles.id
    FROM profiles
    WHERE profiles.auth_user_id = auth.uid()
  )
));

-- إنشاء سياسات التخزين
CREATE POLICY "Store owners can upload assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'store-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Store assets are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'store-assets');

CREATE POLICY "Store owners can update their assets" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'store-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Store owners can delete their assets" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'store-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

-- إنشاء دالة لتحديث الوقت
CREATE OR REPLACE FUNCTION public.update_store_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء المحفز
CREATE TRIGGER update_store_settings_updated_at
BEFORE UPDATE ON public.affiliate_store_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_store_settings_updated_at();