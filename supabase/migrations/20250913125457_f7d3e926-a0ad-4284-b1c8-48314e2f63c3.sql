-- إضافة بيانات تجريبية بسيطة باستخدام البنية الحالية

-- إضافة منتجات في warehouse_products
INSERT INTO public.warehouse_products (product_name, product_number, description, category, cost_price, selling_price, min_stock_level, max_stock_level, sku, is_active) VALUES
('جهاز لابتوب ديل انسبايرون 15', 'PROD001', 'لابتوب ديل انسبايرون 15 بوصة، معالج i5، رام 8 جيجا', 'أجهزة كمبيوتر', 1850.00, 2299.00, 10, 100, 'LAPTOP-DELL-INS15', true),
('طابعة HP ليزر جيت برو', 'PROD002', 'طابعة HP ليزر جيت برو M404n أبيض وأسود', 'طابعات', 650.00, 899.00, 5, 50, 'PRINTER-HP-LJ400', true),
('شاشة سامسونج 27 بوصة', 'PROD003', 'شاشة سامسونج 27 بوصة Full HD LED', 'شاشات', 420.00, 599.00, 15, 80, 'MONITOR-SAM-27', true),
('كيبورد لوجيتك لاسلكي', 'PROD004', 'كيبورد لوجيتك MX Keys لاسلكي متقدم', 'ملحقات', 185.00, 249.00, 20, 150, 'KEYBOARD-LOG-MX', true)
ON CONFLICT (sku) DO NOTHING;

-- إضافة متغيرات المنتجات مع الأعمدة الموجودة
INSERT INTO public.product_variants (warehouse_product_id, variant_name, variant_code, sku, size, color, cost_price, selling_price, available_stock, reserved_stock, reorder_level, max_stock_level, location_in_warehouse, is_active) VALUES
((SELECT id FROM public.warehouse_products WHERE sku = 'LAPTOP-DELL-INS15'), 'لابتوب ديل انسبايرون 15 - أسود', 'PROD001-BLACK', 'LAPTOP-DELL-INS15-BLACK', 'قياس واحد', 'أسود', 1850.00, 2299.00, 25, 5, 10, 100, 'A1-B2-S3', true),
((SELECT id FROM public.warehouse_products WHERE sku = 'LAPTOP-DELL-INS15'), 'لابتوب ديل انسبايرون 15 - فضي', 'PROD001-SILVER', 'LAPTOP-DELL-INS15-SILVER', 'قياس واحد', 'فضي', 1850.00, 2299.00, 18, 2, 10, 100, 'A1-B2-S4', true),
((SELECT id FROM public.warehouse_products WHERE sku = 'PRINTER-HP-LJ400'), 'طابعة HP ليزر جيت برو M404n', 'PROD002-STD', 'PRINTER-HP-LJ400-STD', 'قياس واحد', 'أبيض', 650.00, 899.00, 15, 3, 5, 50, 'A2-C1-S1', true),
((SELECT id FROM public.warehouse_products WHERE sku = 'MONITOR-SAM-27'), 'شاشة سامسونج 27 بوصة - أسود', 'PROD003-BLACK', 'MONITOR-SAM-27-BLACK', '27 بوصة', 'أسود', 420.00, 599.00, 32, 8, 15, 80, 'B1-A3-S2', true),
((SELECT id FROM public.warehouse_products WHERE sku = 'KEYBOARD-LOG-MX'), 'كيبورد لوجيتك MX Keys - أسود', 'PROD004-BLACK', 'KEYBOARD-LOG-MX-BLACK', 'قياس واحد', 'أسود', 185.00, 249.00, 45, 10, 20, 150, 'C1-D2-S1', true)
ON CONFLICT (sku) DO NOTHING;