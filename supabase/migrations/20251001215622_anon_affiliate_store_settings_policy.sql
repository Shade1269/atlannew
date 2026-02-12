DROP POLICY IF EXISTS "Anonymous users can view settings for active stores" ON public.affiliate_store_settings;

CREATE POLICY "Anonymous users can view settings for active stores"
ON public.affiliate_store_settings
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1
    FROM public.affiliate_stores
    WHERE affiliate_stores.id = affiliate_store_settings.store_id
      AND affiliate_stores.is_active = true
  )
);
