-- -----------------------------------------------------------------------------
-- 02_indexes.sql
-- Performance indexes for Anaqti commerce tables.
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_ecommerce_orders_shop_id
  ON public.ecommerce_orders(shop_id);

CREATE INDEX IF NOT EXISTS idx_ecommerce_orders_affiliate_store_id
  ON public.ecommerce_orders(affiliate_store_id);

CREATE INDEX IF NOT EXISTS idx_ecommerce_orders_created_at
  ON public.ecommerce_orders(created_at);

CREATE INDEX IF NOT EXISTS idx_ecommerce_order_items_order_id
  ON public.ecommerce_order_items(order_id);

CREATE INDEX IF NOT EXISTS idx_commissions_affiliate_id
  ON public.commissions(affiliate_id);

CREATE INDEX IF NOT EXISTS idx_commissions_order_id
  ON public.commissions(order_id);

CREATE INDEX IF NOT EXISTS idx_points_events_affiliate_created
  ON public.points_events(affiliate_id, created_at);
