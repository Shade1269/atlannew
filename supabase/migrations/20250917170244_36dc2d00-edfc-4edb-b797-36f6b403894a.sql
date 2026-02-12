-- إنشاء جداول نظام إدارة المحتوى للمتاجر التابعة

-- جدول أنواع المحتوى
CREATE TYPE content_type AS ENUM ('page', 'section', 'widget', 'article', 'faq', 'testimonial');
CREATE TYPE page_status AS ENUM ('draft', 'published', 'scheduled', 'archived');
CREATE TYPE content_block_type AS ENUM ('text', 'image', 'video', 'gallery', 'button', 'form', 'products', 'custom_html');

-- جدول صفحات المتجر
CREATE TABLE store_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content JSONB DEFAULT '{}',
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT[],
  status page_status DEFAULT 'draft',
  is_home_page BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  template_id UUID,
  published_at TIMESTAMP WITH TIME ZONE,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(store_id, slug),
  UNIQUE(store_id, is_home_page) WHERE is_home_page = TRUE
);

-- جدول قوالب الصفحات
CREATE TABLE page_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  template_data JSONB NOT NULL DEFAULT '{}',
  preview_image_url TEXT,
  category TEXT DEFAULT 'general',
  is_system_template BOOLEAN DEFAULT FALSE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول أقسام المحتوى
CREATE TABLE content_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  page_id UUID,
  section_name TEXT NOT NULL,
  section_type content_type DEFAULT 'section',
  content JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  is_global BOOLEAN DEFAULT FALSE,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول كتل المحتوى
CREATE TABLE content_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL,
  block_type content_block_type NOT NULL,
  content JSONB DEFAULT '{}',
  styles JSONB DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول مكتبة الوسائط
CREATE TABLE media_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  alt_text TEXT,
  tags TEXT[],
  folder_path TEXT DEFAULT '/',
  uploaded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول النماذج المخصصة
CREATE TABLE custom_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  form_name TEXT NOT NULL,
  form_title TEXT NOT NULL,
  fields JSONB NOT NULL DEFAULT '[]',
  settings JSONB DEFAULT '{}',
  submit_url TEXT,
  success_message TEXT DEFAULT 'شكراً لك! تم إرسال النموذج بنجاح',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول إرسالات النماذج
CREATE TABLE form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL,
  data JSONB NOT NULL,
  ip_address INET,
  user_agent TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إضافة الفهارس
CREATE INDEX idx_store_pages_store_slug ON store_pages(store_id, slug);
CREATE INDEX idx_store_pages_status ON store_pages(status);
CREATE INDEX idx_content_sections_store_page ON content_sections(store_id, page_id);
CREATE INDEX idx_content_blocks_section ON content_blocks(section_id, sort_order);
CREATE INDEX idx_media_library_store ON media_library(store_id);

