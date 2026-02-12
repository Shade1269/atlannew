-- إضافة policy للسماح للجميع بقراءة المتغيرات النشطة
CREATE POLICY "Public can view active product variants"
ON product_variants_advanced
FOR SELECT
TO public
USING (
  is_active = true 
  AND product_id IN (
    SELECT id FROM products WHERE is_active = true
  )
);