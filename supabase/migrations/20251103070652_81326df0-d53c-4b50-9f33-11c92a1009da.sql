-- إصلاح جميع الـ triggers والـ functions التي تستخدم PAID بدلاً من COMPLETED

-- 1. إصلاح function _mark_order_paid_from_tx
CREATE OR REPLACE FUNCTION public._mark_order_paid_from_tx()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.payment_status = 'COMPLETED' AND NEW.order_id IS NOT NULL THEN
    UPDATE public.ecommerce_orders
    SET payment_status = 'COMPLETED',
        updated_at = NOW()
    WHERE id = NEW.order_id
      AND payment_status <> 'COMPLETED';
  END IF;
  RETURN NEW;
END;
$$;

-- 2. إصلاح function _on_order_paid_generate_commissions
CREATE OR REPLACE FUNCTION public._on_order_paid_generate_commissions()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.payment_status = 'COMPLETED' AND (OLD.payment_status IS DISTINCT FROM NEW.payment_status) THEN
    PERFORM public._generate_commissions_for_order(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- 3. إصلاح function _on_order_paid_grant_points
CREATE OR REPLACE FUNCTION public._on_order_paid_grant_points()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.payment_status = 'COMPLETED' AND (OLD.payment_status IS DISTINCT FROM NEW.payment_status) THEN
    PERFORM public._grant_points_for_paid_order(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- 4. إصلاح function _on_order_payment_update_manage_inventory
CREATE OR REPLACE FUNCTION public._on_order_payment_update_manage_inventory()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.payment_status = 'COMPLETED' AND (OLD.payment_status IS DISTINCT FROM NEW.payment_status) THEN
    PERFORM public._fulfill_inventory_on_paid(NEW.id);
  ELSIF NEW.payment_status IN ('CANCELLED', 'FAILED')
        AND (OLD.payment_status IS DISTINCT FROM NEW.payment_status) THEN
    PERFORM public._release_inventory_on_cancel(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;