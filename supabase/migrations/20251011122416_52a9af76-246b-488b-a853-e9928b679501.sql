-- إضافة صلاحية للزوار لقراءة المنتجات النشطة
DROP POLICY IF EXISTS "anon_can_read_active_products" ON public.products;

CREATE POLICY "anon_can_read_active_products"
ON public.products
FOR SELECT
TO anon, authenticated
USING (is_active = true);