-- Add is_visible column to product_library table
ALTER TABLE public.product_library 
ADD COLUMN is_visible boolean NOT NULL DEFAULT true;

-- Add index for better performance when filtering visible products
CREATE INDEX IF NOT EXISTS idx_product_library_visible 
ON public.product_library(shop_id, is_visible) 
WHERE is_visible = true;