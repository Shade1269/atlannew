-- Final security hardening - remove public access to sensitive business data

-- 1. Remove public access to merchants table (contains sensitive business/financial data)
DROP POLICY IF EXISTS "Public can view merchants" ON public.merchants;

-- The "Merchant owners can manage merchants" policy already exists and provides proper access control

-- 2. Clean up duplicate order policies (we have both "Shop owners can view their orders" and "Users can view orders for their shops")
DROP POLICY IF EXISTS "Users can view orders for their shops" ON public.orders;

-- Keep the "Shop owners can view their orders" policy as it's clearer

-- 3. Add a more restrictive merchant viewing policy for legitimate business purposes
-- Only allow viewing basic merchant info (business name) but not sensitive financial data like commission rates
CREATE POLICY "Public can view basic merchant info" 
  ON public.merchants 
  FOR SELECT 
  USING (true);

-- Actually, let's remove that too since even business names could be sensitive
DROP POLICY IF EXISTS "Public can view basic merchant info" ON public.merchants;

-- Now merchants table is only accessible by the merchant owners themselves