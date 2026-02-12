-- إنشاء functions للمخزون إذا لم تكن موجودة

-- Function لإيجاد inventory item للمنتج
CREATE OR REPLACE FUNCTION public._resolve_inventory_item_for_order_item(p_order_item_id uuid)
RETURNS TABLE(inventory_item_id uuid, warehouse_id uuid, product_variant_id uuid)
LANGUAGE sql
AS $$
  WITH item AS (
    SELECT
      oi.id,
      oi.product_id,
      oi.product_sku,
      oi.selected_variants
    FROM public.ecommerce_order_items oi
    WHERE oi.id = p_order_item_id
  ),
  chosen_variant AS (
    SELECT pv.id, pv.warehouse_product_id, pv.variant_sku, pv.product_id, pv.created_at
    FROM public.product_variants pv
    CROSS JOIN item
    WHERE (
      item.product_sku IS NOT NULL
      AND pv.variant_sku = item.product_sku
    )
       OR pv.product_id = item.product_id
    ORDER BY
      CASE
        WHEN item.product_sku IS NOT NULL AND pv.variant_sku = item.product_sku THEN 0
        ELSE 1
      END,
      pv.created_at
    LIMIT 1
  ),
  inventory_candidates AS (
    SELECT
      ii.id,
      ii.warehouse_id,
      ii.product_variant_id,
      ii.sku,
      ii.updated_at,
      CASE
        WHEN item.product_sku IS NOT NULL AND ii.sku = item.product_sku THEN 0
        WHEN chosen_variant.id IS NOT NULL AND ii.product_variant_id = chosen_variant.id THEN 1
        ELSE 2
      END AS preference
    FROM public.inventory_items ii
    CROSS JOIN item
    LEFT JOIN chosen_variant ON TRUE
    WHERE (
      chosen_variant.id IS NOT NULL AND ii.product_variant_id = chosen_variant.id
    )
       OR (item.product_sku IS NOT NULL AND ii.sku = item.product_sku)
    ORDER BY preference, ii.updated_at DESC
    LIMIT 1
  )
  SELECT
    inventory_candidates.id AS inventory_item_id,
    inventory_candidates.warehouse_id,
    inventory_candidates.product_variant_id
  FROM inventory_candidates;
$$;

-- Function لحجز المخزون عند إنشاء الطلب
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
        (SELECT r.inventory_item_id FROM public._resolve_inventory_item_for_order_item(oi.id) r LIMIT 1) AS inventory_item_id,
        (SELECT r.warehouse_id FROM public._resolve_inventory_item_for_order_item(oi.id) r LIMIT 1) AS warehouse_id
      FROM public.ecommerce_order_items oi
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

-- Function لتنفيذ المخزون عند الدفع
CREATE OR REPLACE FUNCTION public._fulfill_inventory_on_paid(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_rec RECORD;
  v_variant uuid;
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

    SELECT product_variant_id
      INTO v_variant
    FROM public.inventory_items
    WHERE id = v_rec.inventory_item_id
    FOR UPDATE;

    UPDATE public.inventory_items
    SET quantity_reserved = GREATEST(COALESCE(quantity_reserved, 0) - v_rec.quantity_reserved, 0),
        updated_at = NOW()
    WHERE id = v_rec.inventory_item_id;

    IF v_variant IS NOT NULL THEN
      SELECT
        COALESCE(reserved_stock, 0),
        COALESCE(available_stock, current_stock),
        current_stock
        INTO v_reserved_before, v_available_before, v_current_before
      FROM public.product_variants
      WHERE id = v_variant
      FOR UPDATE;

      v_reserved_after := GREATEST(v_reserved_before - v_rec.quantity_reserved, 0);
      v_current_after := GREATEST(COALESCE(v_current_before, 0) - v_rec.quantity_reserved, 0);
      v_available_after := GREATEST(v_current_after - v_reserved_after, 0);

      UPDATE public.product_variants
      SET reserved_stock = v_reserved_after,
          current_stock = v_current_after,
          available_stock = v_available_after,
          updated_at = NOW()
      WHERE id = v_variant;
    END IF;

    v_movement_number := 'OUT-' || v_rec.id;

    INSERT INTO public.inventory_movements (
      inventory_item_id,
      warehouse_id,
      movement_type,
      movement_number,
      quantity,
      reference_type,
      reference_id,
      notes,
      performed_by,
      performed_at,
      created_at
    )
    VALUES (
      v_rec.inventory_item_id,
      v_rec.warehouse_id,
      'OUT',
      v_movement_number,
      v_rec.quantity_reserved,
      'ORDER',
      p_order_id::text,
      'Auto-fulfilled on payment',
      'system',
      NOW(),
      NOW()
    )
    ON CONFLICT (movement_number) DO NOTHING;

    UPDATE public.inventory_reservations
    SET status = 'FULFILLED',
        updated_at = NOW()
    WHERE id = v_rec.id;
  END LOOP;
END;
$$;

-- Trigger function لحجز المخزون
CREATE OR REPLACE FUNCTION public._on_order_item_insert_reserve_inventory()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public._reserve_inventory_for_order(NEW.order_id);
  RETURN NEW;
END;
$$;

-- إنشاء trigger لحجز المخزون
DROP TRIGGER IF EXISTS trg_order_item_reserve_inventory ON public.ecommerce_order_items;
CREATE TRIGGER trg_order_item_reserve_inventory
AFTER INSERT ON public.ecommerce_order_items
FOR EACH ROW
EXECUTE FUNCTION public._on_order_item_insert_reserve_inventory();

-- Trigger function لتنفيذ المخزون عند الدفع
CREATE OR REPLACE FUNCTION public._on_order_payment_update_manage_inventory()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.payment_status = 'PAID' AND (OLD.payment_status IS DISTINCT FROM NEW.payment_status) THEN
    PERFORM public._fulfill_inventory_on_paid(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- إنشاء trigger لتنفيذ المخزون
DROP TRIGGER IF EXISTS trg_order_payment_manage_inventory ON public.ecommerce_orders;
CREATE TRIGGER trg_order_payment_manage_inventory
AFTER UPDATE OF payment_status ON public.ecommerce_orders
FOR EACH ROW
EXECUTE FUNCTION public._on_order_payment_update_manage_inventory();