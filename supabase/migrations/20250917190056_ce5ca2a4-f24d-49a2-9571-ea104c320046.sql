-- Phase 3.1: Advanced Content Management System - Fixed
-- ================================================

-- Create table for page templates
CREATE TABLE IF NOT EXISTS public.cms_page_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    template_name TEXT NOT NULL,
    template_description TEXT,
    template_category TEXT NOT NULL DEFAULT 'general',
    template_data JSONB NOT NULL DEFAULT '{}',
    preview_image_url TEXT,
    is_premium BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    usage_count INTEGER NOT NULL DEFAULT 0,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for custom pages
CREATE TABLE IF NOT EXISTS public.cms_custom_pages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    page_title TEXT NOT NULL,
    page_slug TEXT NOT NULL,
    meta_description TEXT,
    meta_keywords TEXT[],
    page_content JSONB NOT NULL DEFAULT '{}',
    page_settings JSONB NOT NULL DEFAULT '{}',
    template_id UUID,
    store_id UUID,
    affiliate_store_id UUID,
    is_published BOOLEAN NOT NULL DEFAULT false,
    is_homepage BOOLEAN NOT NULL DEFAULT false,
    view_count INTEGER NOT NULL DEFAULT 0,
    seo_score INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    published_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(store_id, page_slug),
    UNIQUE(affiliate_store_id, page_slug)
);

-- Create table for content widgets
CREATE TABLE IF NOT EXISTS public.cms_content_widgets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    widget_name TEXT NOT NULL,
    widget_type TEXT NOT NULL,
    widget_config JSONB NOT NULL DEFAULT '{}',
    widget_data JSONB NOT NULL DEFAULT '{}',
    page_id UUID NOT NULL,
    section_id TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_visible BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for SEO analytics
