-- First check existing profiles table structure
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level user_level DEFAULT 'bronze';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_earnings DECIMAL(10,2) DEFAULT 0;

-- Update the enum to match our affiliate system
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'theme_type') THEN
        CREATE TYPE theme_type AS ENUM ('classic', 'feminine', 'damascus');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_level') THEN
        CREATE TYPE user_level AS ENUM ('bronze', 'silver', 'gold', 'legendary');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned');
    END IF;
END
$$;

-- Update merchants table to work with existing profiles
ALTER TABLE public.merchants DROP COLUMN IF EXISTS user_profile_id;
ALTER TABLE public.merchants ADD COLUMN profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Create affiliate stores table
CREATE TABLE IF NOT EXISTS public.affiliate_stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    store_name TEXT NOT NULL,
    store_slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    theme theme_type NOT NULL DEFAULT 'classic',
    bio TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    total_sales DECIMAL(10,2) DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update products table 
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sales_count INTEGER DEFAULT 0;

-- Create affiliate product selections
CREATE TABLE IF NOT EXISTS public.affiliate_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_store_id UUID REFERENCES public.affiliate_stores(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    is_visible BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(affiliate_store_id, product_id)
);

-- Update orders table for affiliate system
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS affiliate_store_id UUID REFERENCES public.affiliate_stores(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_profile_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_sar DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tax_sar DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal_sar DECIMAL(10,2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;

-- Make order_number unique if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'order_number') THEN
        BEGIN
            ALTER TABLE public.orders ADD CONSTRAINT unique_order_number UNIQUE (order_number);
        EXCEPTION
            WHEN duplicate_table THEN
                -- Constraint already exists, skip
        END;
    END IF;
END
$$;

-- Update order_items for commission tracking
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) NOT NULL DEFAULT 15.00;

-- Update commissions table
ALTER TABLE public.commissions ADD COLUMN IF NOT EXISTS affiliate_profile_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.commissions ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.commissions ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

-- Create points transactions table
CREATE TABLE IF NOT EXISTS public.points_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    points_amount INTEGER NOT NULL,
    transaction_type TEXT NOT NULL, -- earned, spent, bonus
    description TEXT NOT NULL,
    reference_id UUID, -- can reference order, product, etc.
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create campaign links table
CREATE TABLE IF NOT EXISTS public.campaign_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_store_id UUID REFERENCES public.affiliate_stores(id) ON DELETE CASCADE,
    campaign_name TEXT NOT NULL,
    tracking_code TEXT UNIQUE NOT NULL,
    target_url TEXT,
    clicks_count INTEGER DEFAULT 0,
    conversions_count INTEGER DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product reviews table
CREATE TABLE IF NOT EXISTS public.product_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    customer_profile_id UUID REFERENCES public.profiles(id),
    order_item_id UUID REFERENCES public.order_items(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(order_item_id) -- One review per order item
);

-- Create wishlists table
CREATE TABLE IF NOT EXISTS public.wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(customer_profile_id, product_id)
);

-- Create support tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id),
    order_id UUID REFERENCES public.orders(id),
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open', -- open, in_progress, resolved, closed
    priority TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, urgent
    assigned_to UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE public.affiliate_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Create updated functions that work with profiles table
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role::TEXT FROM public.profiles WHERE auth_user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_current_profile_id()
RETURNS UUID AS $$
  SELECT id FROM public.profiles WHERE auth_user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER handle_affiliate_stores_updated_at
    BEFORE UPDATE ON public.affiliate_stores
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_campaign_links_updated_at
    BEFORE UPDATE ON public.campaign_links
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_support_tickets_updated_at
    BEFORE UPDATE ON public.support_tickets
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_affiliate_stores_profile_id ON public.affiliate_stores(profile_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_stores_slug ON public.affiliate_stores(store_slug);
CREATE INDEX IF NOT EXISTS idx_affiliate_products_store_id ON public.affiliate_products(affiliate_store_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_profile_id ON public.points_transactions(profile_id);
CREATE INDEX IF NOT EXISTS idx_campaign_links_tracking_code ON public.campaign_links(tracking_code);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_customer_id ON public.wishlists(customer_profile_id);