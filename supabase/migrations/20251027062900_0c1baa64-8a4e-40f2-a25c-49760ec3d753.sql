-- Make user_id nullable in product_activity_log to allow system updates
ALTER TABLE public.product_activity_log 
ALTER COLUMN user_id DROP NOT NULL;

-- Now update existing products with new pricing fields
UPDATE public.products
SET 
  merchant_base_price_sar = ROUND(price_sar / 1.25, 2),
  catalog_price_sar = price_sar
WHERE merchant_base_price_sar IS NULL
  AND price_sar > 0;