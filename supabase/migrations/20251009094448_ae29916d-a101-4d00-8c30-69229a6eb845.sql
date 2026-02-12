-- ========================================
-- المرحلة 3: إضافة Foreign Keys - الجزء 3 (Catalog & Settings)
-- ========================================

-- 1) Catalog: product_variants.product_id -> products
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_variants_product'
  ) THEN
    ALTER TABLE public.product_variants
      ADD CONSTRAINT fk_variants_product
      FOREIGN KEY (product_id) 
      REFERENCES public.products(id) 
      ON DELETE CASCADE;
  END IF;
END $$;

-- 2) Inventory: inventory_movements.created_by -> profiles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_inventory_movements_creator'
  ) THEN
    ALTER TABLE public.inventory_movements
      ADD CONSTRAINT fk_inventory_movements_creator
      FOREIGN KEY (created_by) 
      REFERENCES public.profiles(id) 
      ON DELETE SET NULL;
  END IF;
END $$;

-- 3) Settings: affiliate_store_settings.store_id -> affiliate_stores
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_store_settings_store'
  ) THEN
    ALTER TABLE public.affiliate_store_settings
      ADD CONSTRAINT fk_store_settings_store
      FOREIGN KEY (store_id) 
      REFERENCES public.affiliate_stores(id) 
      ON DELETE CASCADE;
  END IF;
END $$;

-- 4) Settings: store_settings.shop_id -> shops
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_shop_settings_shop'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'store_settings'
  ) THEN
    ALTER TABLE public.store_settings
      ADD CONSTRAINT fk_shop_settings_shop
      FOREIGN KEY (shop_id) 
      REFERENCES public.shops(id) 
      ON DELETE CASCADE;
  END IF;
END $$;

-- 5) Coupons: coupons.shop_id -> shops
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_coupons_shop'
  ) THEN
    ALTER TABLE public.coupons
      ADD CONSTRAINT fk_coupons_shop
      FOREIGN KEY (shop_id) 
      REFERENCES public.shops(id) 
      ON DELETE CASCADE;
  END IF;
END $$;

-- 6) CRM: leads.store_id -> affiliate_stores
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_leads_store'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'leads'
  ) THEN
    ALTER TABLE public.leads
      ADD CONSTRAINT fk_leads_store
      FOREIGN KEY (store_id) 
      REFERENCES public.affiliate_stores(id) 
      ON DELETE CASCADE;
  END IF;
END $$;

-- 7) CRM: leads.assigned_to -> profiles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_leads_assigned'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'leads'
  ) THEN
    ALTER TABLE public.leads
      ADD CONSTRAINT fk_leads_assigned
      FOREIGN KEY (assigned_to) 
      REFERENCES public.profiles(id) 
      ON DELETE SET NULL;
  END IF;
END $$;

-- 8) فهارس أداء
CREATE INDEX IF NOT EXISTS idx_variants_product 
  ON public.product_variants(product_id);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_creator 
  ON public.inventory_movements(created_by);

CREATE INDEX IF NOT EXISTS idx_coupons_shop 
  ON public.coupons(shop_id);