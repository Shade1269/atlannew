-- Merchants RLS fix: Step 2 - Create new policies

-- 1) Admins: full manage
CREATE POLICY "Admins can manage all merchants"
ON public.merchants
FOR ALL
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

-- 2) Merchants: insert their own row (must own the profile_id and have merchant role)
CREATE POLICY "Merchants can insert own merchant record"
ON public.merchants
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = profile_id AND p.auth_user_id = auth.uid()
  )
  AND public.has_role(auth.uid(), 'merchant')
);

-- 3) Merchants: select their own row
CREATE POLICY "Merchants can view own merchant record"
ON public.merchants
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = profile_id AND p.auth_user_id = auth.uid()
  )
);

-- 4) Merchants: update their own row
CREATE POLICY "Merchants can update own merchant record"
ON public.merchants
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = profile_id AND p.auth_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = profile_id AND p.auth_user_id = auth.uid()
  )
);
