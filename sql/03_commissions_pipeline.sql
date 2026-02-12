-- Commissions pipeline triggered when orders are paid.
-- This script ensures the ecommerce payment flow generates affiliate commissions
-- per order item and rolls the totals back up to ecommerce_orders. It also
-- keeps the logic idempotent so repeated events do not duplicate payouts.

-- 0) Ensure we have a uniqueness guarantee on order_item_id for ON CONFLICT.
DO $$
BEGIN
  ALTER TABLE public.commissions
    ADD CONSTRAINT commissions_order_item_id_key UNIQUE (order_item_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

-- 1) Resolve the commission rate with the required precedence chain.
CREATE OR REPLACE FUNCTION public._resolve_commission_rate(p_order_item_id uuid)
RETURNS numeric
LANGUAGE plpgsql
AS $$
DECLARE
  v_rate numeric;
BEGIN
  -- Priority 1: explicit rate on the order item
  SELECT NULLIF(oi.commission_rate, 0)
    INTO v_rate
  FROM public.ecommerce_order_items oi
  WHERE oi.id = p_order_item_id;

  IF v_rate IS NOT NULL THEN
    RETURN v_rate;
  END IF;

  -- Priority 2: rate defined on the product
  SELECT NULLIF(p.commission_rate, 0)
    INTO v_rate
  FROM public.ecommerce_order_items oi
  JOIN public.products p ON p.id = oi.product_id
  WHERE oi.id = p_order_item_id
  LIMIT 1;

  IF v_rate IS NOT NULL THEN
    RETURN v_rate;
  END IF;

  -- Priority 3: merchant default rate
  SELECT NULLIF(m.default_commission_rate, 0)
    INTO v_rate
  FROM public.ecommerce_order_items oi
  JOIN public.products p ON p.id = oi.product_id
  JOIN public.merchants m ON m.id = p.merchant_id
  WHERE oi.id = p_order_item_id
  LIMIT 1;

  RETURN COALESCE(v_rate, 0);
END;
$$;

-- 2) Generate commissions for a paid order (idempotent upsert per order item).
CREATE OR REPLACE FUNCTION public._generate_commissions_for_order(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_affiliate_id uuid;
BEGIN
  -- Affiliate is derived from the owning profile of the affiliate store (if any).
  SELECT pf.id
    INTO v_affiliate_id
  FROM public.ecommerce_orders o
  LEFT JOIN public.affiliate_stores ast ON ast.id = o.affiliate_store_id
  LEFT JOIN public.profiles pf ON pf.id = ast.profile_id
  WHERE o.id = p_order_id;

  INSERT INTO public.commissions (
    order_id,
    order_item_id,
    affiliate_id,
    affiliate_profile_id,
    commission_rate,
    amount_sar,
    status,
    created_at,
    updated_at
  )
  SELECT
    oi.order_id,
    oi.id AS order_item_id,
    v_affiliate_id AS affiliate_id,
    v_affiliate_id AS affiliate_profile_id,
    rate_data.rate AS commission_rate,
    ROUND(oi.total_price_sar * (rate_data.rate / 100.0), 2) AS amount_sar,
    'PENDING'::text AS status,
    NOW(),
    NOW()
  FROM public.ecommerce_order_items oi
  CROSS JOIN LATERAL (
    SELECT GREATEST(public._resolve_commission_rate(oi.id), 0) AS rate
  ) AS rate_data
  WHERE oi.order_id = p_order_id
  ON CONFLICT (order_item_id)
  DO UPDATE SET
    commission_rate = EXCLUDED.commission_rate,
    amount_sar = EXCLUDED.amount_sar,
    affiliate_id = COALESCE(EXCLUDED.affiliate_id, public.commissions.affiliate_id),
    affiliate_profile_id = COALESCE(EXCLUDED.affiliate_profile_id, public.commissions.affiliate_profile_id),
    updated_at = NOW();

  UPDATE public.ecommerce_orders o
  SET affiliate_commission_sar = COALESCE((
        SELECT SUM(c.amount_sar) FROM public.commissions c WHERE c.order_id = o.id
      ), 0),
      updated_at = NOW()
  WHERE o.id = p_order_id;
END;
$$;

-- 3) When a payment transaction completes, mark the parent order as PAID.
CREATE OR REPLACE FUNCTION public._mark_order_paid_from_tx()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.payment_status = 'COMPLETED' AND NEW.order_id IS NOT NULL THEN
    UPDATE public.ecommerce_orders
    SET payment_status = 'PAID',
        updated_at = NOW()
    WHERE id = NEW.order_id
      AND payment_status <> 'PAID';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tx_to_order_paid ON public.ecommerce_payment_transactions;
CREATE TRIGGER trg_tx_to_order_paid
AFTER INSERT OR UPDATE OF payment_status ON public.ecommerce_payment_transactions
FOR EACH ROW
EXECUTE FUNCTION public._mark_order_paid_from_tx();

-- 4) Once an order transitions to PAID, generate/update its commissions.
CREATE OR REPLACE FUNCTION public._on_order_paid_generate_commissions()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.payment_status = 'PAID' AND (OLD.payment_status IS DISTINCT FROM NEW.payment_status) THEN
    PERFORM public._generate_commissions_for_order(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_paid_generate_commissions ON public.ecommerce_orders;
CREATE TRIGGER trg_order_paid_generate_commissions
AFTER UPDATE OF payment_status ON public.ecommerce_orders
FOR EACH ROW
EXECUTE FUNCTION public._on_order_paid_generate_commissions();
