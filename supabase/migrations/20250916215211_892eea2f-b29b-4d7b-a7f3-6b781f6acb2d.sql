-- إنشاء جدول الثيمات
CREATE TABLE IF NOT EXISTS public.store_themes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description TEXT,
  description_ar TEXT,
  theme_config JSONB NOT NULL DEFAULT '{}',
  preview_image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- إنشاء جدول ربط المتجر بالثيم
CREATE TABLE IF NOT EXISTS public.affiliate_store_themes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES public.affiliate_stores(id) ON DELETE CASCADE,
  theme_id UUID REFERENCES public.store_themes(id) ON DELETE SET NULL,
  custom_config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(store_id)
);

-- إضافة عمود theme_id لجدول affiliate_stores
ALTER TABLE public.affiliate_stores 
ADD COLUMN IF NOT EXISTS current_theme_id UUID REFERENCES public.store_themes(id);

-- إدراج الثيمات الأربعة
INSERT INTO public.store_themes (name, name_ar, description, description_ar, theme_config, is_active) VALUES
(
  'Modern Minimalist',
  'العصري البسيط', 
  'Clean and modern design perfect for tech and contemporary products',
  'تصميم نظيف وعصري مثالي للتقنيات والمنتجات المعاصرة',
  '{
    "colors": {
      "primary": "hsl(220, 90%, 56%)",
      "secondary": "hsl(220, 14%, 96%)", 
      "accent": "hsl(220, 90%, 56%)",
      "background": "hsl(0, 0%, 100%)",
      "foreground": "hsl(222, 84%, 5%)",
      "muted": "hsl(220, 14%, 96%)",
      "card": "hsl(0, 0%, 100%)",
      "border": "hsl(220, 13%, 91%)"
    },
    "typography": {
      "fontFamily": "Inter, -apple-system, sans-serif",
      "headingFont": "Inter, -apple-system, sans-serif"
    },
    "layout": {
      "borderRadius": "8px",
      "spacing": "normal",
      "cardStyle": "clean"
    },
    "effects": {
      "shadows": "minimal",
      "animations": "smooth",
      "gradients": false
    }
  }',
  true
),
(
  'Luxury Premium',
  'الفاخر الراقي',
  'Elegant and luxurious design for high-end products like jewelry and watches',
  'تصميم أنيق وفاخر للمنتجات الراقية مثل المجوهرات والساعات',
  '{
    "colors": {
      "primary": "hsl(45, 100%, 51%)",
      "secondary": "hsl(240, 5%, 6%)",
      "accent": "hsl(45, 93%, 47%)",
      "background": "hsl(240, 5%, 6%)",
      "foreground": "hsl(60, 5%, 90%)",
      "muted": "hsl(240, 4%, 16%)",
      "card": "hsl(240, 4%, 16%)",
      "border": "hsl(45, 100%, 51%)"
    },
    "typography": {
      "fontFamily": "Playfair Display, serif",
      "headingFont": "Playfair Display, serif"
    },
    "layout": {
      "borderRadius": "12px",
      "spacing": "luxurious",
      "cardStyle": "elegant"
    },
    "effects": {
      "shadows": "luxury",
      "animations": "elegant", 
      "gradients": true,
      "goldAccents": true
    }
  }',
  true
),
(
  'Traditional Arabic',
  'التراثي العربي',
  'Classic Arabic design with traditional patterns for heritage products',
  'تصميم عربي كلاسيكي بأنماط تراثية للمنتجات التراثية',
  '{
    "colors": {
      "primary": "hsl(30, 67%, 44%)",
      "secondary": "hsl(45, 29%, 88%)",
      "accent": "hsl(45, 100%, 51%)",
      "background": "hsl(45, 29%, 97%)",
      "foreground": "hsl(30, 67%, 25%)",
      "muted": "hsl(45, 29%, 88%)",
      "card": "hsl(0, 0%, 100%)",
      "border": "hsl(30, 67%, 44%)"
    },
    "typography": {
      "fontFamily": "Noto Sans Arabic, Amiri, serif",
      "headingFont": "Amiri, Noto Sans Arabic, serif"
    },
    "layout": {
      "borderRadius": "16px",
      "spacing": "traditional",
      "cardStyle": "ornate"
    },
    "effects": {
      "shadows": "warm",
      "animations": "gentle",
      "gradients": true,
      "patterns": "arabic"
    }
  }',
  true
),
(
  'Colorful Vibrant',
  'الملون الحيوي',
  'Bright and energetic design perfect for youth fashion and accessories',
  'تصميم مشرق ونشط مثالي للأزياء الشبابية والإكسسوارات',
  '{
    "colors": {
      "primary": "hsl(280, 100%, 70%)",
      "secondary": "hsl(200, 100%, 80%)",
      "accent": "hsl(120, 100%, 50%)",
      "background": "hsl(0, 0%, 100%)",
      "foreground": "hsl(0, 0%, 9%)",
      "muted": "hsl(280, 40%, 98%)",
      "card": "hsl(0, 0%, 100%)",
      "border": "hsl(280, 100%, 70%)"
    },
    "typography": {
      "fontFamily": "Poppins, -apple-system, sans-serif",
      "headingFont": "Poppins, -apple-system, sans-serif"
    },
    "layout": {
      "borderRadius": "20px",
      "spacing": "dynamic",
      "cardStyle": "colorful"
    },
    "effects": {
      "shadows": "colorful",
      "animations": "bouncy",
      "gradients": true,
      "vibrantAccents": true
    }
  }',
  true
);

