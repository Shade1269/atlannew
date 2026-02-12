-- إنشاء طلب تجريبي للاختبار
INSERT INTO simple_orders (
  customer_name,
  customer_phone,
  customer_email,
  shipping_address,
  total_amount_sar,
  payment_status,
  payment_method,
  order_status,
  session_id
) VALUES (
  'عميل تجريبي',
  '0512345678',
  'test@example.com',
  '{"address": "شارع الملك فهد", "city": "الرياض", "notes": "طلب تجريبي"}',
  150.00,
  'PENDING',
  'COD',
  'CONFIRMED',
  'test_session_' || extract(epoch from now())
);

-- إضافة عنصر للطلب التجريبي  
INSERT INTO simple_order_items (
  order_id,
  product_id,
  product_title,
  quantity,
  unit_price_sar,
  total_price_sar
) SELECT 
  (SELECT id FROM simple_orders WHERE customer_name = 'عميل تجريبي' ORDER BY created_at DESC LIMIT 1),
  'test-product-id',
  'منتج تجريبي',
  1,
  135.00,
  135.00;