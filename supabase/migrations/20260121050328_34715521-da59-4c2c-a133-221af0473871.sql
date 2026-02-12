-- إصلاح شامل لنظام المخزون

-- 1. إصلاح الدالة الرئيسية لتستخدم الأعمدة الصحيحة
CREATE OR REPLACE FUNCTION public._fulfill_inventory_on_paid(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rec RECORD;
  v_variant uuid;
  v_warehouse_product_id uuid;
  v_reserved_before numeric;
  v_available_before numeric;
  v_current_before numeric;
  v_reserved_after numeric;
  v_current_after numeric;
  v_available_after numeric;
  v_movement_number text;
BEGIN
  IF p_order_id IS NULL THEN
    RETURN;
  END IF;

  FOR v_rec IN
    SELECT *
    FROM public.inventory_reservations
    WHERE reservation_type = 'ORDER'
      AND reserved_for = p_order_id::text
      AND status IN ('ACTIVE', 'PENDING')
  LOOP
    IF v_rec.inventory_item_id IS NULL THEN
      CONTINUE;
    END IF;

    -- Get variant from inventory item
    SELECT product_variant_id
      INTO v_variant
    FROM public.inventory_items
    WHERE id = v_rec.inventory_item_id
    FOR UPDATE;

    -- Update inventory_items
    UPDATE public.inventory_items
    SET quantity_reserved = GREATEST(COALESCE(quantity_reserved, 0) - v_rec.quantity_reserved, 0),
        updated_at = NOW()
    WHERE id = v_rec.inventory_item_id;

    -- Update product_variants if exists
    IF v_variant IS NOT NULL THEN
      SELECT
        COALESCE(reserved_stock, 0),
        COALESCE(available_stock, current_stock),
        COALESCE(current_stock, 0)
        INTO v_reserved_before, v_available_before, v_current_before
      FROM public.product_variants
      WHERE id = v_variant
      FOR UPDATE;

      v_reserved_after := GREATEST(v_reserved_before - v_rec.quantity_reserved, 0);
      v_current_after := GREATEST(v_current_before - v_rec.quantity_reserved, 0);
      v_available_after := GREATEST(v_current_after - v_reserved_after, 0);

      UPDATE public.product_variants
      SET reserved_stock = v_reserved_after,
          current_stock = v_current_after,
          available_stock = v_available_after,
          updated_at = NOW()
      WHERE id = v_variant;

      -- Get warehouse_product_id from variant
      SELECT warehouse_product_id INTO v_warehouse_product_id
      FROM public.product_variants
      WHERE id = v_variant;
    END IF;

    -- Create movement with CORRECT columns
    v_movement_number := 'OUT-' || v_rec.id;

    INSERT INTO public.inventory_movements (
      movement_number,
      movement_type,
      warehouse_product_id,
      product_variant_id,
      quantity,
      reference_type,
      reference_id,
      created_by,
      created_at,
      notes
    )
    VALUES (
      v_movement_number,
      'OUT',
      v_warehouse_product_id,
      v_variant,
      v_rec.quantity_reserved,
      'ORDER',
      p_order_id,
      NULL,
      NOW(),
      'Auto fulfillment for paid order'
    )
    ON CONFLICT (movement_number) DO NOTHING;

    -- Mark reservation as fulfilled
    UPDATE public.inventory_reservations
    SET status = 'FULFILLED',
        updated_at = NOW()
    WHERE id = v_rec.id;
  END LOOP;
END;
$$;

-- 2. إصلاح دالة الـ Trigger لتستدعي الدالة الصحيحة
CREATE OR REPLACE FUNCTION public._fulfill_inventory_on_paid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only process when payment_status changes to 'PAID'
  IF NEW.payment_status = 'PAID' AND (OLD.payment_status IS DISTINCT FROM 'PAID') THEN
    -- Call the correct parameterized function
    PERFORM public._fulfill_inventory_on_paid(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- 3. إعادة إنشاء الـ Trigger بشكل نظيف
DROP TRIGGER IF EXISTS trg_fulfill_inventory_on_paid ON public.ecommerce_orders;
CREATE TRIGGER trg_fulfill_inventory_on_paid
  AFTER UPDATE OF payment_status ON public.ecommerce_orders
  FOR EACH ROW
  EXECUTE FUNCTION public._fulfill_inventory_on_paid();