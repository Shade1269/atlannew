-- ========================================
-- المرحلة 2: تأسيس البنية المشتركة
-- Types/Arrays/Generated Columns
-- ========================================

-- ============================================
-- 1) إنشاء الأنواع USER-DEFINED (ENUMs)
-- ============================================

-- Order Status
DO $$ BEGIN
  CREATE TYPE order_status_enum AS ENUM (
    'PENDING',
    'CONFIRMED', 
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'RETURNED',
    'REFUNDED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Payment Status
DO $$ BEGIN
  CREATE TYPE payment_status_enum AS ENUM (
    'PENDING',
    'PROCESSING',
    'PAID',
    'FAILED',
    'REFUNDED',
    'PARTIALLY_REFUNDED',
    'CANCELLED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Shipping Method
DO $$ BEGIN
  CREATE TYPE shipping_method_enum AS ENUM (
    'STANDARD',
    'EXPRESS',
    'SAME_DAY',
    'NEXT_DAY',
    'PICKUP'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Shipment Status
DO $$ BEGIN
  CREATE TYPE shipment_status_enum AS ENUM (
    'PENDING',
    'PICKED_UP',
    'IN_TRANSIT',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'FAILED',
    'RETURNED',
    'CANCELLED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Return Status
DO $$ BEGIN
  CREATE TYPE return_status_enum AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'RECEIVED',
    'REFUNDED',
    'CANCELLED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Refund Status
DO $$ BEGIN
  CREATE TYPE refund_status_enum AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'FAILED',
    'CANCELLED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Discount Type
DO $$ BEGIN
  CREATE TYPE discount_type_enum AS ENUM (
    'PERCENTAGE',
    'FIXED_AMOUNT'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- User Level
DO $$ BEGIN
  CREATE TYPE user_level_enum AS ENUM (
    'BRONZE',
    'SILVER', 
    'GOLD',
    'PLATINUM',
    'LEGENDARY'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE order_status_enum IS 'حالات الطلب الموحدة';
COMMENT ON TYPE payment_status_enum IS 'حالات الدفع الموحدة';
COMMENT ON TYPE shipping_method_enum IS 'طرق الشحن الموحدة';
COMMENT ON TYPE shipment_status_enum IS 'حالات الشحنة الموحدة';
COMMENT ON TYPE return_status_enum IS 'حالات المرتجع الموحدة';
COMMENT ON TYPE refund_status_enum IS 'حالات الاسترداد الموحدة';

-- ============================================
-- 2) تصحيح أعمدة Arrays لتصبح صريحة
-- ============================================

-- Products: image_urls & tags
DO $$ BEGIN
  -- تحويل image_urls إلى text[] إن لم يكن كذلك
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'products' 
    AND column_name = 'image_urls'
    AND data_type != 'ARRAY'
  ) THEN
    ALTER TABLE public.products 
      ALTER COLUMN image_urls TYPE text[] 
      USING CASE 
        WHEN image_urls IS NULL THEN NULL
        WHEN image_urls::text = '[]' THEN ARRAY[]::text[]
        ELSE image_urls::text[]
      END;
  END IF;

  -- تحويل tags إلى text[] إن لم يكن كذلك
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'products' 
    AND column_name = 'tags'
    AND data_type != 'ARRAY'
  ) THEN
    ALTER TABLE public.products 
      ALTER COLUMN tags TYPE text[] 
      USING CASE 
        WHEN tags IS NULL THEN NULL
        WHEN tags::text = '[]' THEN ARRAY[]::text[]
        ELSE tags::text[]
      END;
  END IF;
END $$;

-- Chat Messages: mentions
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'chat_messages' 
    AND column_name = 'mentions'
    AND data_type != 'ARRAY'
  ) THEN
    ALTER TABLE public.chat_messages 
      ALTER COLUMN mentions TYPE uuid[] 
      USING CASE 
        WHEN mentions IS NULL THEN NULL
        WHEN mentions::text = '{}' THEN ARRAY[]::uuid[]
        ELSE mentions::uuid[]
      END;
  END IF;
END $$;

-- Shipping Zones: postal_codes
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'shipping_zones' 
    AND column_name = 'postal_codes'
    AND data_type != 'ARRAY'
  ) THEN
    ALTER TABLE public.shipping_zones 
      ALTER COLUMN postal_codes TYPE text[] 
      USING CASE 
        WHEN postal_codes IS NULL THEN NULL
        WHEN postal_codes::text = '{}' THEN ARRAY[]::text[]
        ELSE postal_codes::text[]
      END;
  END IF;
END $$;

COMMENT ON COLUMN public.products.image_urls IS 'مصفوفة صريحة من روابط الصور';
COMMENT ON COLUMN public.products.tags IS 'مصفوفة صريحة من الوسوم';
COMMENT ON COLUMN public.chat_messages.mentions IS 'مصفوفة صريحة من معرفات المستخدمين المذكورين';

-- ============================================
-- 3) تحويل الحقول المحسوبة إلى GENERATED STORED
-- ============================================

