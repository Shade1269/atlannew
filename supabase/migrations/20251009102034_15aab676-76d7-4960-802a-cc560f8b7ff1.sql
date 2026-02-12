-- ========================================
-- المرحلة 3: إضافة المفاتيح الأجنبية المفقودة
-- Close the Gaps - Part 2: Catalog, Inventory, CRM, Leads, Themes
-- ========================================

-- ============================================
-- 3) Catalog & Inventory
-- ============================================

-- product_variants.product_id → products
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'product_variants' 
    AND column_name = 'product_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_variants_product'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_variants_product_id ON public.product_variants(product_id);
    
    ALTER TABLE public.product_variants
      ADD CONSTRAINT fk_variants_product
      FOREIGN KEY (product_id) 
      REFERENCES public.products(id) 
      ON DELETE CASCADE
      NOT VALID;
  END IF;
END $$;

-- inventory_movements.created_by → profiles
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'inventory_movements' 
    AND column_name = 'created_by'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_inventory_movements_created_by'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_by ON public.inventory_movements(created_by);
    
    ALTER TABLE public.inventory_movements
      ADD CONSTRAINT fk_inventory_movements_created_by
      FOREIGN KEY (created_by) 
      REFERENCES public.profiles(id) 
      ON DELETE SET NULL
      NOT VALID;
  END IF;
END $$;

-- simple_order_items.product_id → products
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'simple_order_items' 
    AND column_name = 'product_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_simple_order_items_product'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_simple_order_items_product_id ON public.simple_order_items(product_id);
    
    ALTER TABLE public.simple_order_items
      ADD CONSTRAINT fk_simple_order_items_product
      FOREIGN KEY (product_id) 
      REFERENCES public.products(id) 
      ON DELETE SET NULL
      NOT VALID;
  END IF;
END $$;

-- ============================================
-- 4) Affiliate Stores & Settings
-- ============================================

-- affiliate_store_settings.store_id → affiliate_stores
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'affiliate_store_settings' 
    AND column_name = 'store_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_store_settings_store'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_store_settings_store_id ON public.affiliate_store_settings(store_id);
    
    ALTER TABLE public.affiliate_store_settings
      ADD CONSTRAINT fk_store_settings_store
      FOREIGN KEY (store_id) 
      REFERENCES public.affiliate_stores(id) 
      ON DELETE CASCADE
      NOT VALID;
  END IF;
END $$;

-- store_settings.shop_id → shops
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'store_settings' 
    AND column_name = 'shop_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_settings_shop'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_settings_shop_id ON public.store_settings(shop_id);
    
    ALTER TABLE public.store_settings
      ADD CONSTRAINT fk_settings_shop
      FOREIGN KEY (shop_id) 
      REFERENCES public.shops(id) 
      ON DELETE CASCADE
      NOT VALID;
  END IF;
END $$;

-- coupons.shop_id → shops
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'coupons' 
    AND column_name = 'shop_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_coupons_shop'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_coupons_shop_id ON public.coupons(shop_id);
    
    ALTER TABLE public.coupons
      ADD CONSTRAINT fk_coupons_shop
      FOREIGN KEY (shop_id) 
      REFERENCES public.shops(id) 
      ON DELETE CASCADE
      NOT VALID;
  END IF;
END $$;

-- ============================================
-- 5) CRM & Leads
-- ============================================

-- lead_activities.lead_id → leads
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'lead_activities' 
    AND column_name = 'lead_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_lead_activities_lead'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON public.lead_activities(lead_id);
    
    ALTER TABLE public.lead_activities
      ADD CONSTRAINT fk_lead_activities_lead
      FOREIGN KEY (lead_id) 
      REFERENCES public.leads(id) 
      ON DELETE CASCADE
      NOT VALID;
  END IF;
END $$;

-- leads.store_id → affiliate_stores
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'leads' 
    AND column_name = 'store_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_leads_store'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_leads_store_id ON public.leads(store_id);
    
    ALTER TABLE public.leads
      ADD CONSTRAINT fk_leads_store
      FOREIGN KEY (store_id) 
      REFERENCES public.affiliate_stores(id) 
      ON DELETE CASCADE
      NOT VALID;
  END IF;
END $$;

-- leads.assigned_to → profiles
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'leads' 
    AND column_name = 'assigned_to'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_leads_assigned_to'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads(assigned_to);
    
    ALTER TABLE public.leads
      ADD CONSTRAINT fk_leads_assigned_to
      FOREIGN KEY (assigned_to) 
      REFERENCES public.profiles(id) 
      ON DELETE SET NULL
      NOT VALID;
  END IF;
END $$;

-- ============================================
-- 6) Themes & Customization
-- ============================================

-- visual_theme_customizations.store_id → affiliate_stores
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'visual_theme_customizations' 
    AND column_name = 'store_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_theme_custom_store'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_theme_custom_store_id ON public.visual_theme_customizations(store_id);
    
    ALTER TABLE public.visual_theme_customizations
      ADD CONSTRAINT fk_theme_custom_store
      FOREIGN KEY (store_id) 
      REFERENCES public.affiliate_stores(id) 
      ON DELETE CASCADE
      NOT VALID;
  END IF;
END $$;

-- user_custom_themes.user_id → profiles
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_custom_themes' 
    AND column_name = 'user_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_custom_themes_user'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_custom_themes_user_id ON public.user_custom_themes(user_id);
    
    ALTER TABLE public.user_custom_themes
      ADD CONSTRAINT fk_custom_themes_user
      FOREIGN KEY (user_id) 
      REFERENCES public.profiles(id) 
      ON DELETE CASCADE
      NOT VALID;
  END IF;
END $$;

-- user_custom_themes.store_id → affiliate_stores
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_custom_themes' 
    AND column_name = 'store_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_custom_themes_store'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_custom_themes_store_id ON public.user_custom_themes(store_id);
    
    ALTER TABLE public.user_custom_themes
      ADD CONSTRAINT fk_custom_themes_store
      FOREIGN KEY (store_id) 
      REFERENCES public.affiliate_stores(id) 
      ON DELETE CASCADE
      NOT VALID;
  END IF;
END $$;

COMMENT ON CONSTRAINT fk_variants_product ON public.product_variants IS 'متغير المنتج → منتج';
COMMENT ON CONSTRAINT fk_inventory_movements_created_by ON public.inventory_movements IS 'حركة المخزون → منشئ';
COMMENT ON CONSTRAINT fk_store_settings_store ON public.affiliate_store_settings IS 'إعدادات → متجر أفلييت';
COMMENT ON CONSTRAINT fk_coupons_shop ON public.coupons IS 'كوبون → متجر';
COMMENT ON CONSTRAINT fk_lead_activities_lead ON public.lead_activities IS 'نشاط العميل المحتمل → عميل محتمل';
COMMENT ON CONSTRAINT fk_leads_store ON public.leads IS 'عميل محتمل → متجر';
COMMENT ON CONSTRAINT fk_theme_custom_store ON public.visual_theme_customizations IS 'تخصيص الثيم → متجر';