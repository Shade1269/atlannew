-- 1) Add buyer session to ecommerce_orders if not exists
ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS buyer_session_id TEXT;

-- 2) Add missing indexes for store isolation
CREATE INDEX IF NOT EXISTS idx_ecom_orders_store_session ON ecommerce_orders(affiliate_store_id, buyer_session_id);
CREATE INDEX IF NOT EXISTS idx_carts_sid_store ON shopping_carts(session_id, affiliate_store_id);
CREATE INDEX IF NOT EXISTS idx_aff_products_store ON affiliate_products(affiliate_store_id, product_id);

-- 3) Create store_customers table for per-store customer tracking
CREATE TABLE IF NOT EXISTS store_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES affiliate_stores(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  customer_phone TEXT,
  customer_email TEXT,
  customer_name TEXT,
  total_orders INTEGER DEFAULT 0,
  total_spent_sar NUMERIC DEFAULT 0,
  last_purchase_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(store_id, customer_phone)
);

-- 4) Add indexes for store_customers
CREATE INDEX IF NOT EXISTS idx_store_customers_store_phone ON store_customers(store_id, customer_phone);

-- 5) Enable RLS on store_customers
ALTER TABLE store_customers ENABLE ROW LEVEL SECURITY;

-- 6) RLS policies for store_customers
CREATE POLICY "Store owners can manage their customers" ON store_customers
FOR ALL USING (
  store_id IN (
    SELECT affiliate_stores.id FROM affiliate_stores
    JOIN profiles ON profiles.id = affiliate_stores.profile_id
    WHERE profiles.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Public can read store customers for orders" ON store_customers
FOR SELECT USING (true);