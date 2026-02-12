-- ═══════════════════════════════════════════════════════════════
-- STAGE 4 PART 6 (FIXED): Link Tables to Order Hub
-- Correct backfill via shipments intermediate table
-- ═══════════════════════════════════════════════════════════════

-- Step 1: Add order_hub_id columns
ALTER TABLE public.product_returns ADD COLUMN IF NOT EXISTS order_hub_id uuid;
ALTER TABLE public.refunds ADD COLUMN IF NOT EXISTS order_hub_id uuid;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS order_hub_id uuid;
ALTER TABLE public.shipment_tracking ADD COLUMN IF NOT EXISTS order_hub_id uuid;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS order_hub_id uuid;

-- Step 2: Add indexes
CREATE INDEX IF NOT EXISTS idx_product_returns_order_hub_id ON public.product_returns(order_hub_id) WHERE order_hub_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_refunds_order_hub_id ON public.refunds(order_hub_id) WHERE order_hub_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_order_hub_id ON public.invoices(order_hub_id) WHERE order_hub_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shipment_tracking_order_hub_id ON public.shipment_tracking(order_hub_id) WHERE order_hub_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shipments_order_hub_id ON public.shipments(order_hub_id) WHERE order_hub_id IS NOT NULL;

-- Step 3: Backfill product_returns
UPDATE public.product_returns pr
SET order_hub_id = oh.id
FROM public.order_hub oh
WHERE oh.source_order_id = pr.order_id
  AND pr.order_hub_id IS NULL
  AND pr.order_id IS NOT NULL;

-- Step 4: Backfill refunds  
UPDATE public.refunds r
SET order_hub_id = oh.id
FROM public.order_hub oh
WHERE oh.source_order_id = r.order_id
  AND r.order_hub_id IS NULL
  AND r.order_id IS NOT NULL;

-- Step 5: Backfill invoices
UPDATE public.invoices inv
SET order_hub_id = oh.id
FROM public.order_hub oh
WHERE oh.source_order_id = inv.order_id
  AND inv.order_hub_id IS NULL
  AND inv.order_id IS NOT NULL;

-- Step 6: Backfill shipments FIRST (has order_id)
UPDATE public.shipments s
SET order_hub_id = oh.id
FROM public.order_hub oh
WHERE oh.source_order_id = s.order_id
  AND s.order_hub_id IS NULL
  AND s.order_id IS NOT NULL;

-- Step 7: Backfill shipment_tracking via shipments
UPDATE public.shipment_tracking st
SET order_hub_id = s.order_hub_id
FROM public.shipments s
WHERE s.id = st.shipment_id
  AND st.order_hub_id IS NULL
  AND s.order_hub_id IS NOT NULL;

-- Step 8: Add FKs
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_product_returns_order_hub' AND table_name = 'product_returns') THEN
    ALTER TABLE public.product_returns
      ADD CONSTRAINT fk_product_returns_order_hub FOREIGN KEY (order_hub_id) 
      REFERENCES public.order_hub(id) ON DELETE CASCADE NOT VALID;
    ALTER TABLE public.product_returns VALIDATE CONSTRAINT fk_product_returns_order_hub;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_refunds_order_hub' AND table_name = 'refunds') THEN
    ALTER TABLE public.refunds
      ADD CONSTRAINT fk_refunds_order_hub FOREIGN KEY (order_hub_id) 
      REFERENCES public.order_hub(id) ON DELETE CASCADE NOT VALID;
    ALTER TABLE public.refunds VALIDATE CONSTRAINT fk_refunds_order_hub;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_invoices_order_hub' AND table_name = 'invoices') THEN
    ALTER TABLE public.invoices
      ADD CONSTRAINT fk_invoices_order_hub FOREIGN KEY (order_hub_id) 
      REFERENCES public.order_hub(id) ON DELETE CASCADE NOT VALID;
    ALTER TABLE public.invoices VALIDATE CONSTRAINT fk_invoices_order_hub;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_shipments_order_hub' AND table_name = 'shipments') THEN
    ALTER TABLE public.shipments
      ADD CONSTRAINT fk_shipments_order_hub FOREIGN KEY (order_hub_id) 
      REFERENCES public.order_hub(id) ON DELETE SET NULL NOT VALID;
    ALTER TABLE public.shipments VALIDATE CONSTRAINT fk_shipments_order_hub;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_shipment_tracking_order_hub' AND table_name = 'shipment_tracking') THEN
    ALTER TABLE public.shipment_tracking
      ADD CONSTRAINT fk_shipment_tracking_order_hub FOREIGN KEY (order_hub_id) 
      REFERENCES public.order_hub(id) ON DELETE SET NULL NOT VALID;
    ALTER TABLE public.shipment_tracking VALIDATE CONSTRAINT fk_shipment_tracking_order_hub;
  END IF;
END $$;

-- Step 9: Unified view
CREATE OR REPLACE VIEW v_order_hub_with_relations AS
SELECT 
  oh.*,
  (SELECT COUNT(*) FROM public.product_returns WHERE order_hub_id = oh.id) as returns_count,
  (SELECT COUNT(*) FROM public.refunds WHERE order_hub_id = oh.id) as refunds_count,
  (SELECT COUNT(*) FROM public.invoices WHERE order_hub_id = oh.id) as invoices_count,
  (SELECT COUNT(*) FROM public.shipments WHERE order_hub_id = oh.id) as shipments_count
FROM public.order_hub oh;

GRANT SELECT ON v_order_hub_with_relations TO authenticated, anon;

-- Step 10: Summary
DO $$
DECLARE
  total_orders int;
  linked_returns int;
  linked_refunds int;
  linked_invoices int;
  linked_shipments int;
  linked_tracking int;
BEGIN
  SELECT COUNT(*) INTO total_orders FROM public.order_hub;
  SELECT COUNT(*) INTO linked_returns FROM public.product_returns WHERE order_hub_id IS NOT NULL;
  SELECT COUNT(*) INTO linked_refunds FROM public.refunds WHERE order_hub_id IS NOT NULL;
  SELECT COUNT(*) INTO linked_invoices FROM public.invoices WHERE order_hub_id IS NOT NULL;
  SELECT COUNT(*) INTO linked_shipments FROM public.shipments WHERE order_hub_id IS NOT NULL;
  SELECT COUNT(*) INTO linked_tracking FROM public.shipment_tracking WHERE order_hub_id IS NOT NULL;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════';
  RAISE NOTICE '✓ STAGE 4 PART 6 COMPLETE: Order Hub Relations';
  RAISE NOTICE '═══════════════════════════════════════════════';
  RAISE NOTICE '  Total Orders in Hub: %', total_orders;
  RAISE NOTICE '  • Returns Linked: %', linked_returns;
  RAISE NOTICE '  • Refunds Linked: %', linked_refunds;
  RAISE NOTICE '  • Invoices Linked: %', linked_invoices;
  RAISE NOTICE '  • Shipments Linked: %', linked_shipments;
  RAISE NOTICE '  • Tracking Linked: %', linked_tracking;
  RAISE NOTICE '═══════════════════════════════════════════════';
END $$;

COMMENT ON VIEW v_order_hub_with_relations IS 'Order hub with counts of related entities';