
-- ===============================================
-- المرحلة 3 (تكملة): FKs للمخزون و CRM و Themes
-- (مُصحّح حسب البنية الفعلية للجداول)
-- ===============================================

-- ========== PART 1: Catalog & Inventory ==========

-- 1) product_variants.warehouse_product_id
CREATE INDEX IF NOT EXISTS idx_variants_warehouse_product_id 
  ON public.product_variants(warehouse_product_id);

ALTER TABLE public.product_variants
  DROP CONSTRAINT IF EXISTS fk_variants_warehouse_product;

ALTER TABLE public.product_variants
  ADD CONSTRAINT fk_variants_warehouse_product
  FOREIGN KEY (warehouse_product_id) 
  REFERENCES public.warehouse_products(id) 
  ON DELETE CASCADE;

-- 2) inventory_movements.warehouse_product_id
CREATE INDEX IF NOT EXISTS idx_inventory_movements_warehouse_product_id 
  ON public.inventory_movements(warehouse_product_id);

ALTER TABLE public.inventory_movements
  DROP CONSTRAINT IF EXISTS fk_inventory_warehouse_product;

ALTER TABLE public.inventory_movements
  ADD CONSTRAINT fk_inventory_warehouse_product
  FOREIGN KEY (warehouse_product_id) 
  REFERENCES public.warehouse_products(id) 
  ON DELETE CASCADE;

-- 3) inventory_movements.product_variant_id
CREATE INDEX IF NOT EXISTS idx_inventory_movements_variant_id 
  ON public.inventory_movements(product_variant_id);

ALTER TABLE public.inventory_movements
  DROP CONSTRAINT IF EXISTS fk_inventory_variant;

ALTER TABLE public.inventory_movements
  ADD CONSTRAINT fk_inventory_variant
  FOREIGN KEY (product_variant_id) 
  REFERENCES public.product_variants(id) 
  ON DELETE SET NULL;

-- 4) inventory_movements.created_by
CREATE INDEX IF NOT EXISTS idx_inventory_movements_creator 
  ON public.inventory_movements(created_by);

ALTER TABLE public.inventory_movements
  DROP CONSTRAINT IF EXISTS fk_inventory_creator;

ALTER TABLE public.inventory_movements
  ADD CONSTRAINT fk_inventory_creator
  FOREIGN KEY (created_by) 
  REFERENCES public.profiles(id) 
  ON DELETE SET NULL;

-- 5) simple_order_items.product_id (حرج - كان مفقوداً!)
CREATE INDEX IF NOT EXISTS idx_simple_items_product_id 
  ON public.simple_order_items(product_id);

ALTER TABLE public.simple_order_items
  DROP CONSTRAINT IF EXISTS fk_simple_items_product;

ALTER TABLE public.simple_order_items
  ADD CONSTRAINT fk_simple_items_product
  FOREIGN KEY (product_id) 
  REFERENCES public.products(id) 
  ON DELETE SET NULL;

-- ========== PART 2: CRM System ==========

-- 6) lead_activities.lead_id
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id 
  ON public.lead_activities(lead_id);

ALTER TABLE public.lead_activities
  DROP CONSTRAINT IF EXISTS fk_lead_activities_lead;

ALTER TABLE public.lead_activities
  ADD CONSTRAINT fk_lead_activities_lead
  FOREIGN KEY (lead_id) 
  REFERENCES public.leads(id) 
  ON DELETE CASCADE;

-- 7) leads.store_id
CREATE INDEX IF NOT EXISTS idx_leads_store_id 
  ON public.leads(store_id);

ALTER TABLE public.leads
  DROP CONSTRAINT IF EXISTS fk_leads_store;

ALTER TABLE public.leads
  ADD CONSTRAINT fk_leads_store
  FOREIGN KEY (store_id) 
  REFERENCES public.affiliate_stores(id) 
  ON DELETE CASCADE;

-- 8) leads.assigned_to
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to 
  ON public.leads(assigned_to);

ALTER TABLE public.leads
  DROP CONSTRAINT IF EXISTS fk_leads_assignee;

ALTER TABLE public.leads
  ADD CONSTRAINT fk_leads_assignee
  FOREIGN KEY (assigned_to) 
  REFERENCES public.profiles(id) 
  ON DELETE SET NULL;

-- ========== PART 3: Themes & Customization ==========

-- 9) visual_theme_customizations.store_id
CREATE INDEX IF NOT EXISTS idx_theme_custom_store_id 
  ON public.visual_theme_customizations(store_id);

ALTER TABLE public.visual_theme_customizations
  DROP CONSTRAINT IF EXISTS fk_theme_custom_store;

ALTER TABLE public.visual_theme_customizations
  ADD CONSTRAINT fk_theme_custom_store
  FOREIGN KEY (store_id) 
  REFERENCES public.affiliate_stores(id) 
  ON DELETE CASCADE;

-- 10) user_custom_themes.user_id
CREATE INDEX IF NOT EXISTS idx_user_themes_user_id 
  ON public.user_custom_themes(user_id);

ALTER TABLE public.user_custom_themes
  DROP CONSTRAINT IF EXISTS fk_user_themes_user;

ALTER TABLE public.user_custom_themes
  ADD CONSTRAINT fk_user_themes_user
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

-- 11) user_custom_themes.store_id
CREATE INDEX IF NOT EXISTS idx_user_themes_store_id 
  ON public.user_custom_themes(store_id);

ALTER TABLE public.user_custom_themes
  DROP CONSTRAINT IF EXISTS fk_user_themes_store;

ALTER TABLE public.user_custom_themes
  ADD CONSTRAINT fk_user_themes_store
  FOREIGN KEY (store_id) 
  REFERENCES public.affiliate_stores(id) 
  ON DELETE CASCADE;

-- ========== PART 4: Additional Missing FKs ==========

-- 12) saved_page_components.created_by
ALTER TABLE public.saved_page_components
  DROP CONSTRAINT IF EXISTS fk_saved_components_creator;

ALTER TABLE public.saved_page_components
  ADD CONSTRAINT fk_saved_components_creator
  FOREIGN KEY (created_by) 
  REFERENCES public.profiles(id) 
  ON DELETE SET NULL;

-- 13) product_reviews.product_id
CREATE INDEX IF NOT EXISTS idx_reviews_product_id 
  ON public.product_reviews(product_id);

ALTER TABLE public.product_reviews
  DROP CONSTRAINT IF EXISTS fk_reviews_product;

ALTER TABLE public.product_reviews
  ADD CONSTRAINT fk_reviews_product
  FOREIGN KEY (product_id) 
  REFERENCES public.products(id) 
  ON DELETE CASCADE;

-- 14) product_reviews.user_id
CREATE INDEX IF NOT EXISTS idx_reviews_user_id 
  ON public.product_reviews(user_id);

ALTER TABLE public.product_reviews
  DROP CONSTRAINT IF EXISTS fk_reviews_user;

ALTER TABLE public.product_reviews
  ADD CONSTRAINT fk_reviews_user
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

-- التحقق النهائي
SELECT 
  COUNT(DISTINCT table_name) as tables_with_new_fks,
  COUNT(*) as total_fks_added,
  'Migration Completed' as status
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY'
  AND (
    constraint_name LIKE 'fk_variants_%'
    OR constraint_name LIKE 'fk_inventory_%'
    OR constraint_name LIKE 'fk_lead%'
    OR constraint_name LIKE 'fk_theme_%'
    OR constraint_name LIKE 'fk_reviews_%'
    OR constraint_name LIKE 'fk_simple_items_%'
    OR constraint_name LIKE 'fk_saved_%'
  );
