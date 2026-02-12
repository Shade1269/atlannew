
-- Fix the _resolve_inventory_item_for_order_item to return TABLE with proper columns
-- The _reserve_inventory_for_order function expects columns: inventory_item_id, warehouse_id

DROP FUNCTION IF EXISTS public._resolve_inventory_item_for_order_item(uuid);

CREATE OR REPLACE FUNCTION public._resolve_inventory_item_for_order_item(p_order_item_id uuid)
RETURNS TABLE(inventory_item_id uuid, warehouse_id uuid) AS $$
DECLARE
  v_product_id uuid;
  v_product_sku text;
BEGIN
  -- Get product info from order item
  SELECT oi.product_id, p.sku
  INTO v_product_id, v_product_sku
  FROM ecommerce_order_items oi
  LEFT JOIN products p ON p.id = oi.product_id
  WHERE oi.id = p_order_item_id;
  
  -- Return inventory item with warehouse
  RETURN QUERY
  SELECT ii.id AS inventory_item_id, ii.warehouse_id
  FROM inventory_items ii
  WHERE ii.product_id = v_product_id
     OR ii.sku = v_product_sku
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Also update the _reserve_inventory_for_order to handle the function correctly
CREATE OR REPLACE FUNCTION public._reserve_inventory_for_order(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_rec RECORD;
  v_delta numeric;
  v_existing_qty numeric;
  v_variant uuid;
  v_reserved_before numeric;
  v_available_before numeric;
BEGIN
  IF p_order_id IS NULL THEN
    RETURN;
  END IF;

  FOR v_rec IN
    WITH resolved AS (
      SELECT
        oi.id AS order_item_id,
        oi.quantity,
        res.inventory_item_id,
        res.warehouse_id
      FROM public.ecommerce_order_items oi
      LEFT JOIN LATERAL public._resolve_inventory_item_for_order_item(oi.id) res ON true
      WHERE oi.order_id = p_order_id
    )
    SELECT
      resolved.inventory_item_id,
      resolved.warehouse_id,
      SUM(resolved.quantity) AS total_quantity
    FROM resolved
    WHERE resolved.inventory_item_id IS NOT NULL
    GROUP BY resolved.inventory_item_id, resolved.warehouse_id
  LOOP
    SELECT COALESCE(quantity_reserved, 0)
      INTO v_existing_qty
    FROM public.inventory_reservations
    WHERE reservation_type = 'ORDER'
      AND reserved_for = p_order_id::text
      AND inventory_item_id = v_rec.inventory_item_id;

    v_delta := COALESCE(v_rec.total_quantity, 0) - COALESCE(v_existing_qty, 0);

    IF v_delta = 0 THEN
      CONTINUE;
    END IF;

    INSERT INTO public.inventory_reservations (
      inventory_item_id,
      warehouse_id,
      quantity_reserved,
      reservation_type,
      reserved_for,
      status,
      created_by,
      created_at,
      updated_at
    )
    VALUES (
      v_rec.inventory_item_id,
      v_rec.warehouse_id,
      COALESCE(v_rec.total_quantity, 0),
      'ORDER',
      p_order_id::text,
      'ACTIVE',
      'system',
      NOW(),
      NOW()
    )
    ON CONFLICT (reservation_type, reserved_for, inventory_item_id)
    DO UPDATE SET
      quantity_reserved = EXCLUDED.quantity_reserved,
      warehouse_id = EXCLUDED.warehouse_id,
      status = 'ACTIVE',
      updated_at = NOW();

    UPDATE public.inventory_items
    SET quantity_reserved = COALESCE(quantity_reserved, 0) + v_delta,
        quantity_available = GREATEST(COALESCE(quantity_available, 0) - v_delta, 0),
        updated_at = NOW()
    WHERE id = v_rec.inventory_item_id;

    SELECT product_variant_id
      INTO v_variant
    FROM public.inventory_items
    WHERE id = v_rec.inventory_item_id;

    IF v_variant IS NOT NULL THEN
      SELECT COALESCE(reserved_stock, 0), COALESCE(available_stock, current_stock)
        INTO v_reserved_before, v_available_before
      FROM public.product_variants
      WHERE id = v_variant
      FOR UPDATE;

      UPDATE public.product_variants
      SET reserved_stock = GREATEST(v_reserved_before + v_delta, 0),
          available_stock = GREATEST(v_available_before - v_delta, 0),
          updated_at = NOW()
      WHERE id = v_variant;
    END IF;
  END LOOP;
END;
$$;
