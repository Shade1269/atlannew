-- 1) Add buyer session to ecommerce_orders if not exists
ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS buyer_session_id TEXT;

-- 2) Add missing indexes for store isolation (using correct column names)
CREATE INDEX IF NOT EXISTS idx_ecom_orders_store_custphone ON ecommerce_orders(affiliate_store_id, customer_phone);
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

-- 7) Function to update store customer stats
CREATE OR REPLACE FUNCTION update_store_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update store_customers when order is confirmed
  IF NEW.status = 'CONFIRMED' AND (OLD.status IS NULL OR OLD.status != 'CONFIRMED') THEN
    INSERT INTO store_customers (
      store_id,
      customer_phone,
      customer_email, 
      customer_name,
      total_orders,
      total_spent_sar,
      last_purchase_at
    ) VALUES (
      NEW.affiliate_store_id,
      NEW.customer_phone,
      NEW.customer_email,
      NEW.customer_name,
      1,
      NEW.total_sar,
      NEW.confirmed_at
    )
    ON CONFLICT (store_id, customer_phone) 
    DO UPDATE SET
      total_orders = store_customers.total_orders + 1,
      total_spent_sar = store_customers.total_spent_sar + NEW.total_sar,
      last_purchase_at = NEW.confirmed_at,
      customer_email = COALESCE(NEW.customer_email, store_customers.customer_email),
      customer_name = COALESCE(NEW.customer_name, store_customers.customer_name),
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8) Trigger for store customer stats
DROP TRIGGER IF EXISTS trg_update_store_customer_stats ON ecommerce_orders;
CREATE TRIGGER trg_update_store_customer_stats
  AFTER INSERT OR UPDATE ON ecommerce_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_store_customer_stats();