-- ═══════════════════════════════════════════════════════════════
-- STAGE 3 PARTS 1-2: CMS & MARKETING FOREIGN KEYS
-- Complete FK additions for CMS and Marketing tables
-- ═══════════════════════════════════════════════════════════════

-- ══════════════════════════════════
-- PART 1: CMS FOREIGN KEYS
-- ══════════════════════════════════

-- CMS Custom Pages
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_cms_custom_pages_store_id 
    ON public.cms_custom_pages(store_id) WHERE store_id IS NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_cms_custom_pages_affiliate_store_id 
    ON public.cms_custom_pages(affiliate_store_id) WHERE affiliate_store_id IS NOT NULL;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_cms_pages_store' AND table_name = 'cms_custom_pages') THEN
    ALTER TABLE public.cms_custom_pages
      ADD CONSTRAINT fk_cms_pages_store
      FOREIGN KEY (store_id) REFERENCES public.shops(id) ON DELETE CASCADE NOT VALID;
    ALTER TABLE public.cms_custom_pages VALIDATE CONSTRAINT fk_cms_pages_store;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_cms_pages_affiliate_store' AND table_name = 'cms_custom_pages') THEN
    ALTER TABLE public.cms_custom_pages
      ADD CONSTRAINT fk_cms_pages_affiliate_store
      FOREIGN KEY (affiliate_store_id) REFERENCES public.affiliate_stores(id) ON DELETE CASCADE NOT VALID;
    ALTER TABLE public.cms_custom_pages VALIDATE CONSTRAINT fk_cms_pages_affiliate_store;
  END IF;
END $$;

-- CMS Content Widgets
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_cms_widgets_page_id ON public.cms_content_widgets(page_id);
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_cms_widgets_page' AND table_name = 'cms_content_widgets') THEN
    ALTER TABLE public.cms_content_widgets
      ADD CONSTRAINT fk_cms_widgets_page
      FOREIGN KEY (page_id) REFERENCES public.cms_custom_pages(id) ON DELETE CASCADE NOT VALID;
    ALTER TABLE public.cms_content_widgets VALIDATE CONSTRAINT fk_cms_widgets_page;
  END IF;
END $$;

-- CMS Page Revisions
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_cms_revisions_page_id ON public.cms_page_revisions(page_id);
  CREATE INDEX IF NOT EXISTS idx_cms_revisions_created_by 
    ON public.cms_page_revisions(created_by) WHERE created_by IS NOT NULL;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_cms_revisions_page' AND table_name = 'cms_page_revisions') THEN
    ALTER TABLE public.cms_page_revisions ADD CONSTRAINT fk_cms_revisions_page
      FOREIGN KEY (page_id) REFERENCES public.cms_custom_pages(id) ON DELETE CASCADE NOT VALID;
    ALTER TABLE public.cms_page_revisions VALIDATE CONSTRAINT fk_cms_revisions_page;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_cms_revisions_creator' AND table_name = 'cms_page_revisions') THEN
    ALTER TABLE public.cms_page_revisions ADD CONSTRAINT fk_cms_revisions_creator
      FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL NOT VALID;
    ALTER TABLE public.cms_page_revisions VALIDATE CONSTRAINT fk_cms_revisions_creator;
  END IF;
END $$;

-- CMS SEO Analytics
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_cms_seo_page_id ON public.cms_seo_analytics(page_id);
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_cms_seo_page' AND table_name = 'cms_seo_analytics') THEN
    ALTER TABLE public.cms_seo_analytics ADD CONSTRAINT fk_cms_seo_page
      FOREIGN KEY (page_id) REFERENCES public.cms_custom_pages(id) ON DELETE CASCADE NOT VALID;
    ALTER TABLE public.cms_seo_analytics VALIDATE CONSTRAINT fk_cms_seo_page;
  END IF;
END $$;

-- Content Editor Drafts  
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_content_drafts_page_id 
    ON public.content_editor_drafts(page_id) WHERE page_id IS NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_content_drafts_created_by 
    ON public.content_editor_drafts(created_by);

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_content_drafts_page' AND table_name = 'content_editor_drafts') THEN
    ALTER TABLE public.content_editor_drafts ADD CONSTRAINT fk_content_drafts_page
      FOREIGN KEY (page_id) REFERENCES public.cms_custom_pages(id) ON DELETE CASCADE NOT VALID;
    ALTER TABLE public.content_editor_drafts VALIDATE CONSTRAINT fk_content_drafts_page;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_content_drafts_creator' AND table_name = 'content_editor_drafts') THEN
    ALTER TABLE public.content_editor_drafts ADD CONSTRAINT fk_content_drafts_creator
      FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE NOT VALID;
    ALTER TABLE public.content_editor_drafts VALIDATE CONSTRAINT fk_content_drafts_creator;
  END IF;
END $$;

