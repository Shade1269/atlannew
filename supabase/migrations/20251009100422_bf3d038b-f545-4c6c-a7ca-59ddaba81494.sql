-- ========================================
-- المرحلة 6: إضافة order_hub_id للمرتجعات والاستردادات
-- ========================================

-- 1) إضافة order_hub_id لجدول المرتجعات
ALTER TABLE public.product_returns
ADD COLUMN IF NOT EXISTS order_hub_id UUID;

-- 2) إضافة order_hub_id لجدول الاستردادات
ALTER TABLE public.refunds
ADD COLUMN IF NOT EXISTS order_hub_id UUID;

-- 3) إضافة Foreign Keys إذا كان جدول order_hub موجود
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'order_hub'
  ) THEN
    -- FK للمرتجعات
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'fk_returns_order_hub'
    ) THEN
      ALTER TABLE public.product_returns
        ADD CONSTRAINT fk_returns_order_hub
        FOREIGN KEY (order_hub_id) 
        REFERENCES public.order_hub(id) 
        ON DELETE SET NULL;
    END IF;
    
    -- FK للاستردادات
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'fk_refunds_order_hub'
    ) THEN
      ALTER TABLE public.refunds
        ADD CONSTRAINT fk_refunds_order_hub
        FOREIGN KEY (order_hub_id) 
        REFERENCES public.order_hub(id) 
        ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- 4) إضافة فهارس
CREATE INDEX IF NOT EXISTS idx_returns_order_hub 
  ON public.product_returns(order_hub_id);

CREATE INDEX IF NOT EXISTS idx_refunds_order_hub 
  ON public.refunds(order_hub_id);

-- 5) إضافة تعليقات توضيحية
COMMENT ON COLUMN public.product_returns.order_hub_id IS 'ربط المرتجع بـ Order Hub للتتبع الموحد';
COMMENT ON COLUMN public.refunds.order_hub_id IS 'ربط الاسترداد بـ Order Hub للتتبع الموحد';