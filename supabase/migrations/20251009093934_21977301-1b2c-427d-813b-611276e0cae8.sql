-- حذف وإعادة إنشاء order_hub بشكل صحيح
DROP TABLE IF EXISTS public.order_hub CASCADE;

-- إنشاء ENUM types  
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

-- إنشاء جدول order_hub
CREATE TABLE public.order_hub (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL CHECK (source IN ('ecommerce','legacy','simple')),
  source_order_id uuid NOT NULL,
  order_number text,
  customer_name text,
  customer_phone text,
  customer_email text,
  shipping_address jsonb,
  total_amount_sar numeric,
  status text,
  payment_status text,
  affiliate_store_id uuid,
  shop_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, source_order_id)
);

-- فهارس order_hub
CREATE INDEX idx_order_hub_order_number ON public.order_hub(order_number);
CREATE INDEX idx_order_hub_created_at ON public.order_hub(created_at DESC);
CREATE INDEX idx_order_hub_affiliate_store ON public.order_hub(affiliate_store_id) WHERE affiliate_store_id IS NOT NULL;
CREATE INDEX idx_order_hub_shop ON public.order_hub(shop_id) WHERE shop_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.order_hub ENABLE ROW LEVEL SECURITY;

-- RLS: المسؤولون يرون كل شيء
CREATE POLICY "Admins can view all orders"
  ON public.order_hub FOR SELECT
  USING (get_current_user_role() = 'admin');

-- RLS: الأفلييت يرون طلباتهم
CREATE POLICY "Affiliates can view their orders"
  ON public.order_hub FOR SELECT
  USING (
    affiliate_store_id IN (
      SELECT ast.id FROM public.affiliate_stores ast
      JOIN public.profiles p ON p.id = ast.profile_id
      WHERE p.auth_user_id = auth.uid()
    )
  );

-- RLS: التجار يرون طلبات متاجرهم
CREATE POLICY "Merchants can view their shop orders"
  ON public.order_hub FOR SELECT
  USING (
    shop_id IN (
      SELECT s.id FROM public.shops s
      JOIN public.profiles p ON p.id = s.owner_id
      WHERE p.auth_user_id = auth.uid()
    )
  );