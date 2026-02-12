-- ربط inventory_items بـ product_variants الموجودة
-- أولاً: إضافة product_id مباشرة لـ inventory_items لتسهيل البحث
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.products(id);

-- إنشاء index للبحث السريع
CREATE INDEX IF NOT EXISTS idx_inventory_items_product_id ON public.inventory_items(product_id);

-- ربط المنتجات النشطة بالمخزون الموجود (على الأقل واحد لكل منتج)
WITH active_products AS (
  SELECT p.id as product_id, p.sku as product_sku, w.id as warehouse_id
  FROM products p
  CROSS JOIN (SELECT id FROM warehouses WHERE is_active = true LIMIT 1) w
  WHERE p.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM inventory_items i WHERE i.product_id = p.id
    )
  LIMIT 20
)
INSERT INTO inventory_items (warehouse_id, product_id, sku, quantity_available, quantity_reserved, reorder_level, max_stock_level, unit_cost, location)
SELECT 
  ap.warehouse_id,
  ap.product_id,
  COALESCE(ap.product_sku, 'SKU-' || LEFT(ap.product_id::text, 8)),
  100, -- مخزون أولي
  0,
  10,
  1000,
  50.00,
  'A1-DEFAULT'
FROM active_products ap;

-- تحديث الدالة لتبحث عن product_id مباشرة
CREATE OR REPLACE FUNCTION public._resolve_inventory_item_for_order_item(p_product_id uuid, p_sku text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_inventory_item_id uuid;
BEGIN
  -- 1. البحث بـ product_id مباشرة
  SELECT id INTO v_inventory_item_id
  FROM inventory_items
  WHERE product_id = p_product_id
    AND quantity_available > 0
  LIMIT 1;
  
  IF v_inventory_item_id IS NOT NULL THEN
    RETURN v_inventory_item_id;
  END IF;
  
  -- 2. البحث بـ SKU
  IF p_sku IS NOT NULL THEN
    SELECT id INTO v_inventory_item_id
    FROM inventory_items
    WHERE sku = p_sku
      AND quantity_available > 0
    LIMIT 1;
    
    IF v_inventory_item_id IS NOT NULL THEN
      RETURN v_inventory_item_id;
    END IF;
  END IF;
  
  -- 3. البحث عبر product_variants
  SELECT ii.id INTO v_inventory_item_id
  FROM product_variants pv
  JOIN inventory_items ii ON ii.product_variant_id = pv.id
  WHERE pv.product_id = p_product_id
    AND ii.quantity_available > 0
  LIMIT 1;
  
  RETURN v_inventory_item_id;
END;
$$;

-- تحديث trigger الـ fulfillment ليستخدم الدالة المحدثة
CREATE OR REPLACE FUNCTION public._fulfill_inventory_on_paid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rec RECORD;
  v_inventory_item_id uuid;
  v_movement_number text;
  v_warehouse_id uuid;
BEGIN
  -- فقط عند تغيير payment_status إلى PAID
  IF NEW.payment_status = 'PAID' AND (OLD.payment_status IS DISTINCT FROM 'PAID') THEN
    
    -- جلب warehouse افتراضي
    SELECT id INTO v_warehouse_id FROM warehouses WHERE is_active = true LIMIT 1;
    
    FOR v_rec IN
      SELECT oi.id, oi.product_id, oi.quantity, p.sku
      FROM ecommerce_order_items oi
      JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = NEW.id
    LOOP
      -- إيجاد عنصر المخزون المناسب
      v_inventory_item_id := _resolve_inventory_item_for_order_item(v_rec.product_id, v_rec.sku);
      
      IF v_inventory_item_id IS NOT NULL THEN
        -- خصم من المخزون
        UPDATE inventory_items
        SET quantity_available = GREATEST(quantity_available - v_rec.quantity, 0),
            updated_at = now()
        WHERE id = v_inventory_item_id;
        
        -- إنشاء حركة المخزون
        v_movement_number := 'OUT-' || v_rec.id;
        
        INSERT INTO inventory_movements (
          inventory_item_id,
          warehouse_id,
          movement_type,
          movement_number,
          quantity,
          reference_type,
          reference_id,
          notes
        )
        SELECT 
          v_inventory_item_id,
          COALESCE(ii.warehouse_id, v_warehouse_id),
          'OUT',
          v_movement_number,
          v_rec.quantity,
          'ORDER',
          NEW.id,
          'خصم تلقائي للطلب: ' || NEW.order_number
        FROM inventory_items ii WHERE ii.id = v_inventory_item_id
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;