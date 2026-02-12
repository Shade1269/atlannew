-- إصلاح مشكلة السلة بشكل مبسط
ALTER TABLE shopping_carts DROP CONSTRAINT IF EXISTS shopping_carts_user_id_fkey;

-- تحديث السياسة
DROP POLICY IF EXISTS "Users can access carts" ON shopping_carts;

CREATE POLICY "Users can access carts" ON shopping_carts
FOR ALL USING (
  (user_id IS NULL AND session_id IS NOT NULL) OR 
  (user_id IS NOT NULL)
);