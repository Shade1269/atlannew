-- ═══════════════════════════════════════════════════════════════
-- STAGE 2 PART 2C: GENERATED COLUMNS & INDEXES
-- Add computed columns for automatic calculations
-- ═══════════════════════════════════════════════════════════════

-- Add Generated Columns for automatic calculations
ALTER TABLE public.cart_items
  ADD COLUMN IF NOT EXISTS total_price_sar_computed numeric
  GENERATED ALWAYS AS (quantity::numeric * unit_price_sar) STORED;

ALTER TABLE public.ecommerce_order_items
  ADD COLUMN IF NOT EXISTS total_price_sar_computed numeric
  GENERATED ALWAYS AS (quantity::numeric * unit_price_sar) STORED;

ALTER TABLE public.simple_order_items
  ADD COLUMN IF NOT EXISTS total_price_sar_computed numeric
  GENERATED ALWAYS AS (quantity::numeric * unit_price_sar) STORED;

ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS available_stock_computed integer
  GENERATED ALWAYS AS (current_stock - reserved_stock) STORED;

-- Add indexes for performance on array columns
CREATE INDEX IF NOT EXISTS idx_products_image_urls 
  ON public.products USING GIN(image_urls);

CREATE INDEX IF NOT EXISTS idx_products_tags
  ON public.products USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_shipping_zones_postal_codes
  ON public.shipping_zones USING GIN(postal_codes);

-- Add helpful comments
COMMENT ON COLUMN public.cart_items.total_price_sar_computed IS 'Auto-calculated: quantity * unit_price_sar';
COMMENT ON COLUMN public.ecommerce_order_items.total_price_sar_computed IS 'Auto-calculated: quantity * unit_price_sar';
COMMENT ON COLUMN public.simple_order_items.total_price_sar_computed IS 'Auto-calculated: quantity * unit_price_sar';
COMMENT ON COLUMN public.product_variants.available_stock_computed IS 'Auto-calculated: current_stock - reserved_stock';

-- Summary comment
COMMENT ON TABLE public.cart_items IS 'Shopping cart items with auto-calculated totals';
COMMENT ON TABLE public.ecommerce_order_items IS 'Order items with auto-calculated totals';
COMMENT ON TABLE public.product_variants IS 'Product variants with auto-calculated available stock';