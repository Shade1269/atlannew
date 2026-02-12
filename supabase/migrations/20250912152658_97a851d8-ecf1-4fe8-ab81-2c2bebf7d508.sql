-- إصلاح RLS policies لسلة التسوق
DROP POLICY IF EXISTS "Users can manage their cart items" ON shopping_carts;
DROP POLICY IF EXISTS "Users can create shopping carts" ON shopping_carts;
DROP POLICY IF EXISTS "Users can view their shopping carts" ON shopping_carts;
DROP POLICY IF EXISTS "Users can update their shopping carts" ON shopping_carts;

-- RLS policies جديدة لسلة التسوق
CREATE POLICY "Users can manage their own carts" ON shopping_carts
FOR ALL USING (
  user_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()) OR
  user_id IS NULL OR
  session_id IS NOT NULL
);

CREATE POLICY "Users can create carts" ON shopping_carts
FOR INSERT WITH CHECK (
  user_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()) OR
  user_id IS NULL OR
  session_id IS NOT NULL
);

-- إصلاح RLS policies لعناصر السلة
DROP POLICY IF EXISTS "Users can manage their cart items" ON cart_items;

CREATE POLICY "Users can manage cart items" ON cart_items
FOR ALL USING (
  cart_id IN (
    SELECT id FROM shopping_carts WHERE 
    user_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()) OR
    session_id IS NOT NULL
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

CREATE POLICY "Users can view their orders" ON simple_orders
FOR SELECT USING (
  user_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()) OR
  session_id IS NOT NULL
);

CREATE POLICY "Users can create orders" ON simple_orders
FOR INSERT WITH CHECK (
  user_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()) OR
  session_id IS NOT NULL
);

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

CREATE POLICY "Users can view order items" ON simple_order_items
FOR SELECT USING (
  order_id IN (
    SELECT id FROM simple_orders WHERE 
    user_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()) OR
    session_id IS NOT NULL
  )
);

CREATE POLICY "Users can create order items" ON simple_order_items
FOR INSERT WITH CHECK (
  order_id IN (
    SELECT id FROM simple_orders WHERE 
    user_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()) OR
    session_id IS NOT NULL
  )
);

-- دالة لإنشاء طلب من سلة التسوق
CREATE OR REPLACE FUNCTION create_order_from_cart(
  p_cart_id UUID,
  p_customer_name TEXT,
  p_customer_email TEXT,
  p_customer_phone TEXT,
  p_shipping_address JSONB,
  p_affiliate_store_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_order_id UUID;
  v_total_amount NUMERIC := 0;
  v_cart_item RECORD;
  v_user_id UUID;
  v_session_id TEXT;
  v_commission_rate NUMERIC := 0;
  v_commission_amount NUMERIC := 0;
BEGIN
  -- الحصول على بيانات السلة
  SELECT user_id, session_id INTO v_user_id, v_session_id
  FROM shopping_carts
  WHERE id = p_cart_id;
  
  -- حساب المجموع الكلي
  SELECT COALESCE(SUM(total_price_sar), 0) INTO v_total_amount
  FROM cart_items
  WHERE cart_id = p_cart_id;
  
  -- حساب العمولة إذا كان هناك متجر مسوق
  IF p_affiliate_store_id IS NOT NULL THEN
    -- نسبة عمولة افتراضية 10%
    v_commission_rate := 10.00;
    v_commission_amount := v_total_amount * (v_commission_rate / 100);
  END IF;
  
  -- إنشاء الطلب
  INSERT INTO simple_orders (
    user_id,
    session_id,
    customer_name,
    customer_email,
    customer_phone,
    shipping_address,
    total_amount_sar,
    affiliate_store_id,
    affiliate_commission_sar
  ) VALUES (
    v_user_id,
    v_session_id,
    p_customer_name,
    p_customer_email,
    p_customer_phone,
    p_shipping_address,
    v_total_amount,
    p_affiliate_store_id,
    v_commission_amount
  ) RETURNING id INTO v_order_id;
  
  -- نسخ عناصر السلة إلى الطلب
  FOR v_cart_item IN 
    SELECT ci.*, p.title, p.image_urls
    FROM cart_items ci
    LEFT JOIN products p ON p.id = ci.product_id
    WHERE ci.cart_id = p_cart_id
  LOOP
    INSERT INTO simple_order_items (
      order_id,
      product_id,
      product_title,
      product_image_url,
      quantity,
      unit_price_sar,
      total_price_sar
    ) VALUES (
      v_order_id,
      v_cart_item.product_id,
      COALESCE(v_cart_item.title, 'منتج'),
      COALESCE(v_cart_item.image_urls->0, null),
      v_cart_item.quantity,
      v_cart_item.unit_price_sar,
      v_cart_item.total_price_sar
    );
  END LOOP;
  
  -- حذف السلة بعد إنشاء الطلب
  DELETE FROM cart_items WHERE cart_id = p_cart_id;
  DELETE FROM shopping_carts WHERE id = p_cart_id;
  
  RETURN v_order_id;
END;
$$;