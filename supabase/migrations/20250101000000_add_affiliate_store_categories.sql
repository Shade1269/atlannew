-- Create affiliate_store_categories table
CREATE TABLE IF NOT EXISTS public.affiliate_store_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_store_id UUID REFERENCES public.affiliate_stores(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(affiliate_store_id, slug)
);

-- Create affiliate_product_categories table (junction table)
CREATE TABLE IF NOT EXISTS public.affiliate_product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.affiliate_store_categories(id) ON DELETE CASCADE NOT NULL,
    affiliate_product_id UUID REFERENCES public.affiliate_products(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(category_id, affiliate_product_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_affiliate_store_categories_store_id ON public.affiliate_store_categories(affiliate_store_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_store_categories_slug ON public.affiliate_store_categories(affiliate_store_id, slug);
CREATE INDEX IF NOT EXISTS idx_affiliate_product_categories_category_id ON public.affiliate_product_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_product_categories_product_id ON public.affiliate_product_categories(affiliate_product_id);

-- Enable RLS (Row Level Security)
ALTER TABLE public.affiliate_store_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_product_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for affiliate_store_categories
CREATE POLICY "Users can view their own store categories"
    ON public.affiliate_store_categories
    FOR SELECT
    USING (
        affiliate_store_id IN (
            SELECT id FROM public.affiliate_stores
            WHERE profile_id IN (
                SELECT id FROM public.profiles
                WHERE auth_user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert their own store categories"
    ON public.affiliate_store_categories
    FOR INSERT
    WITH CHECK (
        affiliate_store_id IN (
            SELECT id FROM public.affiliate_stores
            WHERE profile_id IN (
                SELECT id FROM public.profiles
                WHERE auth_user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update their own store categories"
    ON public.affiliate_store_categories
    FOR UPDATE
    USING (
        affiliate_store_id IN (
            SELECT id FROM public.affiliate_stores
            WHERE profile_id IN (
                SELECT id FROM public.profiles
                WHERE auth_user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete their own store categories"
    ON public.affiliate_store_categories
    FOR DELETE
    USING (
        affiliate_store_id IN (
            SELECT id FROM public.affiliate_stores
            WHERE profile_id IN (
                SELECT id FROM public.profiles
                WHERE auth_user_id = auth.uid()
            )
        )
    );

-- Create policies for affiliate_product_categories
CREATE POLICY "Users can view product categories for their stores"
    ON public.affiliate_product_categories
    FOR SELECT
    USING (
        category_id IN (
            SELECT id FROM public.affiliate_store_categories
            WHERE affiliate_store_id IN (
                SELECT id FROM public.affiliate_stores
                WHERE profile_id IN (
                    SELECT id FROM public.profiles
                    WHERE auth_user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can insert product categories for their stores"
    ON public.affiliate_product_categories
    FOR INSERT
    WITH CHECK (
        category_id IN (
            SELECT id FROM public.affiliate_store_categories
            WHERE affiliate_store_id IN (
                SELECT id FROM public.affiliate_stores
                WHERE profile_id IN (
                    SELECT id FROM public.profiles
                    WHERE auth_user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can delete product categories for their stores"
    ON public.affiliate_product_categories
    FOR DELETE
    USING (
        category_id IN (
            SELECT id FROM public.affiliate_store_categories
            WHERE affiliate_store_id IN (
                SELECT id FROM public.affiliate_stores
                WHERE profile_id IN (
                    SELECT id FROM public.profiles
                    WHERE auth_user_id = auth.uid()
                )
            )
        )
    );

