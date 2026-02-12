-- إضافة منتجات تجريبية للاختبار
INSERT INTO products (
  id, 
  title, 
  description, 
  price_sar, 
  image_urls, 
  category, 
  is_active, 
  stock,
  created_at
) VALUES 
(
  '11111111-1111-1111-1111-111111111111',
  'جوال سامسونج A54',
  'جوال سامسونج A54 ذاكرة 128 جيجا',
  1200.00,
  '["https://via.placeholder.com/400x400?text=Samsung+A54"]',
  'إلكترونيات',
  true,
  10,
  now()
),
(
  '22222222-2222-2222-2222-222222222222',
  'قميص رجالي كتان',
  'قميص رجالي من الكتان الطبيعي مريح وأنيق',
  85.00,
  '["https://via.placeholder.com/400x400?text=Cotton+Shirt"]',
  'ملابس',
  true,
  25,
  now()
),
(
  '33333333-3333-3333-3333-333333333333',
  'حذاء رياضي نايك',
  'حذاء رياضي نايك للجري مريح وعملي',
  350.00,
  '["https://via.placeholder.com/400x400?text=Nike+Shoes"]',
  'أحذية',
  true,
  15,
  now()
)
ON CONFLICT (id) DO NOTHING;