-- CMS Blocks Library & Saved Components
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_cms_blocks_created_by 
    ON public.cms_content_blocks_library(created_by) WHERE created_by IS NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_saved_components_created_by 
    ON public.saved_page_components(created_by);

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_cms_blocks_creator' AND table_name = 'cms_content_blocks_library') THEN
    ALTER TABLE public.cms_content_blocks_library ADD CONSTRAINT fk_cms_blocks_creator
      FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL NOT VALID;
    ALTER TABLE public.cms_content_blocks_library VALIDATE CONSTRAINT fk_cms_blocks_creator;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_saved_components_creator' AND table_name = 'saved_page_components') THEN
    ALTER TABLE public.saved_page_components ADD CONSTRAINT fk_saved_components_creator
      FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE NOT VALID;
    ALTER TABLE public.saved_page_components VALIDATE CONSTRAINT fk_saved_components_creator;
  END IF;
END $$;

-- ══════════════════════════════════
-- PART 2: MARKETING FOREIGN KEYS
-- ══════════════════════════════════

-- Email Campaigns
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_email_campaigns_shop_id ON public.email_campaigns(shop_id);
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_email_campaigns_shop' AND table_name = 'email_campaigns') THEN
    ALTER TABLE public.email_campaigns ADD CONSTRAINT fk_email_campaigns_shop
      FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON DELETE CASCADE NOT VALID;
    ALTER TABLE public.email_campaigns VALIDATE CONSTRAINT fk_email_campaigns_shop;
  END IF;
END $$;

-- Marketing Automation Campaigns
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_store_id 
    ON public.marketing_automation_campaigns(store_id) WHERE store_id IS NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_created_by 
    ON public.marketing_automation_campaigns(created_by);

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_marketing_campaigns_store' AND table_name = 'marketing_automation_campaigns') THEN
    ALTER TABLE public.marketing_automation_campaigns ADD CONSTRAINT fk_marketing_campaigns_store
      FOREIGN KEY (store_id) REFERENCES public.affiliate_stores(id) ON DELETE CASCADE NOT VALID;
    ALTER TABLE public.marketing_automation_campaigns VALIDATE CONSTRAINT fk_marketing_campaigns_store;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_marketing_campaigns_creator' AND table_name = 'marketing_automation_campaigns') THEN
    ALTER TABLE public.marketing_automation_campaigns ADD CONSTRAINT fk_marketing_campaigns_creator
      FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL NOT VALID;
    ALTER TABLE public.marketing_automation_campaigns VALIDATE CONSTRAINT fk_marketing_campaigns_creator;
  END IF;
END $$;

-- Social Media Accounts
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_social_accounts_shop_id ON public.social_media_accounts(shop_id);
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_social_accounts_shop' AND table_name = 'social_media_accounts') THEN
    ALTER TABLE public.social_media_accounts ADD CONSTRAINT fk_social_accounts_shop
      FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON DELETE CASCADE NOT VALID;
    ALTER TABLE public.social_media_accounts VALIDATE CONSTRAINT fk_social_accounts_shop;
  END IF;
END $$;

-- Social Media Posts
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_social_posts_shop_id ON public.social_media_posts(shop_id) WHERE shop_id IS NOT NULL;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_social_posts_shop' AND table_name = 'social_media_posts') THEN
    ALTER TABLE public.social_media_posts ADD CONSTRAINT fk_social_posts_shop
      FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON DELETE CASCADE NOT VALID;
    ALTER TABLE public.social_media_posts VALIDATE CONSTRAINT fk_social_posts_shop;
  END IF;
END $$;

-- Promotion Campaigns
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_promotion_campaigns_store_id 
    ON public.promotion_campaigns(store_id) WHERE store_id IS NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_promotion_campaigns_created_by 
    ON public.promotion_campaigns(created_by) WHERE created_by IS NOT NULL;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_promotion_campaigns_store' AND table_name = 'promotion_campaigns') THEN
    ALTER TABLE public.promotion_campaigns ADD CONSTRAINT fk_promotion_campaigns_store
      FOREIGN KEY (store_id) REFERENCES public.affiliate_stores(id) ON DELETE CASCADE NOT VALID;
    ALTER TABLE public.promotion_campaigns VALIDATE CONSTRAINT fk_promotion_campaigns_store;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_promotion_campaigns_creator' AND table_name = 'promotion_campaigns') THEN
    ALTER TABLE public.promotion_campaigns ADD CONSTRAINT fk_promotion_campaigns_creator
      FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL NOT VALID;
    ALTER TABLE public.promotion_campaigns VALIDATE CONSTRAINT fk_promotion_campaigns_creator;
  END IF;
END $$;

-- Promotional Banners
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_promotional_banners_store_id 
    ON public.promotional_banners(store_id) WHERE store_id IS NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_promotional_banners_created_by 
    ON public.promotional_banners(created_by) WHERE created_by IS NOT NULL;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_promotional_banners_store' AND table_name = 'promotional_banners') THEN
    ALTER TABLE public.promotional_banners ADD CONSTRAINT fk_promotional_banners_store
      FOREIGN KEY (store_id) REFERENCES public.affiliate_stores(id) ON DELETE CASCADE NOT VALID;
    ALTER TABLE public.promotional_banners VALIDATE CONSTRAINT fk_promotional_banners_store;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_promotional_banners_creator' AND table_name = 'promotional_banners') THEN
    ALTER TABLE public.promotional_banners ADD CONSTRAINT fk_promotional_banners_creator
      FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL NOT VALID;
    ALTER TABLE public.promotional_banners VALIDATE CONSTRAINT fk_promotional_banners_creator;
  END IF;
END $$;