-- Fix 1: Update trigger function with correct column names
CREATE OR REPLACE FUNCTION public.reserve_inventory_on_order_item()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_inventory_id uuid;
  v_warehouse_id uuid;
  v_product_sku text;
BEGIN
  -- Get product SKU
  SELECT sku INTO v_product_sku
  FROM products
  WHERE id = NEW.product_id;
  
  -- Find inventory item by product_id or sku
  SELECT id, warehouse_id INTO v_inventory_id, v_warehouse_id
  FROM inventory_items
  WHERE product_id = NEW.product_id
     OR (sku IS NOT NULL AND sku = v_product_sku)
  LIMIT 1;
  
  -- If inventory found, create reservation with CORRECT column names
  IF v_inventory_id IS NOT NULL THEN
    INSERT INTO inventory_reservations (
      inventory_item_id,
      warehouse_id,
      quantity_reserved,
      reservation_type,
      reserved_for,
      status,
      created_at,
      updated_at
    ) VALUES (
      v_inventory_id,
      v_warehouse_id,
      NEW.quantity,
      'ORDER',
      NEW.order_id::text,
      'ACTIVE',
      NOW(),
      NOW()
    )
    ON CONFLICT (reservation_type, reserved_for, inventory_item_id) 
    DO UPDATE SET
      quantity_reserved = inventory_reservations.quantity_reserved + EXCLUDED.quantity_reserved,
      updated_at = NOW();
      
    -- Also update inventory_items quantities
    UPDATE inventory_items
    SET quantity_reserved = COALESCE(quantity_reserved, 0) + NEW.quantity,
        quantity_available = GREATEST(COALESCE(quantity_available, 0) - NEW.quantity, 0),
        updated_at = NOW()
    WHERE id = v_inventory_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix 2: Link existing products to inventory items by matching SKU
UPDATE inventory_items inv
SET product_id = p.id
FROM products p
WHERE inv.product_id IS NULL
  AND inv.sku IS NOT NULL
  AND p.sku IS NOT NULL
  AND inv.sku = p.sku;

-- Fix 3: For products without inventory, create inventory items
INSERT INTO inventory_items (
  sku,
  product_id,
  warehouse_id,
  quantity_available,
  quantity_reserved,
  quantity_on_order,
  reorder_level,
  max_stock_level,
  unit_cost,
  location
)
SELECT 
  COALESCE(p.sku, 'PROD-' || LEFT(p.id::text, 8)),
  p.id,
  (SELECT id FROM warehouses WHERE is_active = true LIMIT 1),
  100, -- default available
  0,
  0,
  10,
  1000,
  COALESCE(p.price_sar, 0),
  'AUTO-CREATED'
FROM products p
WHERE NOT EXISTS (
  SELECT 1 FROM inventory_items inv 
  WHERE inv.product_id = p.id
)
AND EXISTS (SELECT 1 FROM warehouses WHERE is_active = true);

-- Fix 4: Fix _reserve_inventory_for_order to handle created_by correctly (remove it since it's uuid type)
CREATE OR REPLACE FUNCTION public._reserve_inventory_for_order(p_order_id uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
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
$function$;