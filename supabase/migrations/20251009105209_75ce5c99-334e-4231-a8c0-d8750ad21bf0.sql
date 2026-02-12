-- ═══════════════════════════════════════════════════════════════
-- STAGE 3 PART 2: CATALOG, INVENTORY, CRM, THEMES FOREIGN KEYS
-- Complete remaining FK relationships
-- ═══════════════════════════════════════════════════════════════

-- ==== CATALOG & INVENTORY ====

-- Product Variants -> Products
DO $$ 
BEGIN
  CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_variants_product' AND table_name = 'product_variants') THEN
    ALTER TABLE public.product_variants
      ADD CONSTRAINT fk_variants_product FOREIGN KEY (product_id) 
      REFERENCES public.products(id) ON DELETE CASCADE NOT VALID;
    ALTER TABLE public.product_variants VALIDATE CONSTRAINT fk_variants_product;
  END IF;
END $$;

-- Inventory Movements -> Profiles
DO $$ 
BEGIN
  CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_by ON public.inventory_movements(created_by) WHERE created_by IS NOT NULL;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_inventory_movements_creator' AND table_name = 'inventory_movements') THEN
    ALTER TABLE public.inventory_movements
      ADD CONSTRAINT fk_inventory_movements_creator FOREIGN KEY (created_by) 
      REFERENCES public.profiles(id) ON DELETE SET NULL NOT VALID;
    ALTER TABLE public.inventory_movements VALIDATE CONSTRAINT fk_inventory_movements_creator;
  END IF;
END $$;

-- Simple Order Items -> Products
DO $$ 
BEGIN
  CREATE INDEX IF NOT EXISTS idx_simple_order_items_product_id ON public.simple_order_items(product_id) WHERE product_id IS NOT NULL;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_simple_order_items_product' AND table_name = 'simple_order_items') THEN
    ALTER TABLE public.simple_order_items
      ADD CONSTRAINT fk_simple_order_items_product FOREIGN KEY (product_id) 
      REFERENCES public.products(id) ON DELETE SET NULL NOT VALID;
    ALTER TABLE public.simple_order_items VALIDATE CONSTRAINT fk_simple_order_items_product;
  END IF;
END $$;

-- ==== AFFILIATE & STORE SETTINGS ====

-- Affiliate Store Settings -> Stores
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_affiliate_settings_store' AND table_name = 'affiliate_store_settings') THEN
    ALTER TABLE public.affiliate_store_settings
      ADD CONSTRAINT fk_affiliate_settings_store FOREIGN KEY (store_id) 
      REFERENCES public.affiliate_stores(id) ON DELETE CASCADE NOT VALID;
    ALTER TABLE public.affiliate_store_settings VALIDATE CONSTRAINT fk_affiliate_settings_store;
  END IF;
END $$;

-- Store Settings -> Shops
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_store_settings_shop' AND table_name = 'store_settings') THEN
    ALTER TABLE public.store_settings
      ADD CONSTRAINT fk_store_settings_shop FOREIGN KEY (shop_id) 
      REFERENCES public.shops(id) ON DELETE CASCADE NOT VALID;
    ALTER TABLE public.store_settings VALIDATE CONSTRAINT fk_store_settings_shop;
  END IF;
END $$;

-- Coupons -> Shops
DO $$ 
BEGIN
  CREATE INDEX IF NOT EXISTS idx_coupons_shop_id ON public.coupons(shop_id);

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_coupons_shop' AND table_name = 'coupons') THEN
    ALTER TABLE public.coupons
      ADD CONSTRAINT fk_coupons_shop FOREIGN KEY (shop_id) 
      REFERENCES public.shops(id) ON DELETE CASCADE NOT VALID;
    ALTER TABLE public.coupons VALIDATE CONSTRAINT fk_coupons_shop;
  END IF;
END $$;

-- ==== CRM ====

-- Lead Activities -> Leads
DO $$ 
BEGIN
  CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON public.lead_activities(lead_id);

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_lead_activities_lead' AND table_name = 'lead_activities') THEN
    ALTER TABLE public.lead_activities
      ADD CONSTRAINT fk_lead_activities_lead FOREIGN KEY (lead_id) 
      REFERENCES public.leads(id) ON DELETE CASCADE NOT VALID;
    ALTER TABLE public.lead_activities VALIDATE CONSTRAINT fk_lead_activities_lead;
  END IF;
