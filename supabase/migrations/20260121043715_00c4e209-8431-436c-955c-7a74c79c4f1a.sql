-- Check and fix the movement type in the trigger
CREATE OR REPLACE FUNCTION public._fulfill_inventory_on_paid()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when payment_status changes to 'PAID'
  IF NEW.payment_status = 'PAID' AND (OLD.payment_status IS DISTINCT FROM 'PAID') THEN
    -- Deduct stock for each order item
    UPDATE inventory_items ii
    SET current_stock = ii.current_stock - oi.quantity,
        updated_at = now()
    FROM order_items oi
    WHERE oi.order_id = NEW.id
      AND ii.sku = oi.sku;

    -- Record inventory movements with correct movement_type
    INSERT INTO inventory_movements (
      inventory_item_id,
      movement_type,
      quantity,
      reference_type,
      reference_id,
      notes,
      created_by
    )
    SELECT 
      ii.id,
      'sale',  -- Using 'sale' instead of 'order_fulfillment'
      -oi.quantity,
      'order',
      NEW.id,
      'Auto-fulfilled on payment - Order: ' || NEW.order_number,
      NULL
    FROM order_items oi
    JOIN inventory_items ii ON ii.sku = oi.sku
    WHERE oi.order_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;