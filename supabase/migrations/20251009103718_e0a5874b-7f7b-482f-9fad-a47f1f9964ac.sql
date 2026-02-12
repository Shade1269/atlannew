-- ═══════════════════════════════════════════════════════════════
-- STAGE 2 PART 1: TYPES & ENUMS STANDARDIZATION
-- Define missing USER-DEFINED types for consistency
-- ═══════════════════════════════════════════════════════════════

-- Order status enum (if not exists)
DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'PENDING',
    'CONFIRMED', 
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'REFUNDED',
    'FAILED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Payment status enum (if not exists)
DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM (
    'PENDING',
    'PAID',
    'FAILED',
    'REFUNDED',
    'PARTIALLY_REFUNDED',
    'CANCELLED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Shipping method enum (if not exists)
DO $$ BEGIN
  CREATE TYPE shipping_method AS ENUM (
    'STANDARD',
    'EXPRESS',
    'OVERNIGHT',
    'PICKUP'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Product status enum (if not exists)
DO $$ BEGIN
  CREATE TYPE product_status AS ENUM (
    'DRAFT',
    'ACTIVE',
    'INACTIVE',
    'OUT_OF_STOCK',
    'DISCONTINUED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE order_status IS 'Standardized order status values';
COMMENT ON TYPE payment_status IS 'Standardized payment status values';
COMMENT ON TYPE shipping_method IS 'Standardized shipping method types';
COMMENT ON TYPE product_status IS 'Standardized product status values';