END $$;

-- Leads -> Stores/Profiles
DO $$ 
BEGIN
  CREATE INDEX IF NOT EXISTS idx_leads_store_id ON public.leads(store_id) WHERE store_id IS NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads(assigned_to) WHERE assigned_to IS NOT NULL;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_leads_store' AND table_name = 'leads') THEN
    ALTER TABLE public.leads
      ADD CONSTRAINT fk_leads_store FOREIGN KEY (store_id) 
      REFERENCES public.affiliate_stores(id) ON DELETE CASCADE NOT VALID;
    ALTER TABLE public.leads VALIDATE CONSTRAINT fk_leads_store;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_leads_assignee' AND table_name = 'leads') THEN
    ALTER TABLE public.leads
      ADD CONSTRAINT fk_leads_assignee FOREIGN KEY (assigned_to) 
      REFERENCES public.profiles(id) ON DELETE SET NULL NOT VALID;
    ALTER TABLE public.leads VALIDATE CONSTRAINT fk_leads_assignee;
  END IF;
END $$;

-- ==== THEMES & CUSTOMIZATION ====

-- Visual Theme Customizations -> Stores
DO $$ 
BEGIN
  CREATE INDEX IF NOT EXISTS idx_theme_customizations_store_id ON public.visual_theme_customizations(store_id);

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_theme_customizations_store' AND table_name = 'visual_theme_customizations') THEN
    ALTER TABLE public.visual_theme_customizations
      ADD CONSTRAINT fk_theme_customizations_store FOREIGN KEY (store_id) 
      REFERENCES public.affiliate_stores(id) ON DELETE CASCADE NOT VALID;
    ALTER TABLE public.visual_theme_customizations VALIDATE CONSTRAINT fk_theme_customizations_store;
  END IF;
END $$;

-- User Custom Themes -> Profiles/Stores
DO $$ 
BEGIN
  CREATE INDEX IF NOT EXISTS idx_user_custom_themes_user_id ON public.user_custom_themes(user_id);
  CREATE INDEX IF NOT EXISTS idx_user_custom_themes_store_id ON public.user_custom_themes(store_id) WHERE store_id IS NOT NULL;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_user_themes_user' AND table_name = 'user_custom_themes') THEN
    ALTER TABLE public.user_custom_themes
      ADD CONSTRAINT fk_user_themes_user FOREIGN KEY (user_id) 
      REFERENCES public.profiles(id) ON DELETE CASCADE NOT VALID;
    ALTER TABLE public.user_custom_themes VALIDATE CONSTRAINT fk_user_themes_user;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_user_themes_store' AND table_name = 'user_custom_themes') THEN
    ALTER TABLE public.user_custom_themes
      ADD CONSTRAINT fk_user_themes_store FOREIGN KEY (store_id) 
      REFERENCES public.affiliate_stores(id) ON DELETE CASCADE NOT VALID;
    ALTER TABLE public.user_custom_themes VALIDATE CONSTRAINT fk_user_themes_store;
  END IF;
END $$;

-- Success Summary
DO $$
DECLARE
  total_fks int;
BEGIN
  SELECT COUNT(*) INTO total_fks 
  FROM information_schema.table_constraints 
  WHERE table_schema = 'public' 
    AND constraint_type = 'FOREIGN KEY';
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════';
  RAISE NOTICE '✓ STAGE 3 PART 1 & 2 COMPLETE: Foreign Keys';
  RAISE NOTICE '═══════════════════════════════════════════════';
  RAISE NOTICE '  Total Foreign Keys: %', total_fks;
  RAISE NOTICE '';
  RAISE NOTICE '  CMS: 8 FKs added';
  RAISE NOTICE '  Marketing: 6 FKs added';
  RAISE NOTICE '  Catalog/Inventory: 3 FKs added';
  RAISE NOTICE '  CRM: 3 FKs added';
  RAISE NOTICE '  Themes: 3 FKs added';
  RAISE NOTICE '═══════════════════════════════════════════════';
END $$;