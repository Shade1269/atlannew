-- Internal inventory automation: reservations, fulfillment, and release lifecycle
-- Run this script after the base policies/indexes/commissions/points files.

-- Helper index to keep reservation upserts idempotent per order/inventory item pair
CREATE UNIQUE INDEX IF NOT EXISTS uq_inventory_reservations_order
  ON public.inventory_reservations(reservation_type, reserved_for, inventory_item_id);

CREATE INDEX IF NOT EXISTS idx_inventory_reservations_reserved_for
  ON public.inventory_reservations(reserved_for)
  WHERE reservation_type = 'ORDER';

CREATE UNIQUE INDEX IF NOT EXISTS uq_inventory_movements_number
  ON public.inventory_movements(movement_number);

-- Resolve the default warehouse used when no explicit warehouse is linked
CREATE OR REPLACE FUNCTION public._get_default_warehouse()
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_code text;
  v_id uuid;
BEGIN
  BEGIN
    v_code := current_setting('app.default_warehouse_code', true);
  EXCEPTION
    WHEN others THEN
      v_code := NULL;
  END;

  IF v_code IS NULL OR trim(v_code) = '' THEN
    v_code := 'MAIN';
  END IF;

  SELECT id
    INTO v_id
  FROM public.warehouses
  WHERE code = v_code
  ORDER BY created_at
  LIMIT 1;

  IF v_id IS NULL THEN
    SELECT id
      INTO v_id
    FROM public.warehouses
    ORDER BY created_at
    LIMIT 1;
  END IF;

  RETURN v_id;
END;
$$;

-- Resolve the inventory item tied to an order item using SKU → variant → product fallbacks
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

-- Reserve inventory rows for a newly created order (idempotent reruns allowed)
CREATE OR REPLACE FUNCTION public._reserve_inventory_for_order(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_default_warehouse uuid := public._get_default_warehouse();
  v_rec RECORD;
  v_existing numeric;
  v_available numeric;
  v_delta numeric;
  v_variant uuid;
  v_reserved_before numeric;
  v_available_before numeric;
BEGIN
  IF p_order_id IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.ecommerce_order_items WHERE order_id = p_order_id) THEN
    RETURN;
  END IF;

  FOR v_rec IN
    WITH resolved AS (
      SELECT
        oi.id AS order_item_id,
        oi.quantity,
        target.inventory_item_id,
        COALESCE(target.warehouse_id, v_default_warehouse) AS warehouse_id
      FROM public.ecommerce_order_items oi
      LEFT JOIN LATERAL public._resolve_inventory_item_for_order_item(oi.id) AS target ON TRUE
      WHERE oi.order_id = p_order_id
    ),
    aggregated AS (
      SELECT
        inventory_item_id,
        warehouse_id,
        SUM(quantity) AS total_quantity
      FROM resolved
      GROUP BY inventory_item_id, warehouse_id
    )
    SELECT * FROM aggregated
  LOOP
    IF v_rec.inventory_item_id IS NULL THEN
      RAISE EXCEPTION 'لم يتم العثور على عنصر مخزون للطلب %', p_order_id;
    END IF;

    SELECT quantity_reserved
      INTO v_existing
    FROM public.inventory_reservations
    WHERE reservation_type = 'ORDER'
      AND reserved_for = p_order_id::text
      AND inventory_item_id = v_rec.inventory_item_id
    FOR UPDATE;

    v_existing := COALESCE(v_existing, 0);

    SELECT quantity_available
      INTO v_available
    FROM public.inventory_items
    WHERE id = v_rec.inventory_item_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'عنصر المخزون % غير موجود', v_rec.inventory_item_id;
    END IF;

    v_delta := COALESCE(v_rec.total_quantity, 0) - v_existing;

    IF v_delta > 0 THEN
      IF v_available IS NULL OR v_available < v_delta THEN
        RAISE EXCEPTION 'الكمية غير كافية للعنصر % (المطلوب: %، المتاح: %)',
          v_rec.inventory_item_id,
          v_rec.total_quantity,
          COALESCE(v_available, 0) + v_existing;
      END IF;
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
      SELECT
        COALESCE(reserved_stock, 0),
        COALESCE(available_stock, current_stock)
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

-- Fulfill reservations once payment is confirmed
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
      v_current_after := GREATEST(v_current_before - v_rec.quantity_reserved, 0);
      v_available_after := GREATEST(v_current_after - v_reserved_after, 0);

      UPDATE public.product_variants
      SET reserved_stock = v_reserved_after,
          current_stock = v_current_after,
          available_stock = v_available_after,
          updated_at = NOW()
      WHERE id = v_variant;
    END IF;

    v_movement_number := 'OUT-' || v_rec.id;

    IF NOT EXISTS (
      SELECT 1 FROM public.inventory_movements WHERE movement_number = v_movement_number
    ) THEN
      INSERT INTO public.inventory_movements (
        movement_number,
        movement_type,
        quantity,
        warehouse_product_id,
        product_variant_id,
        reference_type,
        reference_id,
        created_by,
        created_at,
        notes
      )
      VALUES (
        v_movement_number,
        'OUT',
        v_rec.quantity_reserved,
        (SELECT warehouse_product_id FROM public.product_variants WHERE id = v_variant),
        v_variant,
        'ORDER',
        p_order_id::text,
        'system',
        NOW(),
        'Auto fulfillment for paid order'
      );
    END IF;

    UPDATE public.inventory_reservations
    SET status = 'FULFILLED',
        updated_at = NOW()
    WHERE id = v_rec.id;
  END LOOP;
END;
$$;

-- Release reservations when an order is cancelled or fails
CREATE OR REPLACE FUNCTION public._release_inventory_on_cancel(p_order_id uuid)
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
  v_available_after numeric;
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
        quantity_available = COALESCE(quantity_available, 0) + v_rec.quantity_reserved,
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
      v_available_after := GREATEST(v_current_before - v_reserved_after, 0);

      UPDATE public.product_variants
      SET reserved_stock = v_reserved_after,
          available_stock = v_available_after,
          updated_at = NOW()
      WHERE id = v_variant;
    END IF;

    UPDATE public.inventory_reservations
    SET status = 'CANCELLED',
        updated_at = NOW()
    WHERE id = v_rec.id;
  END LOOP;
END;
$$;

-- Trigger to reserve inventory after order items are inserted
CREATE OR REPLACE FUNCTION public._on_order_item_insert_reserve_inventory()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public._reserve_inventory_for_order(NEW.order_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_item_reserve_inventory ON public.ecommerce_order_items;
CREATE TRIGGER trg_order_item_reserve_inventory
AFTER INSERT ON public.ecommerce_order_items
FOR EACH ROW
EXECUTE FUNCTION public._on_order_item_insert_reserve_inventory();

-- Trigger to handle fulfillment and release on payment state changes
CREATE OR REPLACE FUNCTION public._on_order_payment_update_manage_inventory()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.payment_status = 'PAID' AND (OLD.payment_status IS DISTINCT FROM NEW.payment_status) THEN
    PERFORM public._fulfill_inventory_on_paid(NEW.id);
  ELSIF NEW.payment_status IN ('CANCELLED', 'FAILED')
        AND (OLD.payment_status IS DISTINCT FROM NEW.payment_status) THEN
    PERFORM public._release_inventory_on_cancel(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_payment_manage_inventory ON public.ecommerce_orders;
CREATE TRIGGER trg_order_payment_manage_inventory
AFTER UPDATE OF payment_status ON public.ecommerce_orders
FOR EACH ROW
EXECUTE FUNCTION public._on_order_payment_update_manage_inventory();
