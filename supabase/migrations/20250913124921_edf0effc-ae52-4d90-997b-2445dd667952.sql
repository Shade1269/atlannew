-- إدخال بيانات تجريبية لنظام إدارة المخازن

-- إضافة مخازن تجريبية
INSERT INTO public.warehouses (name, code, address, city, manager_name, storage_capacity, is_active) VALUES
('المخزن الرئيسي', 'WH001', 'حي الملك فهد، شارع الأمير سلطان', 'الرياض', 'أحمد محمد العلي', 5000, true),
('مخزن جدة الفرعي', 'WH002', 'حي الفيحاء، طريق الملك عبد العزيز', 'جدة', 'سارة أحمد الزهراني', 3000, true),
('مخزن الدمام', 'WH003', 'حي النور، شارع الخليج', 'الدمام', 'خالد سعد المطيري', 2000, true);

-- إضافة موردين تجريبيين
INSERT INTO public.suppliers (supplier_name, supplier_code, contact_person, phone, email, address, city, payment_terms, tax_number, is_active) VALUES
('شركة التوريدات المتقدمة المحدودة', 'SUP001', 'أحمد محمد العبدالله', '+966501234567', 'ahmed@advanced-supplies.com', 'حي العليا، الرياض 12211', 'الرياض', 'دفع خلال 30 يوم من تاريخ الفاتورة', '300123456700003', true),
('مؤسسة الجودة للتجارة والمقاولات', 'SUP002', 'سارة أحمد الزهراني', '+966507654321', 'sara@quality-trade.com', 'حي الحمراء، جدة 21422', 'جدة', 'دفع عند الاستلام', '301987654300003', true),
('مجموعة الشرق للإمدادات', 'SUP003', 'محمد علي الأحمد', '+966551122334', 'mohamed@eastern-supplies.sa', 'حي الشاطئ، الدمام 31411', 'الدمام', 'دفع خلال 15 يوم', '302456789100003', true);

-- إضافة منتجات المخزن
INSERT INTO public.warehouse_products (warehouse_id, supplier_id, product_name, product_code, sku, description, category, brand, is_active) VALUES
((SELECT id FROM public.warehouses WHERE code = 'WH001'), (SELECT id FROM public.suppliers WHERE supplier_code = 'SUP001'), 'جهاز لابتوب ديل انسبايرون 15', 'PROD001', 'LAPTOP-DELL-INS15', 'لابتوب ديل انسبايرون 15 بوصة، معالج i5، رام 8 جيجا، هارد SSD 256 جيجا', 'أجهزة كمبيوتر', 'Dell', true),
((SELECT id FROM public.warehouses WHERE code = 'WH001'), (SELECT id FROM public.suppliers WHERE supplier_code = 'SUP002'), 'طابعة HP ليزر جيت برو', 'PROD002', 'PRINTER-HP-LJ400', 'طابعة HP ليزر جيت برو M404n أبيض وأسود', 'طابعات', 'HP', true),
((SELECT id FROM public.warehouses WHERE code = 'WH002'), (SELECT id FROM public.suppliers WHERE supplier_code = 'SUP001'), 'شاشة سامسونج 27 بوصة', 'PROD003', 'MONITOR-SAM-27', 'شاشة سامسونج 27 بوصة Full HD LED', 'شاشات', 'Samsung', true),
((SELECT id FROM public.warehouses WHERE code = 'WH002'), (SELECT id FROM public.suppliers WHERE supplier_code = 'SUP003'), 'كيبورد لوجيتك لاسلكي', 'PROD004', 'KEYBOARD-LOG-MX', 'كيبورد لوجيتك MX Keys لاسلكي متقدم', 'ملحقات', 'Logitech', true);

