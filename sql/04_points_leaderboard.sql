-- Points pipeline and leaderboard views triggered when ecommerce orders are paid.
-- This script complements the commissions flow by emitting points events per
-- paid order, keeping the logic idempotent, and exposing a monthly leaderboard
-- for alliances with an automatic fallback to individual affiliates.

-- 0) Supporting indexes & uniqueness guarantees for idempotency.
CREATE INDEX IF NOT EXISTS idx_points_events_affiliate_created
  ON public.points_events(affiliate_id, created_at);

CREATE UNIQUE INDEX IF NOT EXISTS uq_points_order_success
  ON public.points_events ((meta->>'order_id'), affiliate_id)
  WHERE type = 'order_success';

CREATE UNIQUE INDEX IF NOT EXISTS uq_points_item_sold
  ON public.points_events ((meta->>'order_item_id'), affiliate_id)
  WHERE type = 'item_sold';

CREATE UNIQUE INDEX IF NOT EXISTS uq_points_new_customer_profile
  ON public.points_events ((meta->>'customer_profile_id'), affiliate_id, (meta->>'shop_id'))
  WHERE type = 'new_customer_signup'
    AND meta ? 'customer_profile_id';

CREATE UNIQUE INDEX IF NOT EXISTS uq_points_new_customer_session
  ON public.points_events ((meta->>'buyer_session_id'), affiliate_id, (meta->>'shop_id'))
  WHERE type = 'new_customer_signup'
    AND meta ? 'buyer_session_id';

