DROP POLICY IF EXISTS "Merchants can view orders with their products" ON public.ecommerce_orders;
CREATE POLICY "Merchants can view orders with their products" ON public.ecommerce_orders
  FOR SELECT USING (
    id IN (
      SELECT DISTINCT eoi.order_id
      FROM public.ecommerce_order_items eoi
      JOIN public.products p ON eoi.product_id = p.id
      JOIN public.merchants m ON p.merchant_id = m.id
      JOIN public.profiles prof ON m.profile_id = prof.id
      WHERE prof.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Merchants can view their product order items" ON public.ecommerce_order_items;
CREATE POLICY "Merchants can view their product order items" ON public.ecommerce_order_items
  FOR SELECT USING (
    product_id IN (
      SELECT p.id
      FROM public.products p
      JOIN public.merchants m ON p.merchant_id = m.id
      JOIN public.profiles prof ON m.profile_id = prof.id
      WHERE prof.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Merchants can update order status" ON public.ecommerce_orders;
CREATE POLICY "Merchants can update order status" ON public.ecommerce_orders
  FOR UPDATE USING (
    id IN (
      SELECT DISTINCT eoi.order_id
      FROM public.ecommerce_order_items eoi
      JOIN public.products p ON eoi.product_id = p.id
      JOIN public.merchants m ON p.merchant_id = m.id
      JOIN public.profiles prof ON m.profile_id = prof.id
      WHERE prof.auth_user_id = auth.uid()
    )
  );
