-- ============================================
-- إصلاح: Function Search Path Mutable على _on_order_item_insert_reserve_inventory
-- Fix: Set search_path for security (Supabase lint)
-- ============================================

CREATE OR REPLACE FUNCTION public._on_order_item_insert_reserve_inventory()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  PERFORM public._reserve_inventory_for_order(NEW.order_id);
  RETURN NEW;
END;
$$;
