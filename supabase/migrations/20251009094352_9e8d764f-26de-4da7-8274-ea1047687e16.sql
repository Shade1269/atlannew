-- ========================================
-- المرحلة 3: إضافة Foreign Keys - الجزء 1 (CMS & Content)
-- ========================================

-- 1) CMS: cms_custom_pages.store_id -> affiliate_stores
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_cms_pages_store'
  ) THEN
    ALTER TABLE public.cms_custom_pages
      ADD CONSTRAINT fk_cms_pages_store
      FOREIGN KEY (store_id) 
      REFERENCES public.affiliate_stores(id) 
      ON DELETE CASCADE;
  END IF;
END $$;

-- 2) CMS: cms_content_widgets.page_id -> cms_custom_pages
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_cms_widgets_page'
  ) THEN
    ALTER TABLE public.cms_content_widgets
      ADD CONSTRAINT fk_cms_widgets_page
      FOREIGN KEY (page_id) 
      REFERENCES public.cms_custom_pages(id) 
      ON DELETE CASCADE;
  END IF;
END $$;

-- 3) CMS: cms_page_revisions.page_id -> cms_custom_pages
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_cms_revisions_page'
  ) THEN
    ALTER TABLE public.cms_page_revisions
      ADD CONSTRAINT fk_cms_revisions_page
      FOREIGN KEY (page_id) 
      REFERENCES public.cms_custom_pages(id) 
      ON DELETE CASCADE;
  END IF;
END $$;

-- 4) CMS: cms_seo_analytics.page_id -> cms_custom_pages
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_cms_seo_page'
  ) THEN
    ALTER TABLE public.cms_seo_analytics
      ADD CONSTRAINT fk_cms_seo_page
      FOREIGN KEY (page_id) 
      REFERENCES public.cms_custom_pages(id) 
      ON DELETE CASCADE;
  END IF;
END $$;

-- 5) Content: content_editor_drafts.page_id -> cms_custom_pages (إن وُجد)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'content_editor_drafts'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_drafts_page'
  ) THEN
    ALTER TABLE public.content_editor_drafts
      ADD CONSTRAINT fk_drafts_page
      FOREIGN KEY (page_id) 
      REFERENCES public.cms_custom_pages(id) 
      ON DELETE CASCADE;
  END IF;
END $$;

-- 6) فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_cms_widgets_page_id 
  ON public.cms_content_widgets(page_id);

CREATE INDEX IF NOT EXISTS idx_cms_revisions_page_id 
  ON public.cms_page_revisions(page_id);

CREATE INDEX IF NOT EXISTS idx_cms_seo_page_id 
  ON public.cms_seo_analytics(page_id);

CREATE INDEX IF NOT EXISTS idx_cms_pages_store_id 
  ON public.cms_custom_pages(store_id);