
-- إعادة محاولة إضافة المفاتيح الأجنبية بشكل صريح

-- 1) product_returns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_returns_order_hub' 
    AND table_name = 'product_returns'
  ) THEN
    ALTER TABLE public.product_returns
      ADD CONSTRAINT fk_returns_order_hub
      FOREIGN KEY (order_hub_id) 
      REFERENCES public.order_hub(id) 
      ON DELETE SET NULL;
    RAISE NOTICE 'Added FK for product_returns';
  ELSE
    RAISE NOTICE 'FK already exists for product_returns';
  END IF;
END $$;

-- 2) refunds
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_refunds_order_hub' 
    AND table_name = 'refunds'
  ) THEN
    ALTER TABLE public.refunds
      ADD CONSTRAINT fk_refunds_order_hub
      FOREIGN KEY (order_hub_id) 
      REFERENCES public.order_hub(id) 
      ON DELETE SET NULL;
    RAISE NOTICE 'Added FK for refunds';
  ELSE
    RAISE NOTICE 'FK already exists for refunds';
  END IF;
END $$;

-- 3) shipments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_shipments_order_hub' 
    AND table_name = 'shipments'
  ) THEN
    ALTER TABLE public.shipments
      ADD CONSTRAINT fk_shipments_order_hub
      FOREIGN KEY (order_hub_id) 
      REFERENCES public.order_hub(id) 
      ON DELETE SET NULL;
    RAISE NOTICE 'Added FK for shipments';
  ELSE
    RAISE NOTICE 'FK already exists for shipments';
  END IF;
END $$;

-- 4) invoices
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_invoices_order_hub' 
    AND table_name = 'invoices'
  ) THEN
    ALTER TABLE public.invoices
      ADD CONSTRAINT fk_invoices_order_hub
      FOREIGN KEY (order_hub_id) 
      REFERENCES public.order_hub(id) 
      ON DELETE SET NULL;
    RAISE NOTICE 'Added FK for invoices';
  ELSE
    RAISE NOTICE 'FK already exists for invoices';
  END IF;
END $$;

-- 5) التحقق النهائي
SELECT 
  table_name,
  constraint_name,
  'FK Added Successfully' as status
FROM information_schema.table_constraints
WHERE constraint_name IN (
  'fk_returns_order_hub',
  'fk_refunds_order_hub', 
  'fk_shipments_order_hub',
  'fk_invoices_order_hub'
)
ORDER BY table_name;
