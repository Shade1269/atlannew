-- Stage 4: Public order creation RLS policies

-- Allow public reading of active affiliate stores
CREATE POLICY "public_read_active_affiliate_stores" ON public.affiliate_stores
  FOR SELECT USING (is_active = true);

-- Allow public reading of visible affiliate products with products data  
CREATE POLICY "public_read_visible_affiliate_products" ON public.affiliate_products
  FOR SELECT USING (is_visible = true);

-- Allow public reading of products referenced by affiliate products
CREATE POLICY "public_read_products_for_storefront" ON public.products
  FOR SELECT USING (
    id IN (
      SELECT product_id FROM affiliate_products 
      WHERE is_visible = true
    )
  );

-- Allow public order creation with affiliate store validation
CREATE POLICY "public_create_affiliate_orders" ON public.orders
  FOR INSERT 
  WITH CHECK (
    affiliate_store_id IS NOT NULL 
    AND affiliate_store_id IN (
      SELECT id FROM affiliate_stores WHERE is_active = true
    )
  );

-- Allow public order items creation for valid orders
CREATE POLICY "public_create_order_items_for_affiliate_orders" ON public.order_items
  FOR INSERT 
  WITH CHECK (
    order_id IN (
      SELECT id FROM orders WHERE affiliate_store_id IS NOT NULL
    )
  );

-- Allow public reading of order items for affiliate orders (for confirmation)
CREATE POLICY "public_read_order_items_for_affiliate_orders" ON public.order_items
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders WHERE affiliate_store_id IS NOT NULL
    )
  );

-- Allow public reading of orders for confirmation (limited data)
CREATE POLICY "public_read_affiliate_orders_limited" ON public.orders
  FOR SELECT USING (
    affiliate_store_id IS NOT NULL
    AND affiliate_store_id IN (
      SELECT id FROM affiliate_stores WHERE is_active = true
    )
  );