-- إنشاء trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION update_store_themes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language plpgsql;

CREATE TRIGGER update_store_themes_updated_at
  BEFORE UPDATE ON public.store_themes
  FOR EACH ROW
  EXECUTE FUNCTION update_store_themes_updated_at();

CREATE TRIGGER update_affiliate_store_themes_updated_at
  BEFORE UPDATE ON public.affiliate_store_themes
  FOR EACH ROW
  EXECUTE FUNCTION update_store_themes_updated_at();

-- إنشاء دالة لتطبيق ثيم على متجر
CREATE OR REPLACE FUNCTION apply_theme_to_store(
  p_store_id UUID,
  p_theme_id UUID,
  p_custom_config JSONB DEFAULT '{}'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile_id UUID;
BEGIN
  -- التأكد من أن المستخدم يملك المتجر
  SELECT profile_id INTO v_profile_id
  FROM affiliate_stores 
  WHERE id = p_store_id;
  
  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'متجر غير موجود';
  END IF;
  
  -- التأكد من أن المستخدم مصرح له
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = v_profile_id AND auth_user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'غير مصرح بتعديل هذا المتجر';
  END IF;
  
  -- تحديث المتجر بالثيم الجديد
  UPDATE affiliate_stores 
  SET current_theme_id = p_theme_id, updated_at = now()
  WHERE id = p_store_id;
  
  -- إدراج أو تحديث إعدادات الثيم للمتجر
  INSERT INTO affiliate_store_themes (store_id, theme_id, custom_config)
  VALUES (p_store_id, p_theme_id, p_custom_config)
  ON CONFLICT (store_id) 
  DO UPDATE SET 
    theme_id = p_theme_id,
    custom_config = p_custom_config,
    applied_at = now(),
    updated_at = now();
    
  RETURN TRUE;
END;
$$;

-- إنشاء دالة للحصول على ثيم المتجر
CREATE OR REPLACE FUNCTION get_store_theme_config(p_store_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_theme_config JSONB;
  v_custom_config JSONB;
BEGIN
  SELECT 
    st.theme_config,
    COALESCE(ast.custom_config, '{}')
  INTO v_theme_config, v_custom_config
  FROM affiliate_stores as_table
  LEFT JOIN store_themes st ON st.id = as_table.current_theme_id
  LEFT JOIN affiliate_store_themes ast ON ast.store_id = p_store_id
  WHERE as_table.id = p_store_id;
  
  -- دمج الإعدادات الأساسية مع التخصيصات
  RETURN COALESCE(v_theme_config, '{}') || COALESCE(v_custom_config, '{}');
END;
$$;