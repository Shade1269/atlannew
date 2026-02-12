-- ========================================
-- المرحلة 3: إضافة المفاتيح الأجنبية المفقودة
-- Close the Gaps - Part 1: CMS & Marketing (مُعدّل)
-- ========================================

-- ============================================
-- 1) CMS - Custom Pages & Widgets
-- ============================================

-- cms_custom_pages.store_id → affiliate_stores
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'cms_custom_pages' 
    AND column_name = 'store_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_cms_pages_store'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_cms_pages_store_id ON public.cms_custom_pages(store_id);
    
    ALTER TABLE public.cms_custom_pages
      ADD CONSTRAINT fk_cms_pages_store
      FOREIGN KEY (store_id) 
      REFERENCES public.affiliate_stores(id) 
      ON DELETE CASCADE
      NOT VALID;
  END IF;
END $$;

-- cms_content_widgets.page_id → cms_custom_pages
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'cms_content_widgets' 
    AND column_name = 'page_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_cms_widgets_page'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_cms_widgets_page_id ON public.cms_content_widgets(page_id);
    
    ALTER TABLE public.cms_content_widgets
      ADD CONSTRAINT fk_cms_widgets_page
      FOREIGN KEY (page_id) 
      REFERENCES public.cms_custom_pages(id) 
      ON DELETE CASCADE
      NOT VALID;
  END IF;
END $$;

-- cms_page_revisions.page_id → cms_custom_pages
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'cms_page_revisions' 
    AND column_name = 'page_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_cms_revisions_page'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_cms_revisions_page_id ON public.cms_page_revisions(page_id);
    
    ALTER TABLE public.cms_page_revisions
      ADD CONSTRAINT fk_cms_revisions_page
      FOREIGN KEY (page_id) 
      REFERENCES public.cms_custom_pages(id) 
      ON DELETE CASCADE
      NOT VALID;
  END IF;
END $$;

-- cms_seo_analytics.page_id → cms_custom_pages
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'cms_seo_analytics' 
    AND column_name = 'page_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_cms_seo_page'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_cms_seo_page_id ON public.cms_seo_analytics(page_id);
    
    ALTER TABLE public.cms_seo_analytics
      ADD CONSTRAINT fk_cms_seo_page
      FOREIGN KEY (page_id) 
      REFERENCES public.cms_custom_pages(id) 
      ON DELETE CASCADE
      NOT VALID;
  END IF;
END $$;

-- content_editor_drafts.page_id → cms_custom_pages
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'content_editor_drafts' 
    AND column_name = 'page_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_drafts_page'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_drafts_page_id ON public.content_editor_drafts(page_id);
    
    ALTER TABLE public.content_editor_drafts
      ADD CONSTRAINT fk_drafts_page
      FOREIGN KEY (page_id) 
      REFERENCES public.cms_custom_pages(id) 
      ON DELETE CASCADE
      NOT VALID;
  END IF;
END $$;

-- content_editor_drafts.created_by → profiles
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'content_editor_drafts' 
    AND column_name = 'created_by'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_drafts_created_by'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_drafts_created_by ON public.content_editor_drafts(created_by);
    
    ALTER TABLE public.content_editor_drafts
      ADD CONSTRAINT fk_drafts_created_by
      FOREIGN KEY (created_by) 
      REFERENCES public.profiles(id) 
      ON DELETE CASCADE
      NOT VALID;
  END IF;
END $$;

-- ============================================
-- 2) Marketing - Campaigns & Social Media
-- ============================================

-- email_campaigns.shop_id → shops
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'email_campaigns' 
    AND column_name = 'shop_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_email_campaigns_shop'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_email_campaigns_shop_id ON public.email_campaigns(shop_id);
    
    ALTER TABLE public.email_campaigns
      ADD CONSTRAINT fk_email_campaigns_shop
      FOREIGN KEY (shop_id) 
      REFERENCES public.shops(id) 
      ON DELETE CASCADE
      NOT VALID;
  END IF;
END $$;

