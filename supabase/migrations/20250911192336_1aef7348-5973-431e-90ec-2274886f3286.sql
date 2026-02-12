-- Update profiles table for affiliate system
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level user_level DEFAULT 'bronze';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_earnings DECIMAL(10,2) DEFAULT 0;

-- Update merchants table to work with existing profiles
ALTER TABLE public.merchants DROP COLUMN IF EXISTS user_profile_id;
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

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

-- Update products table for affiliate system
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

-- Update order_items for commission tracking
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) NOT NULL DEFAULT 15.00;

-- Update commissions table
ALTER TABLE public.commissions ADD COLUMN IF NOT EXISTS affiliate_profile_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.commissions ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.commissions ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;