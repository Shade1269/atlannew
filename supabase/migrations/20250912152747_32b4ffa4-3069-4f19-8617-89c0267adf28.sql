-- حذف السياسات الموجودة بدون IF EXISTS
DO $$ 
BEGIN
  -- حذف السياسات القديمة
  DROP POLICY IF EXISTS "Users can manage their own carts" ON shopping_carts;
  DROP POLICY IF EXISTS "Users can create carts" ON shopping_carts;
  DROP POLICY IF EXISTS "Users can manage cart items" ON cart_items;
EXCEPTION WHEN undefined_object THEN
  -- تجاهل الخطأ إذا كانت السياسة غير موجودة
  NULL;
END $$;

-- إنشاء السياسات الجديدة
CREATE POLICY "Users can access carts" ON shopping_carts
FOR ALL USING (
  auth.uid() IS NOT NULL OR session_id IS NOT NULL
);

CREATE POLICY "Users can access cart items" ON cart_items
FOR ALL USING (
  cart_id IN (
    SELECT id FROM shopping_carts WHERE 
    auth.uid() IS NOT NULL OR session_id IS NOT NULL
  )
);

-- إضافة جدول الطلبات المبسط
CREATE TABLE IF NOT EXISTS simple_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  session_id TEXT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  shipping_address JSONB NOT NULL,
  total_amount_sar NUMERIC NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'PENDING',
  payment_method TEXT,
  stripe_payment_intent_id TEXT,
  order_status TEXT NOT NULL DEFAULT 'PENDING',
  affiliate_store_id UUID REFERENCES affiliate_stores(id),
  affiliate_commission_sar NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS للطلبات
ALTER TABLE simple_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create orders" ON simple_orders
FOR ALL USING (true);

-- إضافة جدول عناصر الطلب
CREATE TABLE IF NOT EXISTS simple_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES simple_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  product_title TEXT NOT NULL,
  product_image_url TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price_sar NUMERIC NOT NULL,
  total_price_sar NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS لعناصر الطلب  
ALTER TABLE simple_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can access order items" ON simple_order_items
FOR ALL USING (true);