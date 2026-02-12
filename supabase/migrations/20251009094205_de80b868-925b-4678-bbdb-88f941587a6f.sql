-- تعبئة order_hub من ecommerce_orders فقط
INSERT INTO public.order_hub (
  source, source_order_id, order_number, customer_name, 
  customer_phone, customer_email, total_amount_sar, status, 
  affiliate_store_id, created_at
)
SELECT 
  'ecommerce',
  id,
  order_number,
  customer_name,
  customer_phone,
  customer_email,
  total_sar,
  status::text,
  affiliate_store_id,
  created_at
FROM public.ecommerce_orders
WHERE NOT EXISTS (
  SELECT 1 FROM public.order_hub 
  WHERE source = 'ecommerce' 
  AND source_order_id = ecommerce_orders.id
)
LIMIT 1000;