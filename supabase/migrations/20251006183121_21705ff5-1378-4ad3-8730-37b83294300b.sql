-- Merchants RLS fix: Step 1 - Remove old policies only

DROP POLICY IF EXISTS "Merchants can insert own merchant record" ON public.merchants;
DROP POLICY IF EXISTS "Merchants can view own merchant record" ON public.merchants;
DROP POLICY IF EXISTS "Merchants can update own merchant record" ON public.merchants;
DROP POLICY IF EXISTS "Admins can manage all merchants" ON public.merchants;
