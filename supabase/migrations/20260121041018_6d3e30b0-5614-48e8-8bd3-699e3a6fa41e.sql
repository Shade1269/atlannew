-- Fix the inventory reservation trigger to use correct column names
-- First, let's check and fix the trigger function

CREATE OR REPLACE FUNCTION public.reserve_inventory_on_order_item()
RETURNS TRIGGER AS $$
DECLARE
  v_inventory_id uuid;
  v_product_sku text;
BEGIN
  -- Get product SKU
  SELECT sku INTO v_product_sku
  FROM products
  WHERE id = NEW.product_id;
  
  -- Find inventory item by product_id or sku
  SELECT id INTO v_inventory_id
  FROM inventory_items
  WHERE product_id = NEW.product_id
     OR sku = v_product_sku
  LIMIT 1;
  
  -- If inventory found, create reservation
  IF v_inventory_id IS NOT NULL THEN
    INSERT INTO inventory_reservations (
      inventory_item_id,
      order_id,
      quantity,
      status,
      expires_at
    ) VALUES (
      v_inventory_id,
      NEW.order_id,
      NEW.quantity,
      'reserved',
      now() + interval '24 hours'
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Also fix the _resolve function to not reference non-existent columns
CREATE OR REPLACE FUNCTION public._resolve_inventory_item_for_order_item(p_order_item_id uuid)
RETURNS uuid AS $$
DECLARE
  v_product_id uuid;
  v_product_sku text;
  v_inventory_id uuid;
BEGIN
  -- Get product info from order item
  SELECT oi.product_id, p.sku
  INTO v_product_id, v_product_sku
  FROM ecommerce_order_items oi
  LEFT JOIN products p ON p.id = oi.product_id
  WHERE oi.id = p_order_item_id;
  
  -- Find inventory item
  SELECT id INTO v_inventory_id
  FROM inventory_items
  WHERE product_id = v_product_id
     OR sku = v_product_sku
  LIMIT 1;
  
  RETURN v_inventory_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;