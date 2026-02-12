-- ========================================
-- المرحلة 2: إنشاء order_hub - نسخة مبسطة جداً
-- ========================================

-- 1) ENUM types
DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'PENDING','CONFIRMED','PROCESSING','SHIPPED',
    'DELIVERED','CANCELLED','REFUNDED','RETURNED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM (
    'PENDING','PAID','FAILED','REFUNDED','PARTIALLY_REFUNDED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE shipping_method AS ENUM (
    'STANDARD','EXPRESS','OVERNIGHT','PICKUP'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) جدول order_hub فقط
CREATE TABLE IF NOT EXISTS public.order_hub (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL CHECK (source IN ('ecommerce','legacy','simple')),
  source_order_id uuid NOT NULL,
  order_number text,
  customer_name text,
  total_amount_sar numeric,
  status text,
  affiliate_store_id uuid,
  shop_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, source_order_id)
);

-- فهرس بسيط
CREATE INDEX IF NOT EXISTS idx_order_hub_source_order 
  ON public.order_hub(source, source_order_id);