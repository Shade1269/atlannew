-- إنشاء متاجر تجريبية للمسوقين الموجودين
INSERT INTO public.affiliate_stores (store_name, store_slug, profile_id, bio, is_active, theme) VALUES 
('متجر نوليسي للأزياء', 'nolici-fashion-store', 'dff5a0ef-9ba0-47a8-883f-deab91b8039d', 'متجر متخصص في الأزياء النسائية العصرية والأنيقة', true, 'classic'),
('متجر ويباكس للإكسسوارات', 'wibax-accessories', '1e13f4d0-dbd2-4e42-a30b-7b8be15c442b', 'أحدث الإكسسوارات والحقائب النسائية', true, 'modern'),
('متجر أحمد زاهر', 'ahmad-zaher-store', '41ac4816-977b-4b91-b4a9-8a8fa1cd7f71', 'منتجات متنوعة للرجال والنساء', true, 'minimal'),
('متجر مرام الأول', 'maram-store-1', '4c75d5dc-7ccf-440f-95a3-c0c6e3dcd38b', 'متجر شامل للأزياء والمستلزمات', true, 'modern'),
('متجر مرام الثاني', 'maram-store-2', '9bd3b2e5-9d95-4f97-879a-b18f4798b5be', 'كولكشن حصري من أجمل القطع', true, 'elegant');

-- إضافة منتجات تجريبية لمتاجر المسوقين
INSERT INTO public.affiliate_products (product_id, affiliate_store_id, is_visible, sort_order) VALUES 
-- متجر نوليسي
('48cde301-79f4-4b39-a24f-9c26ae18fde6', (SELECT id FROM affiliate_stores WHERE store_slug = 'nolici-fashion-store'), true, 1),
('87a8f63f-0122-4b57-ad92-9209b6232560', (SELECT id FROM affiliate_stores WHERE store_slug = 'nolici-fashion-store'), true, 2),
('62c64a5f-2445-4116-89b8-3463eb5c74c4', (SELECT id FROM affiliate_stores WHERE store_slug = 'nolici-fashion-store'), true, 3),

-- متجر ويباكس
('2d0c842c-3ab7-4745-b4f6-58cea32d8c53', (SELECT id FROM affiliate_stores WHERE store_slug = 'wibax-accessories'), true, 1),
('ee6b5386-88e5-409e-97a7-63c2ae334faa', (SELECT id FROM affiliate_stores WHERE store_slug = 'wibax-accessories'), true, 2),

-- متجر أحمد زاهر
('48cde301-79f4-4b39-a24f-9c26ae18fde6', (SELECT id FROM affiliate_stores WHERE store_slug = 'ahmad-zaher-store'), true, 1),
('ee6b5386-88e5-409e-97a7-63c2ae334faa', (SELECT id FROM affiliate_stores WHERE store_slug = 'ahmad-zaher-store'), true, 2),

-- متجر مرام الأول
('87a8f63f-0122-4b57-ad92-9209b6232560', (SELECT id FROM affiliate_stores WHERE store_slug = 'maram-store-1'), true, 1),
('62c64a5f-2445-4116-89b8-3463eb5c74c4', (SELECT id FROM affiliate_stores WHERE store_slug = 'maram-store-1'), true, 2),

-- متجر مرام الثاني
('2d0c842c-3ab7-4745-b4f6-58cea32d8c53', (SELECT id FROM affiliate_stores WHERE store_slug = 'maram-store-2'), true, 1),
('ee6b5386-88e5-409e-97a7-63c2ae334faa', (SELECT id FROM affiliate_stores WHERE store_slug = 'maram-store-2'), true, 2);