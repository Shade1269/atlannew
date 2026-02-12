-- ═══════════════════════════════════════════════════════════════
-- STAGE 2 COMPLETE: Types & Generated Columns  
-- Final implementation without CONCURRENTLY in transaction
-- ═══════════════════════════════════════════════════════════════

-- Step 1: Drop dependent views
DROP VIEW IF EXISTS public.v_order_items_unified CASCADE;
DROP VIEW IF EXISTS public.v_unified_order_items CASCADE;

-- Step 2: Convert simple_order_items.total_price_sar to GENERATED
ALTER TABLE public.simple_order_items 
  RENAME COLUMN total_price_sar TO total_price_sar_old;

ALTER TABLE public.simple_order_items
  ADD COLUMN total_price_sar numeric
  GENERATED ALWAYS AS (quantity::numeric * unit_price_sar) STORED;

ALTER TABLE public.simple_order_items 
  DROP COLUMN total_price_sar_old;

-- Step 3: Add product_variants image_urls_array
ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS image_urls_array text[];

UPDATE public.product_variants
SET image_urls_array = ARRAY(
  SELECT jsonb_array_elements_text(image_urls)
)
WHERE image_urls IS NOT NULL 
  AND jsonb_typeof(image_urls) = 'array'
  AND image_urls_array IS NULL;

-- Step 4: Add indexes (non-concurrent for transaction safety)
CREATE INDEX IF NOT EXISTS idx_simple_order_items_total 
  ON public.simple_order_items(total_price_sar);

CREATE INDEX IF NOT EXISTS idx_variants_image_urls_array
  ON public.product_variants USING GIN(image_urls_array);

-- Step 5: Recreate unified views
CREATE OR REPLACE VIEW v_order_items_unified AS
SELECT 
  'ecommerce' as source,
  eoi.id,
  eoi.order_id,
  eoi.product_id,
  eoi.product_title,
  eoi.product_image_url,
  eoi.quantity,
  eoi.unit_price_sar,
  eoi.total_price_sar,
  eoi.created_at
FROM public.ecommerce_order_items eoi
UNION ALL
SELECT 
  'simple' as source,
  soi.id,
  soi.order_id,
  soi.product_id,
  soi.product_title,
  soi.product_image_url,
  soi.quantity,
  soi.unit_price_sar,
  soi.total_price_sar,
  soi.created_at
FROM public.simple_order_items soi;

CREATE OR REPLACE VIEW v_unified_order_items AS
SELECT 
  'ecommerce' as source,
  eoi.id,
  eoi.order_id,
  eoi.product_id,
  eoi.product_title,
  eoi.product_sku,
  eoi.product_image_url,
  eoi.quantity,
  eoi.unit_price_sar,
  eoi.total_price_sar,
  eoi.commission_rate,
  eoi.commission_sar,
  eoi.selected_variants,
  eoi.created_at
FROM public.ecommerce_order_items eoi
UNION ALL
SELECT 
  'simple' as source,
  soi.id,
  soi.order_id,
  soi.product_id,
  soi.product_title,
  NULL as product_sku,
  soi.product_image_url,
  soi.quantity,
  soi.unit_price_sar,
  soi.total_price_sar,
  0 as commission_rate,
  0 as commission_sar,
  NULL::jsonb as selected_variants,
  soi.created_at
FROM public.simple_order_items soi;

GRANT SELECT ON v_order_items_unified TO authenticated, anon;
GRANT SELECT ON v_unified_order_items TO authenticated, anon;

-- Step 6: Create status view
CREATE OR REPLACE VIEW v_generated_columns_status AS
SELECT 
  'cart_items' as table_name,
  'total_price_sar' as column_name,
  'quantity * unit_price' as calculation,
  COUNT(*) as row_count,
  ROUND(COALESCE(AVG(total_price_sar), 0), 2) as avg_value
FROM public.cart_items
UNION ALL
SELECT 
  'ecommerce_order_items',
  'total_price_sar',
  'quantity * unit_price',
  COUNT(*),
  ROUND(COALESCE(AVG(total_price_sar), 0), 2)
FROM public.ecommerce_order_items
UNION ALL
SELECT 
  'simple_order_items',
  'total_price_sar',
  'quantity * unit_price',
  COUNT(*),
  ROUND(COALESCE(AVG(total_price_sar), 0), 2)
FROM public.simple_order_items
UNION ALL
SELECT 
  'product_variants',
  'available_stock',
  'current_stock - reserved_stock',
  COUNT(*),
  ROUND(COALESCE(AVG(available_stock), 0), 2)
FROM public.product_variants;

GRANT SELECT ON v_generated_columns_status TO authenticated;

-- Step 7: Add documentation
COMMENT ON COLUMN public.simple_order_items.total_price_sar IS 'Auto-calculated total (quantity * unit_price) - GENERATED ALWAYS STORED';
COMMENT ON COLUMN public.product_variants.image_urls_array IS 'Explicit text[] array for variant images (converted from jsonb)';
COMMENT ON VIEW v_order_items_unified IS 'Unified view of all order items with common columns';
COMMENT ON VIEW v_unified_order_items IS 'Extended unified view with all ecommerce columns';
COMMENT ON VIEW v_generated_columns_status IS 'Summary of GENERATED columns statistics';