-- 1) Grant points for an order that transitioned to PAID (idempotent).
CREATE OR REPLACE FUNCTION public._grant_points_for_paid_order(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_affiliate_id uuid;
  v_customer_profile_id uuid;
  v_buyer_session_id text;
  v_shop_id uuid;
  v_should_grant boolean := false;
  v_meta jsonb;
BEGIN
  -- Resolve affiliate owner + customer identifiers for the order.
  SELECT
    pf.id,
    o.customer_profile_id,
    o.buyer_session_id,
    o.shop_id
  INTO
    v_affiliate_id,
    v_customer_profile_id,
    v_buyer_session_id,
    v_shop_id
  FROM public.ecommerce_orders o
  LEFT JOIN public.affiliate_stores ast ON ast.id = o.affiliate_store_id
  LEFT JOIN public.profiles pf ON pf.id = ast.profile_id
  WHERE o.id = p_order_id;

  IF v_affiliate_id IS NULL THEN
    RETURN;
  END IF;

  -- (a) Order level reward.
  INSERT INTO public.points_events(affiliate_id, type, points, meta, created_at)
  VALUES (
    v_affiliate_id,
    'order_success',
    10,
    jsonb_build_object('order_id', p_order_id, 'shop_id', v_shop_id),
    NOW()
  )
  ON CONFLICT DO NOTHING;

  -- (b) Per item reward.
  INSERT INTO public.points_events(affiliate_id, type, points, meta, created_at)
  SELECT
    v_affiliate_id,
    'item_sold',
    3,
    jsonb_build_object('order_id', p_order_id, 'order_item_id', oi.id, 'shop_id', v_shop_id),
    NOW()
  FROM public.ecommerce_order_items oi
  WHERE oi.order_id = p_order_id
  ON CONFLICT DO NOTHING;

  -- (c) First customer purchase reward.
  IF v_customer_profile_id IS NOT NULL THEN
    SELECT NOT EXISTS (
      SELECT 1
      FROM public.points_events pe
      WHERE pe.affiliate_id = v_affiliate_id
        AND pe.type = 'new_customer_signup'
        AND pe.meta ? 'customer_profile_id'
        AND (pe.meta->>'customer_profile_id')::uuid = v_customer_profile_id
        AND pe.meta->>'shop_id' = v_shop_id::text
    ) INTO v_should_grant;

    IF v_should_grant THEN
      v_meta := jsonb_build_object(
        'order_id', p_order_id,
        'customer_profile_id', v_customer_profile_id,
        'shop_id', v_shop_id
      );

      INSERT INTO public.points_events(affiliate_id, type, points, meta, created_at)
      VALUES (v_affiliate_id, 'new_customer_signup', 15, v_meta, NOW())
      ON CONFLICT DO NOTHING;
    END IF;
  ELSIF v_buyer_session_id IS NOT NULL THEN
    SELECT NOT EXISTS (
      SELECT 1
      FROM public.points_events pe
      WHERE pe.affiliate_id = v_affiliate_id
        AND pe.type = 'new_customer_signup'
        AND pe.meta ? 'buyer_session_id'
        AND pe.meta->>'buyer_session_id' = v_buyer_session_id
        AND pe.meta->>'shop_id' = v_shop_id::text
    ) INTO v_should_grant;

    IF v_should_grant THEN
      v_meta := jsonb_build_object(
        'order_id', p_order_id,
        'buyer_session_id', v_buyer_session_id,
        'shop_id', v_shop_id
      );

      INSERT INTO public.points_events(affiliate_id, type, points, meta, created_at)
      VALUES (v_affiliate_id, 'new_customer_signup', 15, v_meta, NOW())
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
END;
$$;

-- 2) Wire the grant function to the existing payment status trigger chain.
CREATE OR REPLACE FUNCTION public._on_order_paid_grant_points()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.payment_status = 'PAID' AND (OLD.payment_status IS DISTINCT FROM NEW.payment_status) THEN
    PERFORM public._grant_points_for_paid_order(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_paid_grant_points ON public.ecommerce_orders;
CREATE TRIGGER trg_order_paid_grant_points
AFTER UPDATE OF payment_status ON public.ecommerce_orders
FOR EACH ROW
EXECUTE FUNCTION public._on_order_paid_grant_points();

-- 3) Monthly leaderboard views (alliances priority, users fallback).
CREATE OR REPLACE VIEW public.alliances_monthly_leaderboard AS
WITH monthly_points AS (
  SELECT
    a.id AS alliance_id,
    a.name AS alliance_name,
    DATE_TRUNC('month', pe.created_at) AS month_start,
    SUM(pe.points)::int AS total_points,
    COUNT(*)::int AS events_count
  FROM public.alliances a
  JOIN public.alliance_members am ON am.alliance_id = a.id AND am.is_active = true
  JOIN public.points_events pe ON pe.affiliate_id = am.user_id
  WHERE DATE_TRUNC('month', pe.created_at) = DATE_TRUNC('month', NOW())
  GROUP BY a.id, a.name, DATE_TRUNC('month', pe.created_at)
)
SELECT
  alliance_id,
  alliance_name,
  EXTRACT(MONTH FROM month_start)::int AS month_number,
  EXTRACT(YEAR FROM month_start)::int AS year_number,
  total_points,
  events_count,
  CAST(RANK() OVER (ORDER BY total_points DESC, alliance_name ASC) AS int) AS rank
FROM monthly_points
ORDER BY total_points DESC, alliance_name ASC;

CREATE OR REPLACE VIEW public.monthly_leaderboard AS
WITH monthly_points AS (
  SELECT
    pe.affiliate_id AS user_id,
    DATE_TRUNC('month', pe.created_at) AS month_start,
    SUM(pe.points)::int AS points,
    COUNT(*)::int AS events_count
  FROM public.points_events pe
  WHERE DATE_TRUNC('month', pe.created_at) = DATE_TRUNC('month', NOW())
  GROUP BY pe.affiliate_id, DATE_TRUNC('month', pe.created_at)
)
SELECT
  mp.user_id,
  pr.full_name AS profile_name,
  EXTRACT(MONTH FROM mp.month_start)::int AS month_number,
  EXTRACT(YEAR FROM mp.month_start)::int AS year_number,
  mp.points,
  mp.events_count,
  CAST(RANK() OVER (ORDER BY mp.points DESC, pr.full_name ASC NULLS LAST, mp.user_id ASC) AS int) AS rank
FROM monthly_points mp
LEFT JOIN public.profiles pr ON pr.id = mp.user_id
ORDER BY mp.points DESC, pr.full_name ASC NULLS LAST, mp.user_id ASC;
