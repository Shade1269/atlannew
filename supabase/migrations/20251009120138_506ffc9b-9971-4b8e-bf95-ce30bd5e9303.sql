
-- ===============================================
-- المرحلة 3: إضافة المفاتيح الأجنبية المفقودة
-- CMS, Marketing, Settings, CRM
-- ===============================================

-- ========== PART 1: CMS System ==========

-- 1) cms_custom_pages.store_id
CREATE INDEX IF NOT EXISTS idx_cms_pages_store_id 
  ON public.cms_custom_pages(store_id);

ALTER TABLE public.cms_custom_pages
  DROP CONSTRAINT IF EXISTS fk_cms_pages_store;

ALTER TABLE public.cms_custom_pages
  ADD CONSTRAINT fk_cms_pages_store
  FOREIGN KEY (store_id) 
  REFERENCES public.affiliate_stores(id) 
  ON DELETE CASCADE;

-- 2) cms_content_widgets.page_id
CREATE INDEX IF NOT EXISTS idx_cms_widgets_page_id 
  ON public.cms_content_widgets(page_id);

ALTER TABLE public.cms_content_widgets
  DROP CONSTRAINT IF EXISTS fk_cms_widgets_page;

ALTER TABLE public.cms_content_widgets
  ADD CONSTRAINT fk_cms_widgets_page
  FOREIGN KEY (page_id) 
  REFERENCES public.cms_custom_pages(id) 
  ON DELETE CASCADE;

-- 3) cms_page_revisions.page_id
CREATE INDEX IF NOT EXISTS idx_cms_revisions_page_id 
  ON public.cms_page_revisions(page_id);

ALTER TABLE public.cms_page_revisions
  DROP CONSTRAINT IF EXISTS fk_cms_revisions_page;

ALTER TABLE public.cms_page_revisions
  ADD CONSTRAINT fk_cms_revisions_page
  FOREIGN KEY (page_id) 
  REFERENCES public.cms_custom_pages(id) 
  ON DELETE CASCADE;

-- 4) cms_page_revisions.created_by (profiles)
ALTER TABLE public.cms_page_revisions
  DROP CONSTRAINT IF EXISTS fk_cms_revisions_creator;

ALTER TABLE public.cms_page_revisions
  ADD CONSTRAINT fk_cms_revisions_creator
  FOREIGN KEY (created_by) 
  REFERENCES public.profiles(id) 
  ON DELETE SET NULL;

-- 5) cms_seo_analytics.page_id
CREATE INDEX IF NOT EXISTS idx_cms_seo_page_id 
  ON public.cms_seo_analytics(page_id);

ALTER TABLE public.cms_seo_analytics
  DROP CONSTRAINT IF EXISTS fk_cms_seo_page;

ALTER TABLE public.cms_seo_analytics
  ADD CONSTRAINT fk_cms_seo_page
  FOREIGN KEY (page_id) 
  REFERENCES public.cms_custom_pages(id) 
  ON DELETE CASCADE;

-- 6) content_editor_drafts.page_id
CREATE INDEX IF NOT EXISTS idx_drafts_page_id 
  ON public.content_editor_drafts(page_id);

ALTER TABLE public.content_editor_drafts
  DROP CONSTRAINT IF EXISTS fk_drafts_page;

ALTER TABLE public.content_editor_drafts
  ADD CONSTRAINT fk_drafts_page
  FOREIGN KEY (page_id) 
  REFERENCES public.cms_custom_pages(id) 
  ON DELETE CASCADE;

-- ========== PART 2: Marketing System ==========

-- 7) email_campaigns.shop_id
CREATE INDEX IF NOT EXISTS idx_email_campaigns_shop_id 
  ON public.email_campaigns(shop_id);

ALTER TABLE public.email_campaigns
  DROP CONSTRAINT IF EXISTS fk_email_campaigns_shop;

ALTER TABLE public.email_campaigns
  ADD CONSTRAINT fk_email_campaigns_shop
  FOREIGN KEY (shop_id) 
  REFERENCES public.shops(id) 
  ON DELETE CASCADE;

-- 8) marketing_automation_campaigns.store_id
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_store_id 
  ON public.marketing_automation_campaigns(store_id);

ALTER TABLE public.marketing_automation_campaigns
  DROP CONSTRAINT IF EXISTS fk_marketing_campaigns_store;

ALTER TABLE public.marketing_automation_campaigns
  ADD CONSTRAINT fk_marketing_campaigns_store
  FOREIGN KEY (store_id) 
  REFERENCES public.affiliate_stores(id) 
  ON DELETE CASCADE;

-- 9) marketing_automation_campaigns.created_by
ALTER TABLE public.marketing_automation_campaigns
  DROP CONSTRAINT IF EXISTS fk_marketing_campaigns_creator;

