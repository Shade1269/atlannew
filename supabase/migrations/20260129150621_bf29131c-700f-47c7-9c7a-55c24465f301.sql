
-- Fix: Cast text to enum types when syncing to ecommerce_orders
CREATE OR REPLACE FUNCTION public.sync_ecommerce_from_order_hub()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_status order_status;
  v_payment_status payment_status;
BEGIN
  -- Only sync if source_order_id exists (linked to ecommerce_orders)
  IF NEW.source = 'ecommerce' AND NEW.source_order_id IS NOT NULL THEN
    -- Safely cast status to enum (handle mapping differences)
    BEGIN
      -- Map CANCELLED -> CANCELED for order_status enum
      IF UPPER(NEW.status) = 'CANCELLED' THEN
        v_order_status := 'CANCELED'::order_status;
      ELSIF UPPER(NEW.status) = 'PROCESSING' THEN
        v_order_status := 'PENDING'::order_status;  -- Processing maps to PENDING
      ELSIF UPPER(NEW.status) = 'COMPLETED' THEN
        v_order_status := 'DELIVERED'::order_status;  -- Completed maps to DELIVERED
      ELSE
        v_order_status := UPPER(NEW.status)::order_status;
      END IF;
    EXCEPTION WHEN invalid_text_representation THEN
      v_order_status := NULL;
    END;
    
    -- Safely cast payment_status to enum
    BEGIN
      v_payment_status := UPPER(NEW.payment_status)::payment_status;
    EXCEPTION WHEN invalid_text_representation THEN
      v_payment_status := NULL;
    END;
    
    -- Only update if we have valid enum values
    IF v_order_status IS NOT NULL OR v_payment_status IS NOT NULL THEN
      UPDATE public.ecommerce_orders
      SET 
        status = COALESCE(v_order_status, status),
        payment_status = COALESCE(v_payment_status, payment_status),
        updated_at = NOW()
      WHERE id = NEW.source_order_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;
