-- ========================================
-- المرحلة 3: إضافة Foreign Keys - الجزء 2 (Marketing & Orders)
-- ========================================

-- 1) Marketing: email_campaigns.shop_id -> shops
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_email_campaigns_shop'
  ) THEN
    ALTER TABLE public.email_campaigns
      ADD CONSTRAINT fk_email_campaigns_shop
      FOREIGN KEY (shop_id) 
      REFERENCES public.shops(id) 
      ON DELETE CASCADE;
  END IF;
END $$;

-- 2) Marketing: promotion_campaigns.store_id -> affiliate_stores
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_promo_campaigns_store'
  ) THEN
    ALTER TABLE public.promotion_campaigns
      ADD CONSTRAINT fk_promo_campaigns_store
      FOREIGN KEY (store_id) 
      REFERENCES public.affiliate_stores(id) 
      ON DELETE CASCADE;
  END IF;
END $$;

-- 3) Marketing: promotion_campaigns.created_by -> profiles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_promo_campaigns_creator'
  ) THEN
    ALTER TABLE public.promotion_campaigns
      ADD CONSTRAINT fk_promo_campaigns_creator
      FOREIGN KEY (created_by) 
      REFERENCES public.profiles(id) 
      ON DELETE SET NULL;
  END IF;
END $$;

-- 4) Marketing: promotional_banners.store_id -> affiliate_stores
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_banners_store'
  ) THEN
    ALTER TABLE public.promotional_banners
      ADD CONSTRAINT fk_banners_store
      FOREIGN KEY (store_id) 
      REFERENCES public.affiliate_stores(id) 
      ON DELETE CASCADE;
  END IF;
END $$;

-- 5) Marketing: promotional_banners.created_by -> profiles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_banners_creator'
  ) THEN
    ALTER TABLE public.promotional_banners
      ADD CONSTRAINT fk_banners_creator
      FOREIGN KEY (created_by) 
      REFERENCES public.profiles(id) 
      ON DELETE SET NULL;
  END IF;
END $$;

-- 6) Orders: simple_order_items.product_id -> products
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_simple_items_product'
  ) THEN
    ALTER TABLE public.simple_order_items
      ADD CONSTRAINT fk_simple_items_product
      FOREIGN KEY (product_id) 
      REFERENCES public.products(id) 
      ON DELETE SET NULL;
  END IF;
END $$;

-- 7) فهارس
CREATE INDEX IF NOT EXISTS idx_email_campaigns_shop 
  ON public.email_campaigns(shop_id);

CREATE INDEX IF NOT EXISTS idx_promo_campaigns_store 
  ON public.promotion_campaigns(store_id);

CREATE INDEX IF NOT EXISTS idx_promo_campaigns_creator 
  ON public.promotion_campaigns(created_by);

CREATE INDEX IF NOT EXISTS idx_banners_store 
  ON public.promotional_banners(store_id);

CREATE INDEX IF NOT EXISTS idx_simple_items_product 
  ON public.simple_order_items(product_id);