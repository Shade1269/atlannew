
-- Fix: Use correct column name (source_order_id instead of source_id)
CREATE OR REPLACE FUNCTION public.sync_ecommerce_from_order_hub()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only sync if source_order_id exists (linked to ecommerce_orders)
  IF NEW.source = 'ecommerce' AND NEW.source_order_id IS NOT NULL THEN
    UPDATE public.ecommerce_orders
    SET 
      status = NEW.status,
      payment_status = NEW.payment_status,
      updated_at = NOW()
    WHERE id = NEW.source_order_id
      AND (status IS DISTINCT FROM NEW.status OR payment_status IS DISTINCT FROM NEW.payment_status);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS trg_sync_ecommerce_from_hub ON public.order_hub;
CREATE TRIGGER trg_sync_ecommerce_from_hub
AFTER UPDATE OF status, payment_status ON public.order_hub
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status OR OLD.payment_status IS DISTINCT FROM NEW.payment_status)
EXECUTE FUNCTION public.sync_ecommerce_from_order_hub();
