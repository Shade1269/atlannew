-- Fix RLS for shops to allow owners to create/update/delete their shops
BEGIN;

-- Drop overly broad or misconfigured policy if it exists
DROP POLICY IF EXISTS "Shop owner can manage shops" ON public.shops;

-- Ensure public viewing remains (keep existing policy if present)
-- Create explicit INSERT policy
CREATE POLICY "Shop owners can create shops"
ON public.shops
FOR INSERT
WITH CHECK (
  owner_id IN (
    SELECT p.id FROM public.profiles p
    WHERE p.auth_user_id = auth.uid()
  )
);

-- Explicit UPDATE policy
CREATE POLICY "Shop owners can update shops"
ON public.shops
FOR UPDATE
USING (
  owner_id IN (
    SELECT p.id FROM public.profiles p
    WHERE p.auth_user_id = auth.uid()
  )
)
WITH CHECK (
  owner_id IN (
    SELECT p.id FROM public.profiles p
    WHERE p.auth_user_id = auth.uid()
  )
);

-- Explicit DELETE policy (optional but consistent)
CREATE POLICY "Shop owners can delete shops"
ON public.shops
FOR DELETE
USING (
  owner_id IN (
    SELECT p.id FROM public.profiles p
    WHERE p.auth_user_id = auth.uid()
  )
);

COMMIT;