ALTER TABLE public.marketing_automation_campaigns
  ADD CONSTRAINT fk_marketing_campaigns_creator
  FOREIGN KEY (created_by) 
  REFERENCES public.profiles(id) 
  ON DELETE SET NULL;

-- 10) social_media_accounts.shop_id
CREATE INDEX IF NOT EXISTS idx_social_accounts_shop_id 
  ON public.social_media_accounts(shop_id);

ALTER TABLE public.social_media_accounts
  DROP CONSTRAINT IF EXISTS fk_social_accounts_shop;

ALTER TABLE public.social_media_accounts
  ADD CONSTRAINT fk_social_accounts_shop
  FOREIGN KEY (shop_id) 
  REFERENCES public.shops(id) 
  ON DELETE CASCADE;

-- 11) social_media_posts.shop_id
CREATE INDEX IF NOT EXISTS idx_social_posts_shop_id 
  ON public.social_media_posts(shop_id);

ALTER TABLE public.social_media_posts
  DROP CONSTRAINT IF EXISTS fk_social_posts_shop;

ALTER TABLE public.social_media_posts
  ADD CONSTRAINT fk_social_posts_shop
  FOREIGN KEY (shop_id) 
  REFERENCES public.shops(id) 
  ON DELETE CASCADE;

-- 12) promotion_campaigns.store_id
CREATE INDEX IF NOT EXISTS idx_promo_campaigns_store_id 
  ON public.promotion_campaigns(store_id);

ALTER TABLE public.promotion_campaigns
  DROP CONSTRAINT IF EXISTS fk_promo_campaigns_store;

ALTER TABLE public.promotion_campaigns
  ADD CONSTRAINT fk_promo_campaigns_store
  FOREIGN KEY (store_id) 
  REFERENCES public.affiliate_stores(id) 
  ON DELETE CASCADE;

-- 13) promotion_campaigns.created_by
ALTER TABLE public.promotion_campaigns
  DROP CONSTRAINT IF EXISTS fk_promo_campaigns_creator;

ALTER TABLE public.promotion_campaigns
  ADD CONSTRAINT fk_promo_campaigns_creator
  FOREIGN KEY (created_by) 
  REFERENCES public.profiles(id) 
  ON DELETE SET NULL;

-- 14) promotional_banners.store_id
CREATE INDEX IF NOT EXISTS idx_banners_store_id 
  ON public.promotional_banners(store_id);

ALTER TABLE public.promotional_banners
  DROP CONSTRAINT IF EXISTS fk_banners_store;

ALTER TABLE public.promotional_banners
  ADD CONSTRAINT fk_banners_store
  FOREIGN KEY (store_id) 
  REFERENCES public.affiliate_stores(id) 
  ON DELETE CASCADE;

-- 15) promotional_banners.created_by
ALTER TABLE public.promotional_banners
  DROP CONSTRAINT IF EXISTS fk_banners_creator;

ALTER TABLE public.promotional_banners
  ADD CONSTRAINT fk_banners_creator
  FOREIGN KEY (created_by) 
  REFERENCES public.profiles(id) 
  ON DELETE SET NULL;

-- ========== PART 3: Settings & Configuration ==========

-- 16) affiliate_store_settings.store_id
ALTER TABLE public.affiliate_store_settings
  DROP CONSTRAINT IF EXISTS fk_store_settings_store;

ALTER TABLE public.affiliate_store_settings
  ADD CONSTRAINT fk_store_settings_store
  FOREIGN KEY (store_id) 
  REFERENCES public.affiliate_stores(id) 
  ON DELETE CASCADE;

-- 17) store_settings.shop_id
ALTER TABLE public.store_settings
  DROP CONSTRAINT IF EXISTS fk_store_settings_shop;

ALTER TABLE public.store_settings
  ADD CONSTRAINT fk_store_settings_shop
  FOREIGN KEY (shop_id) 
  REFERENCES public.shops(id) 
  ON DELETE CASCADE;

-- 18) coupons.shop_id
CREATE INDEX IF NOT EXISTS idx_coupons_shop_id 
  ON public.coupons(shop_id);

ALTER TABLE public.coupons
  DROP CONSTRAINT IF EXISTS fk_coupons_shop;

ALTER TABLE public.coupons
  ADD CONSTRAINT fk_coupons_shop
  FOREIGN KEY (shop_id) 
  REFERENCES public.shops(id) 
  ON DELETE CASCADE;

-- التحقق النهائي
SELECT 
  COUNT(*) as total_fks_added,
  'Migration Completed Successfully' as status
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY'
  AND constraint_name LIKE 'fk_cms_%'
  OR constraint_name LIKE 'fk_%_campaigns_%'
  OR constraint_name LIKE 'fk_%_settings_%'
  OR constraint_name LIKE 'fk_coupons_%';
