-- First, drop ALL triggers that might be calling wrong functions
DROP TRIGGER IF EXISTS trg_order_paid_generate_commissions ON public.ecommerce_orders;
DROP TRIGGER IF EXISTS trg_ecommerce_order_paid ON public.ecommerce_orders;

-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS public._on_order_paid_generate_commissions() CASCADE;
DROP FUNCTION IF EXISTS public._on_order_paid_generate_commissions(uuid) CASCADE;

-- Create the CORRECT trigger function (no parameters - it's a trigger function)
CREATE OR REPLACE FUNCTION public._on_order_paid_generate_commissions()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'PAID' AND (OLD.payment_status IS DISTINCT FROM 'PAID') THEN
    PERFORM public._generate_commissions_for_order(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the trigger
CREATE TRIGGER trg_order_paid_generate_commissions
  AFTER UPDATE OF payment_status ON public.ecommerce_orders
  FOR EACH ROW
  EXECUTE FUNCTION public._on_order_paid_generate_commissions();