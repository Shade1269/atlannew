-- حذف جميع النسخ المكررة من الدالة
DROP FUNCTION IF EXISTS public._resolve_inventory_item_for_order_item(uuid);
DROP FUNCTION IF EXISTS public._resolve_inventory_item_for_order_item(uuid, text);

-- إعادة إنشاء دالة واحدة فقط
CREATE OR REPLACE FUNCTION public._resolve_inventory_item_for_order_item(p_order_item_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product_id uuid;
  v_sku text;
  v_inventory_item_id uuid;
BEGIN
  -- جلب معرف المنتج و SKU من عنصر الطلب
  SELECT oi.product_id, p.sku INTO v_product_id, v_sku
  FROM ecommerce_order_items oi
  JOIN products p ON p.id = oi.product_id
  WHERE oi.id = p_order_item_id;

  IF v_product_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- البحث عن عنصر المخزون بالمنتج مباشرة
  SELECT id INTO v_inventory_item_id
  FROM inventory_items
  WHERE product_id = v_product_id
  LIMIT 1;

  IF v_inventory_item_id IS NOT NULL THEN
    RETURN v_inventory_item_id;
  END IF;

  -- البحث بالـ SKU
  IF v_sku IS NOT NULL THEN
    SELECT id INTO v_inventory_item_id
    FROM inventory_items
    WHERE sku = v_sku
    LIMIT 1;
  END IF;

  RETURN v_inventory_item_id;
END;
$$;