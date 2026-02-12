-- إنشاء جداول منشئ الصفحات المرئي (المرحلة 3.2)

-- جدول عناصر منشئ الصفحات
CREATE TABLE public.page_builder_elements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL,
  element_type TEXT NOT NULL,
  position JSONB NOT NULL DEFAULT '{"x": 0, "y": 0}',
  size JSONB NOT NULL DEFAULT '{"width": 200, "height": 100}',
  properties JSONB NOT NULL DEFAULT '{}',
  styles JSONB NOT NULL DEFAULT '{}',
  content TEXT,
  z_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- فهرسة للأداء
CREATE INDEX idx_page_builder_elements_page_id ON page_builder_elements(page_id);
CREATE INDEX idx_page_builder_elements_type ON page_builder_elements(element_type);

-- تفعيل RLS
ALTER TABLE public.page_builder_elements ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "Store owners can manage page elements" ON public.page_builder_elements
FOR ALL USING (
  page_id IN (
    SELECT cp.id FROM cms_custom_pages cp
    WHERE (
      cp.store_id IN (
        SELECT s.id FROM shops s
        JOIN profiles p ON p.id = s.owner_id
        WHERE p.auth_user_id = auth.uid()
      )
      OR cp.affiliate_store_id IN (
        SELECT ast.id FROM affiliate_stores ast
        JOIN profiles p ON p.id = ast.profile_id
        WHERE p.auth_user_id = auth.uid()
      )
      OR get_current_user_role() = 'admin'
    )
  )
);

