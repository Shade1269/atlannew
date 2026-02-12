-- Adjust RLS policies for store_settings to allow public read and restrict writes to shop owners

-- Drop existing overly broad policy if exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'store_settings' AND policyname = 'Shop owners can manage their store settings'
  ) THEN
    EXECUTE 'DROP POLICY "Shop owners can manage their store settings" ON public.store_settings';
  END IF;
END $$;

-- Create separate policies
-- Public can read store settings (needed for public storefront)
CREATE POLICY "Public can view store settings"
ON public.store_settings
FOR SELECT
USING (true);

-- Shop owners can insert their settings
CREATE POLICY "Shop owners can insert store settings"
ON public.store_settings
FOR INSERT
WITH CHECK (shop_id IN (
  SELECT s.id 
  FROM shops s
  JOIN profiles p ON p.id = s.owner_id
  WHERE p.auth_user_id = auth.uid()
));

-- Shop owners can update their settings
CREATE POLICY "Shop owners can update store settings"
ON public.store_settings
FOR UPDATE
USING (shop_id IN (
  SELECT s.id 
  FROM shops s
  JOIN profiles p ON p.id = s.owner_id
  WHERE p.auth_user_id = auth.uid()
));