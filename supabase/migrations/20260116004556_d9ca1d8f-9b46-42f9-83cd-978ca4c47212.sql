-- Add footer settings columns to affiliate_store_settings
ALTER TABLE public.affiliate_store_settings
ADD COLUMN IF NOT EXISTS footer_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS footer_address TEXT,
ADD COLUMN IF NOT EXISTS footer_description TEXT,
ADD COLUMN IF NOT EXISTS footer_links JSONB DEFAULT '{"shop": [], "categories": [], "support": [], "about": []}'::jsonb;