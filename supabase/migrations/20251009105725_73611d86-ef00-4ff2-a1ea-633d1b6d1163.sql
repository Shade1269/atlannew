-- ═══════════════════════════════════════════════════════════════
-- STAGE 4 PART 5: ORDER HUB (FINAL CORRECT VERSION)
-- Create central hub with correct column mappings
-- ═══════════════════════════════════════════════════════════════

-- Step 1: Create order_hub table
CREATE TABLE IF NOT EXISTS public.order_hub (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL CHECK (source IN ('ecommerce', 'legacy', 'simple')),
  source_order_id uuid NOT NULL,
  order_number text,
  customer_name text,
  customer_phone text,
  customer_email text,
  total_amount_sar numeric NOT NULL DEFAULT 0,
  status text,
  payment_status text,
  shop_id uuid,
  affiliate_store_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, source_order_id)
);

ALTER TABLE public.order_hub ENABLE ROW LEVEL SECURITY;

-- Step 2: Add indexes
CREATE INDEX IF NOT EXISTS idx_order_hub_order_number ON public.order_hub(order_number);
CREATE INDEX IF NOT EXISTS idx_order_hub_source ON public.order_hub(source);
CREATE INDEX IF NOT EXISTS idx_order_hub_shop_id ON public.order_hub(shop_id) WHERE shop_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_order_hub_affiliate_store_id ON public.order_hub(affiliate_store_id) WHERE affiliate_store_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_order_hub_customer_phone ON public.order_hub(customer_phone) WHERE customer_phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_order_hub_created_at ON public.order_hub(created_at DESC);