-- إضافة المفاتيح الخارجية
ALTER TABLE store_pages 
  ADD CONSTRAINT fk_store_pages_store FOREIGN KEY (store_id) REFERENCES affiliate_stores(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_store_pages_template FOREIGN KEY (template_id) REFERENCES page_templates(id) ON DELETE SET NULL;

ALTER TABLE content_sections 
  ADD CONSTRAINT fk_content_sections_store FOREIGN KEY (store_id) REFERENCES affiliate_stores(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_content_sections_page FOREIGN KEY (page_id) REFERENCES store_pages(id) ON DELETE CASCADE;

ALTER TABLE content_blocks 
  ADD CONSTRAINT fk_content_blocks_section FOREIGN KEY (section_id) REFERENCES content_sections(id) ON DELETE CASCADE;

ALTER TABLE media_library 
  ADD CONSTRAINT fk_media_library_store FOREIGN KEY (store_id) REFERENCES affiliate_stores(id) ON DELETE CASCADE;

ALTER TABLE custom_forms 
  ADD CONSTRAINT fk_custom_forms_store FOREIGN KEY (store_id) REFERENCES affiliate_stores(id) ON DELETE CASCADE;

ALTER TABLE form_submissions 
  ADD CONSTRAINT fk_form_submissions_form FOREIGN KEY (form_id) REFERENCES custom_forms(id) ON DELETE CASCADE;

-- تريجرات لتحديث timestamps
CREATE TRIGGER update_store_pages_updated_at
  BEFORE UPDATE ON store_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_timestamp();

CREATE TRIGGER update_content_sections_updated_at
  BEFORE UPDATE ON content_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_timestamp();

CREATE TRIGGER update_content_blocks_updated_at
  BEFORE UPDATE ON content_blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_timestamp();

-- إدراج قوالب النظام الأساسية
INSERT INTO page_templates (name, description, template_data, category, is_system_template) VALUES
('صفحة رئيسية أساسية', 'قالب أساسي للصفحة الرئيسية مع قسم البطل والمنتجات', 
 '{"sections": [{"type": "hero", "settings": {"height": "500px", "background": "gradient"}}, {"type": "products", "settings": {"columns": 3, "limit": 6}}]}', 
 'home', true),
('صفحة عن المتجر', 'قالب لصفحة عن المتجر مع معلومات المالك والرؤية', 
 '{"sections": [{"type": "hero", "settings": {"height": "300px"}}, {"type": "text", "settings": {"columns": 1}}]}', 
 'general', true),
('صفحة اتصل بنا', 'قالب لصفحة الاتصال مع نموذج ومعلومات التواصل', 
 '{"sections": [{"type": "text", "settings": {}}, {"type": "form", "settings": {"form_type": "contact"}}]}', 
 'contact', true);

-- سياسات RLS
ALTER TABLE store_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- سياسات للصفحات
CREATE POLICY "Store owners can manage their pages" ON store_pages
  FOR ALL USING (
    store_id IN (
      SELECT id FROM affiliate_stores 
      WHERE profile_id IN (
        SELECT id FROM profiles 
        WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Public can view published pages" ON store_pages
  FOR SELECT USING (status = 'published');

-- سياسات للقوالب
CREATE POLICY "Everyone can view system templates" ON page_templates
  FOR SELECT USING (is_system_template = true);

CREATE POLICY "Store owners can create custom templates" ON page_templates
  FOR ALL USING (
    created_by IN (
      SELECT id FROM profiles 
      WHERE auth_user_id = auth.uid()
    ) OR is_system_template = true
  );

-- سياسات لأقسام المحتوى
CREATE POLICY "Store owners can manage their content sections" ON content_sections
  FOR ALL USING (
    store_id IN (
      SELECT id FROM affiliate_stores 
      WHERE profile_id IN (
        SELECT id FROM profiles 
        WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Public can view visible sections" ON content_sections
  FOR SELECT USING (is_visible = true);

-- سياسات لكتل المحتوى
CREATE POLICY "Store owners can manage content blocks" ON content_blocks
  FOR ALL USING (
    section_id IN (
      SELECT cs.id FROM content_sections cs
      JOIN affiliate_stores ast ON ast.id = cs.store_id
      JOIN profiles p ON p.id = ast.profile_id
      WHERE p.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view visible blocks" ON content_blocks
  FOR SELECT USING (is_visible = true);

-- سياسات لمكتبة الوسائط
CREATE POLICY "Store owners can manage their media" ON media_library
  FOR ALL USING (
    store_id IN (
      SELECT id FROM affiliate_stores 
      WHERE profile_id IN (
        SELECT id FROM profiles 
        WHERE auth_user_id = auth.uid()
      )
    )
  );

-- سياسات للنماذج المخصصة
CREATE POLICY "Store owners can manage their forms" ON custom_forms
  FOR ALL USING (
    store_id IN (
      SELECT id FROM affiliate_stores 
      WHERE profile_id IN (
        SELECT id FROM profiles 
        WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Public can view active forms" ON custom_forms
  FOR SELECT USING (is_active = true);

-- سياسات لإرسالات النماذج
CREATE POLICY "Anyone can submit forms" ON form_submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Store owners can view their form submissions" ON form_submissions
  FOR SELECT USING (
    form_id IN (
      SELECT cf.id FROM custom_forms cf
      JOIN affiliate_stores ast ON ast.id = cf.store_id
      JOIN profiles p ON p.id = ast.profile_id
      WHERE p.auth_user_id = auth.uid()
    )
  );