-- ═══════════════════════════════════════════════════════════════
-- STAGE 2 PART 2C: GENERATED COLUMNS & INDEXES
-- Add computed columns for automatic calculations
-- ═══════════════════════════════════════════════════════════════

-- Step 1: Add Generated Columns for automatic calculations
-- Cart items: total_price_sar_computed
ALTER TABLE public.cart_items
  ADD COLUMN IF NOT EXISTS total_price_sar_computed numeric
  GENERATED ALWAYS AS (quantity::numeric * unit_price_sar) STORED;

-- Ecommerce order items: total_price_sar_computed
ALTER TABLE public.ecommerce_order_items
  ADD COLUMN IF NOT EXISTS total_price_sar_computed numeric
  GENERATED ALWAYS AS (quantity::numeric * unit_price_sar) STORED;

-- Simple order items: total_price_sar_computed  
ALTER TABLE public.simple_order_items
  ADD COLUMN IF NOT EXISTS total_price_sar_computed numeric
  GENERATED ALWAYS AS (quantity::numeric * unit_price_sar) STORED;

-- Product variants: available_stock_computed
ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS available_stock_computed integer
  GENERATED ALWAYS AS (current_stock - reserved_stock) STORED;

-- Step 2: Add GIN indexes for array columns (better search performance)
CREATE INDEX IF NOT EXISTS idx_products_image_urls_gin 
  ON public.products USING GIN(image_urls);

CREATE INDEX IF NOT EXISTS idx_products_tags_gin
  ON public.products USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_shipping_zones_postal_codes_gin
  ON public.shipping_zones USING GIN(postal_codes);

-- Step 3: Add helpful documentation comments
COMMENT ON COLUMN public.cart_items.total_price_sar_computed IS 'Auto-calculated: quantity * unit_price (always in sync)';
COMMENT ON COLUMN public.ecommerce_order_items.total_price_sar_computed IS 'Auto-calculated: quantity * unit_price (always in sync)';
COMMENT ON COLUMN public.simple_order_items.total_price_sar_computed IS 'Auto-calculated: quantity * unit_price (always in sync)';
COMMENT ON COLUMN public.product_variants.available_stock_computed IS 'Auto-calculated: current_stock - reserved_stock (real-time availability)';

-- Step 4: Summary of improvements
COMMENT ON TABLE public.cart_items IS 'Shopping cart items with auto-calculated totals';
COMMENT ON TABLE public.ecommerce_order_items IS 'Order line items with auto-calculated totals';
COMMENT ON TABLE public.product_variants IS 'Product variants with real-time stock availability';