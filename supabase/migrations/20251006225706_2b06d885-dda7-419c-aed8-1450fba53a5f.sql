-- إضافة متغيرات اختبارية لمنتج AS16
INSERT INTO product_variants (product_id, variant_name, size, color, current_stock, selling_price, is_active)
VALUES
  ('0262c7c9-f7d8-451b-a024-c34940a1d4ce', 'مقاس S', 'S', NULL, 10, NULL, true),
  ('0262c7c9-f7d8-451b-a024-c34940a1d4ce', 'مقاس M', 'M', NULL, 15, NULL, true),
  ('0262c7c9-f7d8-451b-a024-c34940a1d4ce', 'مقاس L', 'L', NULL, 0, NULL, true),
  ('0262c7c9-f7d8-451b-a024-c34940a1d4ce', 'لون أحمر', NULL, 'أحمر', 8, NULL, true),
  ('0262c7c9-f7d8-451b-a024-c34940a1d4ce', 'لون أزرق', NULL, 'أزرق', 12, NULL, true),
  ('0262c7c9-f7d8-451b-a024-c34940a1d4ce', 'لون أسود', NULL, 'أسود', 5, NULL, true);