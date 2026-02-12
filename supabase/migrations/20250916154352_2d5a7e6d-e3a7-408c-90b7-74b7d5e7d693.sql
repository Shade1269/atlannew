-- إضافة فهارس للأداء وضبط RLS للصفحات العامة

-- التأكد من وجود الفهارس المطلوبة للأداء
CREATE INDEX IF NOT EXISTS idx_customer_otp_sessions_phone_store 
ON customer_otp_sessions(phone, store_id, expires_at);

CREATE INDEX IF NOT EXISTS idx_ecommerce_orders_affiliate_phone 
ON ecommerce_orders(affiliate_store_id, customer_phone, created_at);

-- تحديث RLS policies للوصول العام المحدود
DROP POLICY IF EXISTS "Public can access storefront data" ON affiliate_stores;
CREATE POLICY "Public can access active stores" 
ON affiliate_stores FOR SELECT 
USING (is_active = true);

DROP POLICY IF EXISTS "Public can access storefront products" ON affiliate_products;
CREATE POLICY "Public can access visible products" 
ON affiliate_products FOR SELECT 
USING (is_visible = true);

-- السماح للعمليات العامة بالوصول للسلة والطلبات
DROP POLICY IF EXISTS "Public cart access" ON shopping_carts;
CREATE POLICY "Public session cart access" 
ON shopping_carts FOR ALL
USING (
  session_id IS NOT NULL 
  AND affiliate_store_id IS NOT NULL
);

DROP POLICY IF EXISTS "Public cart items access" ON cart_items;  
CREATE POLICY "Public cart items access" 
ON cart_items FOR ALL
USING (
  cart_id IN (
    SELECT id FROM shopping_carts 
    WHERE session_id IS NOT NULL 
    AND affiliate_store_id IS NOT NULL
  )
);

-- السماح بإنشاء الطلبات العامة
DROP POLICY IF EXISTS "Public order creation" ON ecommerce_orders;
CREATE POLICY "Public order creation" 
ON ecommerce_orders FOR INSERT
WITH CHECK (
  affiliate_store_id IS NOT NULL 
  AND customer_phone IS NOT NULL
);

DROP POLICY IF EXISTS "Public order items creation" ON ecommerce_order_items;
CREATE POLICY "Public order items creation" 
ON ecommerce_order_items FOR INSERT
WITH CHECK (
  order_id IN (
    SELECT id FROM ecommerce_orders 
    WHERE affiliate_store_id IS NOT NULL
  )
);