-- جدول مكونات الصفحات المحفوظة
CREATE TABLE public.saved_page_components (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  component_name TEXT NOT NULL,
  component_type TEXT NOT NULL,
  component_data JSONB NOT NULL DEFAULT '{}',
  preview_image_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- فهرسة
CREATE INDEX idx_saved_components_user_id ON saved_page_components(user_id);
CREATE INDEX idx_saved_components_type ON saved_page_components(component_type);

-- تفعيل RLS
ALTER TABLE public.saved_page_components ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "Users can manage their own components" ON public.saved_page_components
FOR ALL USING (
  user_id IN (
    SELECT p.id FROM profiles p WHERE p.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Public can view public components" ON public.saved_page_components
FOR SELECT USING (is_public = true);

-- جدول جلسات منشئ الصفحات
CREATE TABLE public.page_builder_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  page_id UUID NOT NULL,
  session_data JSONB NOT NULL DEFAULT '{}',
  auto_save_data JSONB NOT NULL DEFAULT '{}',
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours')
);

-- فهرسة
CREATE INDEX idx_page_builder_sessions_user_id ON page_builder_sessions(user_id);
CREATE INDEX idx_page_builder_sessions_page_id ON page_builder_sessions(page_id);
CREATE INDEX idx_page_builder_sessions_expires ON page_builder_sessions(expires_at);

-- تفعيل RLS
ALTER TABLE public.page_builder_sessions ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "Users can manage their own sessions" ON public.page_builder_sessions
FOR ALL USING (
  user_id IN (
    SELECT p.id FROM profiles p WHERE p.auth_user_id = auth.uid()
  )
);

-- جدول مسودات محرر المحتوى
CREATE TABLE public.content_editor_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL,
  user_id UUID NOT NULL,
  draft_name TEXT,
  content_data JSONB NOT NULL DEFAULT '{}',
  is_auto_save BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- فهرسة
CREATE INDEX idx_content_drafts_page_id ON content_editor_drafts(page_id);
CREATE INDEX idx_content_drafts_user_id ON content_editor_drafts(user_id);

-- تفعيل RLS
ALTER TABLE public.content_editor_drafts ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "Users can manage their own drafts" ON public.content_editor_drafts
FOR ALL USING (
  user_id IN (
    SELECT p.id FROM profiles p WHERE p.auth_user_id = auth.uid()
  )
);

-- جدول تخصيصات الثيمات المرئية
CREATE TABLE public.visual_theme_customizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID,
  affiliate_store_id UUID,
  theme_name TEXT NOT NULL,
  customization_data JSONB NOT NULL DEFAULT '{}',
  color_palette JSONB NOT NULL DEFAULT '{}',
  typography_settings JSONB NOT NULL DEFAULT '{}',
  layout_settings JSONB NOT NULL DEFAULT '{}',
  animation_settings JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- التأكد من وجود متجر واحد على الأقل
  CONSTRAINT check_store_reference CHECK (
    (store_id IS NOT NULL AND affiliate_store_id IS NULL) OR
    (store_id IS NULL AND affiliate_store_id IS NOT NULL)
  )
);

-- فهرسة
CREATE INDEX idx_visual_themes_store_id ON visual_theme_customizations(store_id);
CREATE INDEX idx_visual_themes_affiliate_store_id ON visual_theme_customizations(affiliate_store_id);

-- تفعيل RLS
ALTER TABLE public.visual_theme_customizations ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "Store owners can manage visual themes" ON public.visual_theme_customizations
FOR ALL USING (
  (store_id IN (
    SELECT s.id FROM shops s
    JOIN profiles p ON p.id = s.owner_id
    WHERE p.auth_user_id = auth.uid()
  ))
  OR (affiliate_store_id IN (
    SELECT ast.id FROM affiliate_stores ast
    JOIN profiles p ON p.id = ast.profile_id
    WHERE p.auth_user_id = auth.uid()
  ))
  OR get_current_user_role() = 'admin'
);

-- جدول العناصر التفاعلية
CREATE TABLE public.interactive_elements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL,
  element_id UUID NOT NULL REFERENCES page_builder_elements(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL, -- 'click', 'hover', 'scroll', 'form_submit', etc.
  trigger_conditions JSONB NOT NULL DEFAULT '{}',
  actions JSONB NOT NULL DEFAULT '[]',
  analytics_data JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- فهرسة
CREATE INDEX idx_interactive_elements_page_id ON interactive_elements(page_id);
CREATE INDEX idx_interactive_elements_element_id ON interactive_elements(element_id);
CREATE INDEX idx_interactive_elements_type ON interactive_elements(interaction_type);

-- تفعيل RLS
ALTER TABLE public.interactive_elements ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "Store owners can manage interactive elements" ON public.interactive_elements
FOR ALL USING (
  page_id IN (
    SELECT cp.id FROM cms_custom_pages cp
    WHERE (
      cp.store_id IN (
        SELECT s.id FROM shops s
        JOIN profiles p ON p.id = s.owner_id
        WHERE p.auth_user_id = auth.uid()
      )
      OR cp.affiliate_store_id IN (
        SELECT ast.id FROM affiliate_stores ast
        JOIN profiles p ON p.id = ast.profile_id
        WHERE p.auth_user_id = auth.uid()
      )
      OR get_current_user_role() = 'admin'
    )
  )
);

-- إنشاء triggers للـ updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- تطبيق triggers
CREATE TRIGGER update_page_builder_elements_updated_at
  BEFORE UPDATE ON page_builder_elements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_timestamp();

CREATE TRIGGER update_saved_components_updated_at
  BEFORE UPDATE ON saved_page_components
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_timestamp();

CREATE TRIGGER update_content_drafts_updated_at
  BEFORE UPDATE ON content_editor_drafts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_timestamp();

CREATE TRIGGER update_visual_themes_updated_at
  BEFORE UPDATE ON visual_theme_customizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_timestamp();

CREATE TRIGGER update_interactive_elements_updated_at
  BEFORE UPDATE ON interactive_elements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_timestamp();

-- إدراج بيانات تجريبية لمكونات الصفحات
INSERT INTO saved_page_components (user_id, component_name, component_type, component_data, is_public) VALUES
(
  (SELECT id FROM profiles WHERE auth_user_id = auth.uid() LIMIT 1),
  'قسم البطل الافتراضي',
  'hero',
  '{
    "title": "مرحباً بك في متجرنا",
    "subtitle": "اكتشف أفضل المنتجات بأسعار لا تُقاوم",
    "buttonText": "تسوق الآن",
    "backgroundImage": "",
    "textColor": "#ffffff",
    "backgroundColor": "#0066FF"
  }',
  true
),
(
  (SELECT id FROM profiles WHERE auth_user_id = auth.uid() LIMIT 1),
  'شبكة منتجات 3x3',
  'product-grid',
  '{
    "columns": 3,
    "showPrices": true,
    "showDescriptions": true,
    "gridGap": "1rem",
    "cardStyle": "modern"
  }',
  true
),
(
  (SELECT id FROM profiles WHERE auth_user_id = auth.uid() LIMIT 1),
  'دعوة للعمل',
  'cta',
  '{
    "title": "عرض خاص محدود!",
    "description": "احصل على خصم 50% على جميع المنتجات",
    "buttonText": "احصل على العرض",
    "backgroundColor": "#FF6B35",
    "textColor": "#ffffff"
  }',
  true
);

-- وظيفة تنظيف الجلسات المنتهية الصلاحية
CREATE OR REPLACE FUNCTION cleanup_expired_page_builder_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM page_builder_sessions 
  WHERE expires_at < now();
END;
$$;