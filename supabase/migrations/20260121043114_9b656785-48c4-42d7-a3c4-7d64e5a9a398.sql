-- إصلاح الـ trigger function - استخدام الأعمدة الصحيحة
CREATE OR REPLACE FUNCTION public._fulfill_inventory_on_paid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rec RECORD;
  v_movement_number text;
  v_variant_id uuid;
BEGIN
  -- فقط عند تغيير payment_status إلى PAID
  IF NEW.payment_status = 'PAID' AND (OLD.payment_status IS DISTINCT FROM 'PAID') THEN
    
    FOR v_rec IN
      SELECT oi.id, oi.product_id, oi.quantity, oi.selected_variants
      FROM ecommerce_order_items oi
      WHERE oi.order_id = NEW.id
    LOOP
      -- محاولة إيجاد الـ variant من selected_variants أو الـ default
      v_variant_id := NULL;
      
      -- إذا كان selected_variants يحتوي على variant_id
      IF v_rec.selected_variants IS NOT NULL AND jsonb_typeof(v_rec.selected_variants::jsonb) = 'object' THEN
        v_variant_id := (v_rec.selected_variants::jsonb->>'variant_id')::uuid;
      END IF;
      
      -- إذا لم يكن هناك variant، نحاول إيجاد الـ default variant
      IF v_variant_id IS NULL THEN
        SELECT id INTO v_variant_id 
        FROM product_variants 
        WHERE product_id = v_rec.product_id 
        LIMIT 1;
      END IF;
      
      -- خصم من المخزون في product_variants
      IF v_variant_id IS NOT NULL THEN
        UPDATE product_variants
        SET current_stock = GREATEST(COALESCE(current_stock, 0) - v_rec.quantity, 0),
            available_stock = GREATEST(COALESCE(available_stock, 0) - v_rec.quantity, 0),
            updated_at = now()
        WHERE id = v_variant_id;
      END IF;
      
      -- إنشاء حركة المخزون
      v_movement_number := 'SALE-' || NEW.order_number || '-' || v_rec.id;
      
      INSERT INTO inventory_movements (
        movement_number,
        movement_type,
        product_variant_id,
        quantity,
        reference_type,
        reference_id,
        notes,
        created_by,
        created_at
      )
      VALUES (
        v_movement_number,
        'SALE',
        v_variant_id,
        -v_rec.quantity,
        'ORDER',
        NEW.id,
        'خصم تلقائي للطلب: ' || NEW.order_number,
        COALESCE(NEW.customer_id, '00000000-0000-0000-0000-000000000000'::uuid),
        now()
      )
      ON CONFLICT (movement_number) DO NOTHING;
      
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;