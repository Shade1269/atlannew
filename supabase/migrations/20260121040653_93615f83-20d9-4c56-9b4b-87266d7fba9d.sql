-- Drop all existing versions of the function first
DROP FUNCTION IF EXISTS public._resolve_inventory_item_for_order_item(uuid);
DROP FUNCTION IF EXISTS public._resolve_inventory_item_for_order_item(uuid, uuid);

-- Recreate with single clean definition
CREATE OR REPLACE FUNCTION public._resolve_inventory_item_for_order_item(p_product_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_inventory_item_id uuid;
BEGIN
  -- 1. Try direct product_id match
  SELECT id INTO v_inventory_item_id
  FROM inventory_items
  WHERE product_id = p_product_id
  LIMIT 1;
  
  IF v_inventory_item_id IS NOT NULL THEN
    RETURN v_inventory_item_id;
  END IF;
  
  -- 2. Try SKU match
  SELECT ii.id INTO v_inventory_item_id
  FROM inventory_items ii
  JOIN products p ON ii.sku = p.sku
  WHERE p.id = p_product_id
  LIMIT 1;
  
  IF v_inventory_item_id IS NOT NULL THEN
    RETURN v_inventory_item_id;
  END IF;
  
  -- 3. Try variant match
  SELECT ii.id INTO v_inventory_item_id
  FROM inventory_items ii
  JOIN product_variants pv ON ii.sku = pv.sku
  WHERE pv.product_id = p_product_id
  LIMIT 1;
  
  RETURN v_inventory_item_id;
END;
$$;