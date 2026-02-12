-- Add RLS policies for affiliates to view their orders

-- Policy: Affiliates can view orders from their store
CREATE POLICY "Affiliates can view their store orders"
ON public.ecommerce_orders
FOR SELECT
TO authenticated
USING (
  affiliate_store_id IN (
    SELECT ast.id 
    FROM affiliate_stores ast
    JOIN profiles p ON p.id = ast.profile_id
    WHERE p.auth_user_id = auth.uid()
  )
);

-- Policy: Affiliates can view order items from their store orders
CREATE POLICY "Affiliates can view their store order items"
ON public.ecommerce_order_items
FOR SELECT
TO authenticated
USING (
  order_id IN (
    SELECT eo.id
    FROM ecommerce_orders eo
    JOIN affiliate_stores ast ON ast.id = eo.affiliate_store_id
    JOIN profiles p ON p.id = ast.profile_id
    WHERE p.auth_user_id = auth.uid()
  )
);