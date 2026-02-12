-- إضافة بيانات بسيطة بدون conflicts

-- حذف البيانات الموجودة أولاً (إذا وجدت)
DELETE FROM public.product_variants;
DELETE FROM public.warehouse_products;
DELETE FROM public.suppliers;

-- إضافة موردين
INSERT INTO public.suppliers (supplier_name, supplier_number, phone, email, address, payment_terms, is_active) VALUES
('شركة التوريدات المتقدمة', 'SUP001', '+966501234567', 'ahmed@advanced-supplies.com', 'الرياض، المملكة العربية السعودية', 'دفع خلال 30 يوم', true),
('مؤسسة الجودة للتجارة', 'SUP002', '+966507654321', 'sara@quality-trade.com', 'جدة، المملكة العربية السعودية', 'دفع عند الاستلام', true),
('مجموعة الشرق للإمدادات', 'SUP003', '+966551122334', 'mohamed@eastern-supplies.sa', 'الدمام، المملكة العربية السعودية', 'دفع خلال 15 يوم', true);

-- إضافة منتجات
INSERT INTO public.warehouse_products (product_name, product_number, description, category, cost_price, selling_price, min_stock_level, max_stock_level, sku, is_active) VALUES
('جهاز لابتوب ديل', 'PROD001', 'لابتوب ديل انسبايرون 15 بوصة', 'أجهزة كمبيوتر', 1850.00, 2299.00, 10, 100, 'LAPTOP-DELL-001', true),
('طابعة HP ليزر', 'PROD002', 'طابعة HP ليزر جيت برو', 'طابعات', 650.00, 899.00, 5, 50, 'PRINTER-HP-002', true),
('شاشة سامسونج 27"', 'PROD003', 'شاشة سامسونج 27 بوصة', 'شاشات', 420.00, 599.00, 15, 80, 'MONITOR-SAM-003', true);

-- إضافة متغيرات المنتجات
INSERT INTO public.product_variants (warehouse_product_id, variant_name, variant_code, sku, size, color, cost_price, selling_price, available_stock, reserved_stock, reorder_level, max_stock_level, location_in_warehouse, is_active) VALUES
((SELECT id FROM public.warehouse_products WHERE product_number = 'PROD001'), 'لابتوب ديل - أسود', 'PROD001-BLACK', 'LAPTOP-001-BLACK', 'قياس واحد', 'أسود', 1850.00, 2299.00, 25, 5, 10, 100, 'A1-B2', true),
((SELECT id FROM public.warehouse_products WHERE product_number = 'PROD001'), 'لابتوب ديل - فضي', 'PROD001-SILVER', 'LAPTOP-001-SILVER', 'قياس واحد', 'فضي', 1850.00, 2299.00, 18, 2, 10, 100, 'A1-B3', true),
((SELECT id FROM public.warehouse_products WHERE product_number = 'PROD002'), 'طابعة HP', 'PROD002-STD', 'PRINTER-002-STD', 'قياس واحد', 'أبيض', 650.00, 899.00, 15, 3, 5, 50, 'A2-C1', true),
((SELECT id FROM public.warehouse_products WHERE product_number = 'PROD003'), 'شاشة سامسونج', 'PROD003-BLACK', 'MONITOR-003-BLACK', '27 بوصة', 'أسود', 420.00, 599.00, 32, 8, 15, 80, 'B1-A3', true);