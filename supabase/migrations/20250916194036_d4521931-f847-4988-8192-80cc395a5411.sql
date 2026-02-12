-- إضافة منتجات لمتجر ssaassaa للاختبار
INSERT INTO affiliate_products (affiliate_store_id, product_id, is_visible, sort_order)
VALUES 
('8b2e1cbe-0489-47d6-8dde-ae819d0f2f99', '48cde301-79f4-4b39-a24f-9c26ae18fde6', true, 1),
('8b2e1cbe-0489-47d6-8dde-ae819d0f2f99', '87a8f63f-0122-4b57-ad92-9209b6232560', true, 2),
('8b2e1cbe-0489-47d6-8dde-ae819d0f2f99', '62c64a5f-2445-4116-89b8-3463eb5c74c4', true, 3)
ON CONFLICT (affiliate_store_id, product_id) DO NOTHING;