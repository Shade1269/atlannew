-- إصلاح مشكلة foreign key في السلة
-- تحديث السلة لتستخدم النظام المبسط بدون foreign key مؤقتاً

ALTER TABLE shopping_carts DROP CONSTRAINT IF EXISTS shopping_carts_user_id_fkey;

-- تحديث السياسات للسماح بالوصول للسلة بناءً على user_id أو session_id
DROP POLICY IF EXISTS "Users can access carts" ON shopping_carts;

CREATE POLICY "Users can access carts" ON shopping_carts
FOR ALL USING (
  (user_id IS NULL AND session_id IS NOT NULL) OR 
  (user_id IS NOT NULL AND auth.uid() IS NOT NULL)
);

-- إضافة بعض المنتجات التجريبية للاختبار
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

-- إضافة متجر تجريبي
INSERT INTO affiliate_stores (
  id,
  profile_id,
  store_name,
  store_slug,
  bio,
  is_active,
  theme,
  created_at
) VALUES (
  '44444444-4444-4444-4444-444444444444',
  (SELECT id FROM user_profiles WHERE auth_user_id = '6714386a-af60-4569-855f-1021f5f82cb8' LIMIT 1),
  'متجر الاختبار',
  'test-store',
  'متجر تجريبي لاختبار النظام',
  true,
  'modern',
  now()
) ON CONFLICT (store_slug) DO UPDATE SET
  store_name = EXCLUDED.store_name,
  bio = EXCLUDED.bio;

-- إضافة المنتجات للمتجر التجريبي
INSERT INTO affiliate_products (
  affiliate_store_id,
  product_id,
  is_visible,
  commission_rate,
  sort_order
) VALUES 
(
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  true,
  10.00,
  1
),
(
  '44444444-4444-4444-4444-444444444444',
  '22222222-2222-2222-2222-222222222222',
  true,
  15.00,
  2
),
(
  '44444444-4444-4444-4444-444444444444',
  '33333333-3333-3333-3333-333333333333',
  true,
  12.00,
  3
) ON CONFLICT (affiliate_store_id, product_id) DO NOTHING;