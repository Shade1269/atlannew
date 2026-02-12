-- إصلاح الـ trigger function لتستخدم الأعمدة الصحيحة
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
      SELECT oi.id, oi.product_id, oi.variant_id, oi.quantity
      FROM ecommerce_order_items oi
      WHERE oi.order_id = NEW.id
    LOOP
      -- تحديد الـ variant
      v_variant_id := v_rec.variant_id;
      
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
      
      -- إنشاء حركة المخزون باستخدام الأعمدة الصحيحة
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

-- إزالة الـ triggers القديمة المتضاربة
DROP TRIGGER IF EXISTS trg_inventory_movement_on_order ON ecommerce_orders;
DROP TRIGGER IF EXISTS trg_order_payment_manage_inventory ON ecommerce_orders;

-- إنشاء trigger واحد نظيف
DROP TRIGGER IF EXISTS trg_fulfill_inventory_on_paid ON ecommerce_orders;
CREATE TRIGGER trg_fulfill_inventory_on_paid
  AFTER UPDATE ON ecommerce_orders
  FOR EACH ROW
  EXECUTE FUNCTION _fulfill_inventory_on_paid();

-- حذف الـ functions القديمة غير المستخدمة
DROP FUNCTION IF EXISTS trigger_inventory_movement_on_order() CASCADE;
DROP FUNCTION IF EXISTS _on_order_payment_update_manage_inventory() CASCADE;