-- إنشاء جدول قوالب الثيمات المحسن
CREATE TABLE IF NOT EXISTS public.theme_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description TEXT,
  description_ar TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  difficulty_level TEXT NOT NULL DEFAULT 'beginner',
  theme_config JSONB NOT NULL,
  preview_image_url TEXT,
  thumbnail_url TEXT,
  color_palette JSONB NOT NULL DEFAULT '{}',
  is_premium BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  popularity_score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول للثيمات المخصصة للمستخدمين
CREATE TABLE IF NOT EXISTS public.user_custom_themes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  store_id UUID,
  theme_name TEXT NOT NULL,
  theme_config JSONB NOT NULL,
  color_palette JSONB NOT NULL DEFAULT '{}',
  is_public BOOLEAN NOT NULL DEFAULT false,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول تتبع استخدام الثيمات
CREATE TABLE IF NOT EXISTS public.theme_usage_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  theme_id UUID,
  template_id UUID,
  store_id UUID NOT NULL,
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL, -- 'applied', 'previewed', 'customized', 'exported'
  customizations JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.theme_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_custom_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theme_usage_analytics ENABLE ROW LEVEL SECURITY;

-- Policy للثيمات المفتوحة للجميع
CREATE POLICY "Theme templates are viewable by everyone" 
ON public.theme_templates FOR SELECT 
USING (is_active = true);

-- Policy للثيمات المخصصة
CREATE POLICY "Users can view their own custom themes" 
ON public.user_custom_themes FOR SELECT 
USING (auth.uid()::text = user_id::text OR is_public = true);

CREATE POLICY "Users can create their own custom themes" 
ON public.user_custom_themes FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own custom themes" 
ON public.user_custom_themes FOR UPDATE 
USING (auth.uid()::text = user_id::text);

-- Policy للتحليلات
CREATE POLICY "Users can view their theme analytics" 
ON public.theme_usage_analytics FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their theme analytics" 
ON public.theme_usage_analytics FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

-- Triggers لتحديث updated_at
CREATE OR REPLACE FUNCTION public.update_theme_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_theme_templates_updated_at
BEFORE UPDATE ON public.theme_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_theme_timestamp();

CREATE TRIGGER update_user_custom_themes_updated_at
BEFORE UPDATE ON public.user_custom_themes
FOR EACH ROW
EXECUTE FUNCTION public.update_theme_timestamp();

-- إدراج بعض القوالب الأساسية
INSERT INTO public.theme_templates (name, name_ar, description_ar, category, theme_config, color_palette) VALUES
('Modern Minimalist', 'عصري بسيط', 'تصميم عصري بسيط وأنيق', 'modern', 
 '{"colors":{"primary":"hsl(210, 100%, 50%)","secondary":"hsl(210, 10%, 95%)","accent":"hsl(210, 100%, 45%)","background":"hsl(0, 0%, 100%)","foreground":"hsl(210, 10%, 10%)","muted":"hsl(210, 10%, 95%)","card":"hsl(0, 0%, 100%)","border":"hsl(210, 15%, 90%)"},"typography":{"fontFamily":"Inter","headingFont":"Inter"},"layout":{"borderRadius":"8px","spacing":"medium","cardStyle":"elevated"},"effects":{"shadows":"subtle","animations":"smooth","gradients":true}}',
 '{"primary":"#0066FF","secondary":"#F0F4F8","accent":"#0052CC","neutral":"#FFFFFF","dark":"#1A1D21"}'),

('Luxury Gold', 'ذهبي فاخر', 'تصميم ذهبي فاخر للمتاجر الراقية', 'luxury',
 '{"colors":{"primary":"hsl(45, 100%, 50%)","secondary":"hsl(45, 15%, 95%)","accent":"hsl(45, 90%, 45%)","background":"hsl(0, 0%, 98%)","foreground":"hsl(45, 10%, 15%)","muted":"hsl(45, 15%, 92%)","card":"hsl(0, 0%, 100%)","border":"hsl(45, 20%, 85%)"},"typography":{"fontFamily":"Playfair Display","headingFont":"Playfair Display"},"layout":{"borderRadius":"12px","spacing":"large","cardStyle":"luxury"},"effects":{"shadows":"elegant","animations":"luxurious","gradients":true}}',
 '{"primary":"#FFD700","secondary":"#FFF8E1","accent":"#B8860B","neutral":"#FAFAFA","dark":"#2E2E2E"}'),

('Nature Green', 'أخضر طبيعي', 'تصميم طبيعي بألوان خضراء هادئة', 'nature',
 '{"colors":{"primary":"hsl(120, 60%, 40%)","secondary":"hsl(120, 20%, 95%)","accent":"hsl(120, 70%, 35%)","background":"hsl(120, 15%, 98%)","foreground":"hsl(120, 15%, 20%)","muted":"hsl(120, 20%, 92%)","card":"hsl(0, 0%, 100%)","border":"hsl(120, 25%, 85%)"},"typography":{"fontFamily":"Roboto","headingFont":"Roboto"},"layout":{"borderRadius":"16px","spacing":"comfortable","cardStyle":"organic"},"effects":{"shadows":"natural","animations":"gentle","gradients":true}}',
 '{"primary":"#4CAF50","secondary":"#E8F5E8","accent":"#388E3C","neutral":"#F9FFF9","dark":"#1B5E20"}');