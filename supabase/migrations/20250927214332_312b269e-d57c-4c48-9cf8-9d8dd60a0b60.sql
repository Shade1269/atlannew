-- إنشاء سياسة جديدة للمنتجات تدعم كلاً من shops و merchants
CREATE POLICY "Users can manage products through shops" 
ON public.products 
FOR ALL 
USING (
    shop_id IN (
        SELECT s.id 
        FROM shops s 
        JOIN profiles p ON p.id = s.owner_id 
        WHERE p.auth_user_id = auth.uid()
    ) 
    OR merchant_id IN (
        SELECT m.id 
        FROM merchants m 
        JOIN profiles p ON p.id = m.profile_id 
        WHERE p.auth_user_id = auth.uid()
    )
) 
WITH CHECK (
    shop_id IN (
        SELECT s.id 
        FROM shops s 
        JOIN profiles p ON p.id = s.owner_id 
        WHERE p.auth_user_id = auth.uid()
    ) 
    OR merchant_id IN (
        SELECT m.id 
        FROM merchants m 
        JOIN profiles p ON p.id = m.profile_id 
        WHERE p.auth_user_id = auth.uid()
    )
);