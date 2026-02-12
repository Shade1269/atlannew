-- إضافة Foreign Keys للجداول

-- 1. ربط customer_otp_sessions بـ affiliate_stores
ALTER TABLE customer_otp_sessions
ADD CONSTRAINT fk_customer_otp_store
FOREIGN KEY (store_id) 
REFERENCES affiliate_stores(id)
ON DELETE CASCADE;

-- 2. ربط customers بـ profiles
ALTER TABLE customers
ADD CONSTRAINT fk_customers_profile
FOREIGN KEY (profile_id)
REFERENCES profiles(id)
ON DELETE CASCADE;

-- 3. ربط store_customers بـ customers
ALTER TABLE store_customers
ADD CONSTRAINT fk_store_customers_customer
FOREIGN KEY (customer_id)
REFERENCES customers(id)
ON DELETE CASCADE;

-- 4. ربط store_customers بـ affiliate_stores
ALTER TABLE store_customers
ADD CONSTRAINT fk_store_customers_store
FOREIGN KEY (store_id)
REFERENCES affiliate_stores(id)
ON DELETE CASCADE;

-- 5. إضافة index لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_customer_otp_phone_store ON customer_otp_sessions(phone, store_id);
CREATE INDEX IF NOT EXISTS idx_customers_profile ON customers(profile_id);
CREATE INDEX IF NOT EXISTS idx_store_customers_lookup ON store_customers(store_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);