-- إضافة البيانات التجريبية باستخدام البنية الصحيحة
INSERT INTO public.warehouse_products (product_name, product_number, description, category, cost_price, selling_price, min_stock_level, max_stock_level, sku, is_active) VALUES
('جهاز لابتوب ديل انسبايرون 15', 'PROD001', 'لابتوب ديل انسبايرون 15 بوصة، معالج i5، رام 8 جيجا', 'أجهزة كمبيوتر', 1850.00, 2299.00, 10, 100, 'LAPTOP-DELL-001', true),
('طابعة HP ليزر جيت برو', 'PROD002', 'طابعة HP ليزر جيت برو M404n أبيض وأسود', 'طابعات', 650.00, 899.00, 5, 50, 'PRINTER-HP-002', true),
('شاشة سامسونج 27 بوصة', 'PROD003', 'شاشة سامسونج 27 بوصة Full HD LED', 'شاشات', 420.00, 599.00, 15, 80, 'MONITOR-SAM-003', true),
('كيبورد لوجيتك MX Keys', 'PROD004', 'كيبورد لوجيتك MX Keys لاسلكي متقدم', 'ملحقات', 185.00, 249.00, 20, 150, 'KEYBOARD-LOG-004', true);

-- إضافة متغيرات المنتجات
INSERT INTO public.product_variants (warehouse_product_id, variant_name, color, size, variant_sku, cost_price, selling_price, current_stock, available_stock, reserved_stock, min_stock_level, is_active) VALUES
((SELECT id FROM public.warehouse_products WHERE product_number = 'PROD001'), 'لابتوب ديل - أسود', 'أسود', 'قياس واحد', 'LAPTOP-001-BLACK', 1850.00, 2299.00, 25, 20, 5, 10, true),
((SELECT id FROM public.warehouse_products WHERE product_number = 'PROD001'), 'لابتوب ديل - فضي', 'فضي', 'قياس واحد', 'LAPTOP-001-SILVER', 1850.00, 2299.00, 18, 16, 2, 10, true),
((SELECT id FROM public.warehouse_products WHERE product_number = 'PROD002'), 'طابعة HP ليزر', 'أبيض', 'قياس واحد', 'PRINTER-002-WHITE', 650.00, 899.00, 15, 12, 3, 5, true),
((SELECT id FROM public.warehouse_products WHERE product_number = 'PROD003'), 'شاشة سامسونج 27"', 'أسود', '27 بوصة', 'MONITOR-003-BLACK', 420.00, 599.00, 32, 24, 8, 15, true),
((SELECT id FROM public.warehouse_products WHERE product_number = 'PROD004'), 'كيبورد لوجيتك - أسود', 'أسود', 'قياس واحد', 'KEYBOARD-004-BLACK', 185.00, 249.00, 45, 35, 10, 20, true),
((SELECT id FROM public.warehouse_products WHERE product_number = 'PROD004'), 'كيبورد لوجيتك - أبيض', 'أبيض', 'قياس واحد', 'KEYBOARD-004-WHITE', 185.00, 249.00, 38, 33, 5, 20, true);