-- Allow public to read shop_id from products in affiliate stores
-- This is needed for checkout flow to work for non-authenticated users

CREATE POLICY "Public can read shop_id from affiliate products"
ON public.products
FOR SELECT
TO public
USING (
  id IN (
    SELECT product_id 
    FROM affiliate_products 
    WHERE is_visible = true
  )
);