-- Add Fastcoo shipping provider fields to ecommerce_orders table
-- This migration adds Fastcoo-specific columns to the existing ecommerce_orders table

-- Add Fastcoo-specific columns to ecommerce_orders
ALTER TABLE public.ecommerce_orders
ADD COLUMN IF NOT EXISTS shipping_provider TEXT,
ADD COLUMN IF NOT EXISTS fastcoo_awb TEXT,
ADD COLUMN IF NOT EXISTS fastcoo_data JSONB,
ADD COLUMN IF NOT EXISTS fastcoo_service_type TEXT;

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_ecommerce_orders_fastcoo_awb 
  ON public.ecommerce_orders(fastcoo_awb) 
  TABLESPACE pg_default
  WHERE fastcoo_awb IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ecommerce_orders_shipping_provider 
  ON public.ecommerce_orders(shipping_provider) 
  TABLESPACE pg_default
  WHERE shipping_provider IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.ecommerce_orders.shipping_provider IS 'Shipping provider name (e.g., fastcoo, aramex, local, etc.)';
COMMENT ON COLUMN public.ecommerce_orders.fastcoo_awb IS 'Fastcoo AWB (Air Waybill) tracking number';
COMMENT ON COLUMN public.ecommerce_orders.fastcoo_data IS 'Raw Fastcoo API response data stored as JSON';
COMMENT ON COLUMN public.ecommerce_orders.fastcoo_service_type IS 'Fastcoo service type (Express Service, Advance Service, etc.)';

-- Update shipments_tracking table if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'shipments_tracking'
  ) THEN
    -- Add Fastcoo fields to shipments_tracking
    ALTER TABLE public.shipments_tracking
    ADD COLUMN IF NOT EXISTS fastcoo_awb TEXT,
    ADD COLUMN IF NOT EXISTS fastcoo_data JSONB;
    
    -- Add index for shipments_tracking
    CREATE INDEX IF NOT EXISTS idx_shipments_tracking_fastcoo_awb 
      ON public.shipments_tracking(fastcoo_awb) 
      TABLESPACE pg_default
      WHERE fastcoo_awb IS NOT NULL;
      
    COMMENT ON COLUMN public.shipments_tracking.fastcoo_awb IS 'Fastcoo AWB (Air Waybill) tracking number';
    COMMENT ON COLUMN public.shipments_tracking.fastcoo_data IS 'Raw Fastcoo API response data stored as JSON';
  END IF;
END $$;