-- Step 3: RLS Policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Shop owners can view their orders' AND tablename = 'order_hub') THEN
    CREATE POLICY "Shop owners can view their orders" 
    ON public.order_hub FOR SELECT USING (
      shop_id IN (SELECT s.id FROM shops s JOIN profiles p ON p.id = s.owner_id WHERE p.auth_user_id = auth.uid())
      OR affiliate_store_id IN (SELECT ast.id FROM affiliate_stores ast JOIN profiles p ON p.id = ast.profile_id WHERE p.auth_user_id = auth.uid())
      OR get_current_user_role() = 'admin'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view their own orders by phone' AND tablename = 'order_hub') THEN
    CREATE POLICY "Public can view their own orders by phone" 
    ON public.order_hub FOR SELECT USING (customer_phone = get_current_user_phone());
  END IF;
END $$;

-- Step 4: Backfill from ecommerce_orders
INSERT INTO public.order_hub (source, source_order_id, order_number, customer_name, customer_phone, customer_email, total_amount_sar, status, payment_status, shop_id, affiliate_store_id, created_at, updated_at)
SELECT 'ecommerce', eo.id, eo.order_number, eo.customer_name, eo.customer_phone, eo.customer_email, COALESCE(eo.total_sar, 0), eo.status, eo.payment_status, eo.shop_id, eo.affiliate_store_id, eo.created_at, eo.updated_at
FROM public.ecommerce_orders eo
WHERE NOT EXISTS (SELECT 1 FROM public.order_hub oh WHERE oh.source = 'ecommerce' AND oh.source_order_id = eo.id);

-- Step 5: Backfill from simple_orders
INSERT INTO public.order_hub (source, source_order_id, order_number, customer_name, customer_phone, customer_email, total_amount_sar, status, payment_status, affiliate_store_id, created_at, updated_at)
SELECT 'simple', so.id, so.id::text, so.customer_name, so.customer_phone, so.customer_email, COALESCE(so.total_amount_sar, 0), COALESCE(so.order_status, 'pending'), COALESCE(so.payment_status, 'pending'), so.affiliate_store_id, so.created_at, so.updated_at
FROM public.simple_orders so
WHERE NOT EXISTS (SELECT 1 FROM public.order_hub oh WHERE oh.source = 'simple' AND oh.source_order_id = so.id);

-- Step 6: Backfill from orders (legacy) - CORRECTED COLUMN
INSERT INTO public.order_hub (source, source_order_id, order_number, customer_name, customer_phone, total_amount_sar, status, shop_id, affiliate_store_id, created_at, updated_at)
SELECT 'legacy', o.id, COALESCE(o.order_number, o.id::text), o.customer_name, o.customer_phone, COALESCE(o.total_sar, 0), o.status::text, o.shop_id, o.affiliate_store_id, o.created_at, o.updated_at
FROM public.orders o
WHERE NOT EXISTS (SELECT 1 FROM public.order_hub oh WHERE oh.source = 'legacy' AND oh.source_order_id = o.id);

-- Step 7: Create view
CREATE OR REPLACE VIEW v_order_hub_full AS
SELECT oh.*, COALESCE((SELECT jsonb_agg(jsonb_build_object('product_title', product_title, 'quantity', quantity, 'unit_price', unit_price_sar, 'total', total_price_sar)) FROM public.ecommerce_order_items WHERE order_id = oh.source_order_id AND oh.source = 'ecommerce'), (SELECT jsonb_agg(jsonb_build_object('product_title', product_title, 'quantity', quantity, 'unit_price', unit_price_sar, 'total', total_price_sar)) FROM public.simple_order_items WHERE order_id = oh.source_order_id AND oh.source = 'simple'), '[]'::jsonb) as items
FROM public.order_hub oh;

GRANT SELECT ON v_order_hub_full TO authenticated, anon;

-- Step 8: Sync triggers
CREATE OR REPLACE FUNCTION sync_order_hub_from_ecommerce() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.order_hub (source, source_order_id, order_number, customer_name, customer_phone, customer_email, total_amount_sar, status, payment_status, shop_id, affiliate_store_id, created_at, updated_at)
    VALUES ('ecommerce', NEW.id, NEW.order_number, NEW.customer_name, NEW.customer_phone, NEW.customer_email, COALESCE(NEW.total_sar, 0), NEW.status, NEW.payment_status, NEW.shop_id, NEW.affiliate_store_id, NEW.created_at, NEW.updated_at)
    ON CONFLICT (source, source_order_id) DO NOTHING;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.order_hub SET order_number = NEW.order_number, customer_name = NEW.customer_name, customer_phone = NEW.customer_phone, customer_email = NEW.customer_email, total_amount_sar = COALESCE(NEW.total_sar, 0), status = NEW.status, payment_status = NEW.payment_status, updated_at = NEW.updated_at
    WHERE source = 'ecommerce' AND source_order_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION sync_order_hub_from_simple() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.order_hub (source, source_order_id, order_number, customer_name, customer_phone, customer_email, total_amount_sar, status, payment_status, affiliate_store_id, created_at, updated_at)
    VALUES ('simple', NEW.id, NEW.id::text, NEW.customer_name, NEW.customer_phone, NEW.customer_email, COALESCE(NEW.total_amount_sar, 0), COALESCE(NEW.order_status, 'pending'), COALESCE(NEW.payment_status, 'pending'), NEW.affiliate_store_id, NEW.created_at, NEW.updated_at)
    ON CONFLICT (source, source_order_id) DO NOTHING;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.order_hub SET customer_name = NEW.customer_name, customer_phone = NEW.customer_phone, customer_email = NEW.customer_email, total_amount_sar = COALESCE(NEW.total_amount_sar, 0), status = COALESCE(NEW.order_status, 'pending'), payment_status = COALESCE(NEW.payment_status, 'pending'), updated_at = NEW.updated_at
    WHERE source = 'simple' AND source_order_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_ecommerce_to_hub ON public.ecommerce_orders;
DROP TRIGGER IF EXISTS trg_sync_simple_to_hub ON public.simple_orders;
CREATE TRIGGER trg_sync_ecommerce_to_hub AFTER INSERT OR UPDATE ON public.ecommerce_orders FOR EACH ROW EXECUTE FUNCTION sync_order_hub_from_ecommerce();
CREATE TRIGGER trg_sync_simple_to_hub AFTER INSERT OR UPDATE ON public.simple_orders FOR EACH ROW EXECUTE FUNCTION sync_order_hub_from_simple();

COMMENT ON TABLE public.order_hub IS 'Central hub unifying all order sources (ecommerce, simple, legacy)';