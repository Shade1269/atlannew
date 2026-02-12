-- Drop the incorrect trigger
DROP TRIGGER IF EXISTS trg_order_paid_generate_commissions ON public.ecommerce_orders;

-- Create the correct trigger function that calls the existing function
CREATE OR REPLACE FUNCTION public._on_order_paid_generate_commissions()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'PAID' AND (OLD.payment_status IS NULL OR OLD.payment_status <> 'PAID') THEN
    PERFORM public._generate_commissions_for_order(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Re-create the trigger
CREATE TRIGGER trg_order_paid_generate_commissions
  AFTER UPDATE ON public.ecommerce_orders
  FOR EACH ROW
  EXECUTE FUNCTION public._on_order_paid_generate_commissions();