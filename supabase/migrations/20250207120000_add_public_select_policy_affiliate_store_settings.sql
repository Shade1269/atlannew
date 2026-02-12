-- Allow unauthenticated visitors to read settings for active stores
CREATE POLICY "Public can view active store settings"
ON public.affiliate_store_settings
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.affiliate_stores
    WHERE affiliate_stores.id = affiliate_store_settings.store_id
      AND affiliate_stores.is_active = true
  )
);