-- إضافة متغيرات المنتجات
INSERT INTO public.product_variants (warehouse_product_id, variant_name, variant_code, sku, size, color, cost_price, selling_price, available_stock, reserved_stock, reorder_level, max_stock_level, location_in_warehouse, is_active) VALUES
((SELECT id FROM public.warehouse_products WHERE sku = 'LAPTOP-DELL-INS15'), 'لابتوب ديل انسبايرون 15 - أسود', 'PROD001-BLACK', 'LAPTOP-DELL-INS15-BLACK', 'قياس واحد', 'أسود', 1850.00, 2299.00, 25, 5, 10, 100, 'A1-B2-S3', true),
((SELECT id FROM public.warehouse_products WHERE sku = 'LAPTOP-DELL-INS15'), 'لابتوب ديل انسبايرون 15 - فضي', 'PROD001-SILVER', 'LAPTOP-DELL-INS15-SILVER', 'قياس واحد', 'فضي', 1850.00, 2299.00, 18, 2, 10, 100, 'A1-B2-S4', true),
((SELECT id FROM public.warehouse_products WHERE sku = 'PRINTER-HP-LJ400'), 'طابعة HP ليزر جيت برو M404n', 'PROD002-STD', 'PRINTER-HP-LJ400-STD', 'قياس واحد', 'أبيض', 650.00, 899.00, 15, 3, 5, 50, 'A2-C1-S1', true),
((SELECT id FROM public.warehouse_products WHERE sku = 'MONITOR-SAM-27'), 'شاشة سامسونج 27 بوصة - أسود', 'PROD003-BLACK', 'MONITOR-SAM-27-BLACK', '27 بوصة', 'أسود', 420.00, 599.00, 32, 8, 15, 80, 'B1-A3-S2', true),
((SELECT id FROM public.warehouse_products WHERE sku = 'KEYBOARD-LOG-MX'), 'كيبورد لوجيتك MX Keys - أسود', 'PROD004-BLACK', 'KEYBOARD-LOG-MX-BLACK', 'قياس واحد', 'أسود', 185.00, 249.00, 45, 10, 20, 150, 'C1-D2-S1', true),
((SELECT id FROM public.warehouse_products WHERE sku = 'KEYBOARD-LOG-MX'), 'كيبورد لوجيتك MX Keys - أبيض', 'PROD004-WHITE', 'KEYBOARD-LOG-MX-WHITE', 'قياس واحد', 'أبيض', 185.00, 249.00, 38, 5, 20, 150, 'C1-D2-S2', true);

-- إضافة عناصر المخزون (ربط المنتجات بالمخازن)
INSERT INTO public.inventory_items (warehouse_id, product_variant_id, sku, quantity_available, quantity_reserved, reorder_level, unit_cost, location) 
SELECT 
  wp.warehouse_id,
  pv.id,
  pv.sku,
  pv.available_stock,
  pv.reserved_stock,
  pv.reorder_level,
  pv.cost_price,
  pv.location_in_warehouse
FROM public.product_variants pv
JOIN public.warehouse_products wp ON wp.id = pv.warehouse_product_id;

-- إضافة حركات مخزون تجريبية
INSERT INTO public.inventory_movements (warehouse_id, inventory_item_id, movement_type, quantity, unit_cost, total_value, reference_number, reason, notes) 
SELECT 
  ii.warehouse_id,
  ii.id,
  'IN',
  50,
  ii.unit_cost,
  50 * ii.unit_cost,
  'PO-2024-' || LPAD((ROW_NUMBER() OVER())::text, 3, '0'),
  'استلام شحنة جديدة من المورد',
  'شحنة أولية لبدء المخزون'
FROM public.inventory_items ii
LIMIT 6;

-- إضافة بعض الحركات الصادرة
INSERT INTO public.inventory_movements (warehouse_id, inventory_item_id, movement_type, quantity, unit_cost, total_value, reference_number, reason, notes)
SELECT 
  ii.warehouse_id,
  ii.id,
  'OUT',
  -(5 + (ROW_NUMBER() OVER()) % 10),
  ii.unit_cost,
  -(5 + (ROW_NUMBER() OVER()) % 10) * ii.unit_cost,
  'SO-2024-' || LPAD((ROW_NUMBER() OVER())::text, 3, '0'),
  'بيع للعملاء',
  'مبيعات عادية'
FROM public.inventory_items ii
WHERE ii.quantity_available > 20;

-- إضافة تنبيهات للمخزون المنخفض
INSERT INTO public.inventory_alerts (warehouse_id, inventory_item_id, alert_type, priority, title, message, is_read)
SELECT 
  ii.warehouse_id,
  ii.id,
  'LOW_STOCK',
  CASE 
    WHEN ii.quantity_available <= 5 THEN 'CRITICAL'
    WHEN ii.quantity_available <= 10 THEN 'HIGH'
    ELSE 'MEDIUM'
  END,
  'تنبيه مخزون منخفض - ' || pv.variant_name,
  'المخزون الحالي (' || ii.quantity_available || ') أقل من نقطة إعادة الطلب (' || ii.reorder_level || ')',
  false
FROM public.inventory_items ii
JOIN public.product_variants pv ON pv.id = ii.product_variant_id
WHERE ii.quantity_available <= ii.reorder_level AND ii.reorder_level > 0;

-- إضافة حجوزات نشطة
INSERT INTO public.inventory_reservations (warehouse_id, inventory_item_id, quantity_reserved, reserved_for, reservation_type, expires_at, status, notes)
SELECT 
  ii.warehouse_id,
  ii.id,
  ii.quantity_reserved,
  'ORDER-2024-' || LPAD((ROW_NUMBER() OVER())::text, 4, '0'),
  'ORDER',
  NOW() + INTERVAL '7 days',
  'ACTIVE',
  'حجز لطلب عميل'
FROM public.inventory_items ii
WHERE ii.quantity_reserved > 0;