
-- ===============================================
-- المرحلة 2: تصحيح البنية المشتركة
-- Arrays + Generated Columns
-- ===============================================

-- ========== PART 1: تصحيح Arrays لتكون صريحة ==========

-- 1) products.image_urls (من ARRAY إلى text[])
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' 
    AND column_name = 'image_urls'
    AND data_type = 'ARRAY'
  ) THEN
    ALTER TABLE public.products 
      ALTER COLUMN image_urls TYPE text[] 
      USING COALESCE(image_urls::text[], '{}');
    RAISE NOTICE 'Fixed products.image_urls to text[]';
  END IF;
END $$;

-- 2) products.tags (من ARRAY إلى text[])
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' 
    AND column_name = 'tags'
    AND data_type = 'ARRAY'
  ) THEN
    ALTER TABLE public.products 
      ALTER COLUMN tags TYPE text[] 
      USING COALESCE(tags::text[], '{}');
    RAISE NOTICE 'Fixed products.tags to text[]';
  END IF;
END $$;

-- 3) chat_messages.mentions (من ARRAY إلى uuid[])
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_messages' 
    AND column_name = 'mentions'
    AND data_type = 'ARRAY'
  ) THEN
    ALTER TABLE public.chat_messages 
      ALTER COLUMN mentions TYPE uuid[] 
      USING COALESCE(mentions::uuid[], '{}');
    RAISE NOTICE 'Fixed chat_messages.mentions to uuid[]';
  END IF;
END $$;

-- 4) shipping_zones.postal_codes (إذا موجودة)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shipping_zones' 
    AND column_name = 'postal_codes'
    AND data_type = 'ARRAY'
  ) THEN
    ALTER TABLE public.shipping_zones 
      ALTER COLUMN postal_codes TYPE text[] 
      USING COALESCE(postal_codes::text[], '{}');
    RAISE NOTICE 'Fixed shipping_zones.postal_codes to text[]';
  END IF;
END $$;

-- ========== PART 2: إضافة Generated Columns ==========

-- 5) cart_items.total_price_sar_computed
DO $$
BEGIN
  -- حذف العمود القديم إذا كان موجوداً وليس generated
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cart_items' 
    AND column_name = 'total_price_sar_computed'
    AND is_generated = 'NEVER'
  ) THEN
    ALTER TABLE public.cart_items DROP COLUMN total_price_sar_computed;
  END IF;
  
  -- إضافة العمود المحسوب
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cart_items' 
    AND column_name = 'total_price_sar_computed'
  ) THEN
    ALTER TABLE public.cart_items
      ADD COLUMN total_price_sar_computed numeric
      GENERATED ALWAYS AS (quantity::numeric * unit_price_sar) STORED;
    RAISE NOTICE 'Added cart_items.total_price_sar_computed';
  END IF;
END $$;

-- 6) ecommerce_order_items.total_price_computed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ecommerce_order_items' 
    AND column_name = 'total_price_computed'
  ) THEN
    ALTER TABLE public.ecommerce_order_items
      ADD COLUMN total_price_computed numeric
      GENERATED ALWAYS AS (quantity::numeric * unit_price_sar) STORED;
    RAISE NOTICE 'Added ecommerce_order_items.total_price_computed';
  END IF;
END $$;

-- 7) simple_order_items.total_price_computed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'simple_order_items' 
    AND column_name = 'total_price_computed'
  ) THEN
    ALTER TABLE public.simple_order_items
      ADD COLUMN total_price_computed numeric
      GENERATED ALWAYS AS (quantity::numeric * unit_price_sar) STORED;
    RAISE NOTICE 'Added simple_order_items.total_price_computed';
  END IF;
END $$;

-- 8) product_variants.available_stock_computed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_variants' 
    AND column_name = 'available_stock_computed'
  ) THEN
    ALTER TABLE public.product_variants
      ADD COLUMN available_stock_computed integer
      GENERATED ALWAYS AS (GREATEST(current_stock - COALESCE(reserved_stock, 0), 0)) STORED;
    RAISE NOTICE 'Added product_variants.available_stock_computed';
  END IF;
END $$;

-- 9) إضافة فهارس على الأعمدة المحسوبة
CREATE INDEX IF NOT EXISTS idx_cart_items_total_computed 
  ON public.cart_items(total_price_sar_computed);

CREATE INDEX IF NOT EXISTS idx_variants_available_stock 
  ON public.product_variants(available_stock_computed) 
  WHERE available_stock_computed > 0;

-- ========== PART 3: التحقق النهائي ==========
-- التحقق من نوع البيانات للـ Arrays
SELECT 
  table_name,
  column_name,
  udt_name as data_type,
  'Array Fixed' as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('products', 'chat_messages', 'shipping_zones')
  AND column_name IN ('image_urls', 'tags', 'mentions', 'postal_codes')
ORDER BY table_name, column_name;