-- marketing_automation_campaigns.store_id → affiliate_stores
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'marketing_automation_campaigns' 
    AND column_name = 'store_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_marketing_auto_store'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_marketing_auto_store_id ON public.marketing_automation_campaigns(store_id);
    
    ALTER TABLE public.marketing_automation_campaigns
      ADD CONSTRAINT fk_marketing_auto_store
      FOREIGN KEY (store_id) 
      REFERENCES public.affiliate_stores(id) 
      ON DELETE CASCADE
      NOT VALID;
  END IF;
END $$;

-- marketing_automation_campaigns.created_by → profiles
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'marketing_automation_campaigns' 
    AND column_name = 'created_by'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_marketing_auto_created_by'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_marketing_auto_created_by ON public.marketing_automation_campaigns(created_by);
    
    ALTER TABLE public.marketing_automation_campaigns
      ADD CONSTRAINT fk_marketing_auto_created_by
      FOREIGN KEY (created_by) 
      REFERENCES public.profiles(id) 
      ON DELETE SET NULL
      NOT VALID;
  END IF;
END $$;

-- social_media_accounts.shop_id → shops
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'social_media_accounts' 
    AND column_name = 'shop_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_social_accounts_shop'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_social_accounts_shop_id ON public.social_media_accounts(shop_id);
    
    ALTER TABLE public.social_media_accounts
      ADD CONSTRAINT fk_social_accounts_shop
      FOREIGN KEY (shop_id) 
      REFERENCES public.shops(id) 
      ON DELETE CASCADE
      NOT VALID;
  END IF;
END $$;

-- social_media_posts.shop_id → shops
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'social_media_posts' 
    AND column_name = 'shop_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_social_posts_shop'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_social_posts_shop_id ON public.social_media_posts(shop_id);
    
    ALTER TABLE public.social_media_posts
      ADD CONSTRAINT fk_social_posts_shop
      FOREIGN KEY (shop_id) 
      REFERENCES public.shops(id) 
      ON DELETE CASCADE
      NOT VALID;
  END IF;
END $$;

-- social_media_posts.account_id → social_media_accounts
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'social_media_posts' 
    AND column_name = 'account_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_social_posts_account'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_social_posts_account_id ON public.social_media_posts(account_id);
    
    ALTER TABLE public.social_media_posts
      ADD CONSTRAINT fk_social_posts_account
      FOREIGN KEY (account_id) 
      REFERENCES public.social_media_accounts(id) 
      ON DELETE CASCADE
      NOT VALID;
  END IF;
END $$;

-- promotion_campaigns.store_id → affiliate_stores  
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'promotion_campaigns' 
    AND column_name = 'store_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_promo_campaigns_store'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_promo_campaigns_store_id ON public.promotion_campaigns(store_id);
    
    ALTER TABLE public.promotion_campaigns
      ADD CONSTRAINT fk_promo_campaigns_store
      FOREIGN KEY (store_id) 
      REFERENCES public.affiliate_stores(id) 
      ON DELETE CASCADE
      NOT VALID;
  END IF;
END $$;

-- promotional_banners.store_id → affiliate_stores
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'promotional_banners' 
    AND column_name = 'store_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_promo_banners_store'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_promo_banners_store_id ON public.promotional_banners(store_id);
    
    ALTER TABLE public.promotional_banners
      ADD CONSTRAINT fk_promo_banners_store
      FOREIGN KEY (store_id) 
      REFERENCES public.affiliate_stores(id) 
      ON DELETE CASCADE
      NOT VALID;
  END IF;
END $$;

-- saved_page_components.store_id → affiliate_stores
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'saved_page_components' 
    AND column_name = 'store_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_saved_components_store'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_saved_components_store_id ON public.saved_page_components(store_id);
    
    ALTER TABLE public.saved_page_components
      ADD CONSTRAINT fk_saved_components_store
      FOREIGN KEY (store_id) 
      REFERENCES public.affiliate_stores(id) 
      ON DELETE CASCADE
      NOT VALID;
  END IF;
END $$;