CREATE TABLE IF NOT EXISTS public.cms_seo_analytics (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    page_id UUID NOT NULL,
    keyword TEXT NOT NULL,
    search_volume INTEGER,
    ranking_position INTEGER,
    click_through_rate NUMERIC,
    impressions INTEGER NOT NULL DEFAULT 0,
    clicks INTEGER NOT NULL DEFAULT 0,
    date_recorded DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for page revisions
CREATE TABLE IF NOT EXISTS public.cms_page_revisions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    page_id UUID NOT NULL,
    revision_number INTEGER NOT NULL,
    content_snapshot JSONB NOT NULL,
    change_description TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for content blocks library
CREATE TABLE IF NOT EXISTS public.cms_content_blocks_library (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    block_name TEXT NOT NULL,
    block_category TEXT NOT NULL DEFAULT 'general',
    block_description TEXT,
    block_template JSONB NOT NULL,
    preview_image_url TEXT,
    is_premium BOOLEAN NOT NULL DEFAULT false,
    usage_count INTEGER NOT NULL DEFAULT 0,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cms_custom_pages_store_slug ON public.cms_custom_pages(store_id, page_slug);
CREATE INDEX IF NOT EXISTS idx_cms_custom_pages_affiliate_slug ON public.cms_custom_pages(affiliate_store_id, page_slug);
CREATE INDEX IF NOT EXISTS idx_cms_content_widgets_page ON public.cms_content_widgets(page_id);
CREATE INDEX IF NOT EXISTS idx_cms_seo_analytics_page_date ON public.cms_seo_analytics(page_id, date_recorded);
CREATE INDEX IF NOT EXISTS idx_cms_page_revisions_page ON public.cms_page_revisions(page_id, revision_number);

-- Enable RLS
ALTER TABLE public.cms_page_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_custom_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_content_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_seo_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_page_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_content_blocks_library ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cms_page_templates
CREATE POLICY "Public can view active templates" ON public.cms_page_templates
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage templates" ON public.cms_page_templates
    FOR ALL USING (get_current_user_role() = 'admin');

-- RLS Policies for cms_custom_pages
CREATE POLICY "Store owners can manage their pages" ON public.cms_custom_pages
    FOR ALL USING (
        (store_id IN (
            SELECT s.id FROM shops s
            JOIN profiles p ON p.id = s.owner_id
            WHERE p.auth_user_id = auth.uid()
        )) OR
        (affiliate_store_id IN (
            SELECT ast.id FROM affiliate_stores ast
            JOIN profiles p ON p.id = ast.profile_id
            WHERE p.auth_user_id = auth.uid()
        )) OR
        get_current_user_role() = 'admin'
    );

CREATE POLICY "Public can view published pages" ON public.cms_custom_pages
    FOR SELECT USING (is_published = true);

-- RLS Policies for cms_content_widgets
CREATE POLICY "Store owners can manage page widgets" ON public.cms_content_widgets
    FOR ALL USING (
        page_id IN (
            SELECT cp.id FROM cms_custom_pages cp
            WHERE (
                (cp.store_id IN (
                    SELECT s.id FROM shops s
                    JOIN profiles p ON p.id = s.owner_id
                    WHERE p.auth_user_id = auth.uid()
                )) OR
                (cp.affiliate_store_id IN (
                    SELECT ast.id FROM affiliate_stores ast
                    JOIN profiles p ON p.id = ast.profile_id
                    WHERE p.auth_user_id = auth.uid()
                )) OR
                get_current_user_role() = 'admin'
            )
        )
    );

-- RLS Policies for cms_seo_analytics
CREATE POLICY "Store owners can view page SEO analytics" ON public.cms_seo_analytics
    FOR SELECT USING (
        page_id IN (
            SELECT cp.id FROM cms_custom_pages cp
            WHERE (
                (cp.store_id IN (
                    SELECT s.id FROM shops s
                    JOIN profiles p ON p.id = s.owner_id
                    WHERE p.auth_user_id = auth.uid()
                )) OR
                (cp.affiliate_store_id IN (
                    SELECT ast.id FROM affiliate_stores ast
                    JOIN profiles p ON p.id = ast.profile_id
                    WHERE p.auth_user_id = auth.uid()
                )) OR
                get_current_user_role() = 'admin'
            )
        )
    );

CREATE POLICY "System can insert SEO analytics" ON public.cms_seo_analytics
    FOR INSERT WITH CHECK (true);

-- RLS Policies for cms_page_revisions
CREATE POLICY "Store owners can view page revisions" ON public.cms_page_revisions
    FOR SELECT USING (
        page_id IN (
            SELECT cp.id FROM cms_custom_pages cp
            WHERE (
                (cp.store_id IN (
                    SELECT s.id FROM shops s
                    JOIN profiles p ON p.id = s.owner_id
                    WHERE p.auth_user_id = auth.uid()
                )) OR
                (cp.affiliate_store_id IN (
                    SELECT ast.id FROM affiliate_stores ast
                    JOIN profiles p ON p.id = ast.profile_id
                    WHERE p.auth_user_id = auth.uid()
                )) OR
                get_current_user_role() = 'admin'
            )
        )
    );

CREATE POLICY "Store owners can create page revisions" ON public.cms_page_revisions
    FOR INSERT WITH CHECK (
        page_id IN (
            SELECT cp.id FROM cms_custom_pages cp
            WHERE (
                (cp.store_id IN (
                    SELECT s.id FROM shops s
                    JOIN profiles p ON p.id = s.owner_id
                    WHERE p.auth_user_id = auth.uid()
                )) OR
                (cp.affiliate_store_id IN (
                    SELECT ast.id FROM affiliate_stores ast
                    JOIN profiles p ON p.id = ast.profile_id
                    WHERE p.auth_user_id = auth.uid()
                ))
            )
        )
    );

-- RLS Policies for cms_content_blocks_library
CREATE POLICY "Users can view content blocks" ON public.cms_content_blocks_library
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage content block library" ON public.cms_content_blocks_library
    FOR ALL USING (get_current_user_role() = 'admin');

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_cms_page_templates_updated_at
    BEFORE UPDATE ON public.cms_page_templates
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cms_custom_pages_updated_at
    BEFORE UPDATE ON public.cms_custom_pages
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cms_content_widgets_updated_at
    BEFORE UPDATE ON public.cms_content_widgets
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cms_content_blocks_library_updated_at
    BEFORE UPDATE ON public.cms_content_blocks_library
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample templates
INSERT INTO public.cms_page_templates (template_name, template_description, template_category, template_data) VALUES
('صفحة رئيسية بسيطة', 'قالب صفحة رئيسية أنيق ومبسط', 'homepage', '{"sections": [{"type": "hero", "title": "مرحباً بكم في متجرنا", "description": "أفضل المنتجات بأسعار مميزة"}]}'),
('صفحة منتجات', 'قالب لعرض المنتجات بشكل جذاب', 'products', '{"sections": [{"type": "product_grid", "columns": 3, "show_filters": true}]}'),
('صفحة معلومات', 'قالب لصفحات المعلومات والخدمات', 'info', '{"sections": [{"type": "content", "layout": "two_column"}]}');

-- Insert some sample content blocks
INSERT INTO public.cms_content_blocks_library (block_name, block_category, block_description, block_template) VALUES
('بانر ترويجي', 'marketing', 'بانر ترويجي للعروض الخاصة', '{"type": "banner", "style": "gradient", "cta_button": true}'),
('شهادات العملاء', 'social_proof', 'عرض آراء وتقييمات العملاء', '{"type": "testimonials", "layout": "carousel", "show_rating": true}'),
('معرض الصور', 'media', 'عرض مجموعة من الصور', '{"type": "gallery", "layout": "masonry", "lightbox": true}');