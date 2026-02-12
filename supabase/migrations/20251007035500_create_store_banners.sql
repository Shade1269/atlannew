CREATE TABLE IF NOT EXISTS public.store_banners (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES public.affiliate_stores(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    subtitle TEXT,
    image_url TEXT NOT NULL,
    link_url TEXT,
    link_type TEXT DEFAULT 'none' CHECK (link_type IN ('product', 'category', 'external', 'none')),
    position INTEGER DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_banners_store_id ON public.store_banners(store_id);
CREATE INDEX IF NOT EXISTS idx_store_banners_is_active ON public.store_banners(is_active);
CREATE INDEX IF NOT EXISTS idx_store_banners_position ON public.store_banners(position);

ALTER TABLE public.store_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners can view their banners" ON public.store_banners
    FOR SELECT USING (
        store_id IN (
            SELECT id FROM public.affiliate_stores
            WHERE profile_id = (
                SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Store owners can manage their banners" ON public.store_banners
    FOR ALL USING (
        store_id IN (
            SELECT id FROM public.affiliate_stores
            WHERE profile_id = (
                SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Public can view active banners" ON public.store_banners
    FOR SELECT USING (is_active = true);

CREATE TRIGGER update_store_banners_updated_at
    BEFORE UPDATE ON public.store_banners
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO storage.buckets (id, name, public)
VALUES ('store-banners', 'store-banners', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY IF NOT EXISTS "Store owners can upload banner images"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'store-banners' AND
    auth.uid() IS NOT NULL
);

CREATE POLICY IF NOT EXISTS "Banner images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'store-banners');

CREATE POLICY IF NOT EXISTS "Store owners can delete their banner images"
ON storage.objects
FOR DELETE
USING (
    bucket_id = 'store-banners' AND
    auth.uid() IS NOT NULL
);
