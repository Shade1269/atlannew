-- تعبئة order_hub من simple_orders
INSERT INTO public.order_hub (
  source, source_order_id, order_number, customer_name,
  customer_phone, customer_email, total_amount_sar, status, 
  affiliate_store_id, created_at
)
SELECT 
  'simple',
  id,
  id::text,
  customer_name,
  customer_phone,
  customer_email,
  total_amount_sar,
  COALESCE(order_status, 'pending'),
  affiliate_store_id,
  created_at
FROM public.simple_orders
WHERE NOT EXISTS (
  SELECT 1 FROM public.order_hub 
  WHERE source = 'simple' 
  AND source_order_id = simple_orders.id
)
LIMIT 1000;