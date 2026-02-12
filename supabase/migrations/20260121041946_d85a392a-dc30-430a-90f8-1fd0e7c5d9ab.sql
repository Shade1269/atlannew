-- Fix: Add the missing unique constraint on order_item_id for commissions ON CONFLICT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'commissions_order_item_id_key' 
    AND conrelid = 'public.commissions'::regclass
  ) THEN
    ALTER TABLE public.commissions 
    ADD CONSTRAINT commissions_order_item_id_key UNIQUE (order_item_id);
  END IF;
END;
$$;