-- ============================================
-- Script to update existing products with new pricing fields
-- ============================================

-- Update existing products that don't have merchant_base_price_sar set
-- Assuming the old price_sar was the catalog price (merchant base + 25%)
-- So merchant_base_price_sar = price_sar / 1.25

UPDATE public.products
SET 
  merchant_base_price_sar = ROUND(price_sar / 1.25, 2),
  catalog_price_sar = price_sar
WHERE merchant_base_price_sar IS NULL
  AND price_sar > 0;

-- Show results
SELECT 
  COUNT(*) as total_products_updated,
  AVG(merchant_base_price_sar) as avg_merchant_base_price,
  AVG(catalog_price_sar) as avg_catalog_price
FROM public.products
WHERE merchant_base_price_sar IS NOT NULL;

-- Optional: Show sample of updated products
SELECT 
  id,
  title,
  merchant_base_price_sar,
  catalog_price_sar,
  price_sar
FROM public.products
WHERE merchant_base_price_sar IS NOT NULL
LIMIT 10;
