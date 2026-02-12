-- تحديث سياسات الأمان لجدول shopping_carts للسماح للزوار بإنشاء سلة

-- حذف السياسات القديمة
DROP POLICY IF EXISTS "Secure cart items access" ON shopping_carts;
DROP POLICY IF EXISTS "cart_items_enhanced_access" ON shopping_carts;
DROP POLICY IF EXISTS "cart_items_store_scoped" ON shopping_carts;

-- إنشاء سياسات جديدة للسلة
-- السماح للزوار والمسجلين بقراءة السلة الخاصة بهم
CREATE POLICY "Anyone can read their own cart"
  ON shopping_carts
  FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) 
    OR 
    (session_id IS NOT NULL)
  );

-- السماح للزوار والمسجلين بإنشاء سلة جديدة
CREATE POLICY "Anyone can create cart"
  ON shopping_carts
  FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) 
    OR 
    (session_id IS NOT NULL AND user_id IS NULL)
  );

-- السماح بتحديث السلة
CREATE POLICY "Anyone can update their own cart"
  ON shopping_carts
  FOR UPDATE
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) 
    OR 
    (session_id IS NOT NULL)
  );

-- تحديث سياسات الأمان لجدول cart_items

-- حذف السياسات القديمة
DROP POLICY IF EXISTS "Secure cart items access" ON cart_items;
DROP POLICY IF EXISTS "cart_items_enhanced_access" ON cart_items;
DROP POLICY IF EXISTS "cart_items_store_scoped" ON cart_items;

-- إنشاء سياسات جديدة لعناصر السلة
-- السماح بقراءة عناصر السلة الخاصة بالمستخدم أو الجلسة
CREATE POLICY "Anyone can read their cart items"
  ON cart_items
  FOR SELECT
  USING (
    cart_id IN (
      SELECT id FROM shopping_carts
      WHERE (auth.uid() IS NOT NULL AND user_id = auth.uid())
         OR (session_id IS NOT NULL)
    )
  );

-- السماح بإضافة عناصر للسلة
CREATE POLICY "Anyone can add items to their cart"
  ON cart_items
  FOR INSERT
  WITH CHECK (
    cart_id IN (
      SELECT id FROM shopping_carts
      WHERE (auth.uid() IS NOT NULL AND user_id = auth.uid())
         OR (session_id IS NOT NULL)
    )
  );

-- السماح بتحديث عناصر السلة
CREATE POLICY "Anyone can update their cart items"
  ON cart_items
  FOR UPDATE
  USING (
    cart_id IN (
      SELECT id FROM shopping_carts
      WHERE (auth.uid() IS NOT NULL AND user_id = auth.uid())
         OR (session_id IS NOT NULL)
    )
  );

-- السماح بحذف عناصر السلة
CREATE POLICY "Anyone can delete their cart items"
  ON cart_items
  FOR DELETE
  USING (
    cart_id IN (
      SELECT id FROM shopping_carts
      WHERE (auth.uid() IS NOT NULL AND user_id = auth.uid())
         OR (session_id IS NOT NULL)
    )
  );