-- Cart Items: total_price_sar
DO $$ BEGIN
  -- حذف العمود القديم إن كان موجودًا وليس مولداً
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'cart_items' 
    AND column_name = 'total_price_sar'
    AND is_generated = 'NEVER'
  ) THEN
    ALTER TABLE public.cart_items DROP COLUMN total_price_sar;
  END IF;

  -- إضافة العمود المولد إن لم يكن موجوداً
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'cart_items' 
    AND column_name = 'total_price_sar'
  ) THEN
    ALTER TABLE public.cart_items
      ADD COLUMN total_price_sar numeric 
      GENERATED ALWAYS AS (quantity::numeric * unit_price_sar) STORED;
  END IF;
END $$;

-- Ecommerce Order Items: total_price_sar
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ecommerce_order_items' 
    AND column_name = 'total_price_sar'
    AND is_generated = 'NEVER'
  ) THEN
    ALTER TABLE public.ecommerce_order_items DROP COLUMN total_price_sar;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ecommerce_order_items' 
    AND column_name = 'total_price_sar'
  ) THEN
    ALTER TABLE public.ecommerce_order_items
      ADD COLUMN total_price_sar numeric 
      GENERATED ALWAYS AS (quantity::numeric * unit_price_sar) STORED;
  END IF;
END $$;

-- Product Variants: available_stock
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'product_variants' 
    AND column_name = 'available_stock'
    AND is_generated = 'NEVER'
  ) THEN
    ALTER TABLE public.product_variants DROP COLUMN available_stock;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'product_variants' 
    AND column_name = 'available_stock'
  ) THEN
    ALTER TABLE public.product_variants
      ADD COLUMN available_stock integer 
      GENERATED ALWAYS AS (current_stock - COALESCE(reserved_stock, 0)) STORED;
  END IF;
END $$;

COMMENT ON COLUMN public.cart_items.total_price_sar IS 'عمود محسوب: الكمية × السعر';
COMMENT ON COLUMN public.ecommerce_order_items.total_price_sar IS 'عمود محسوب: الكمية × السعر';
COMMENT ON COLUMN public.product_variants.available_stock IS 'عمود محسوب: المخزون المتاح = الحالي - المحجوز';

-- ============================================
-- 4) إنشاء فهارس على الأعمدة المولدة
-- ============================================

CREATE INDEX IF NOT EXISTS idx_cart_items_total_price 
  ON public.cart_items(total_price_sar);

CREATE INDEX IF NOT EXISTS idx_order_items_total_price 
  ON public.ecommerce_order_items(total_price_sar);

CREATE INDEX IF NOT EXISTS idx_variants_available_stock 
  ON public.product_variants(available_stock) 
  WHERE available_stock > 0;