-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user roles enum
CREATE TYPE user_role AS ENUM ('admin', 'merchant', 'affiliate', 'customer');

-- Create order status enum  
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned');

-- Create theme enum
CREATE TYPE theme_type AS ENUM ('classic', 'feminine', 'damascus');

-- Create level enum
CREATE TYPE user_level AS ENUM ('bronze', 'silver', 'gold', 'legendary');

-- Users profiles table
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'customer',
    level user_level NOT NULL DEFAULT 'bronze',
    points INTEGER NOT NULL DEFAULT 0,
    total_earnings DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(auth_user_id),
    UNIQUE(email),
    UNIQUE(phone)
);

-- Merchants table
CREATE TABLE public.merchants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_profile_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    business_license TEXT,
    tax_number TEXT,
    bank_iban TEXT,
    warehouse_address JSONB,
    contact_phone TEXT,
    return_policy TEXT,
    default_commission_rate DECIMAL(5,2) NOT NULL DEFAULT 15.00,
    is_approved BOOLEAN NOT NULL DEFAULT false,
    approval_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Affiliate stores table
CREATE TABLE public.affiliate_stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_profile_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
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

-- Products table
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    price_sar DECIMAL(10,2) NOT NULL,
    category TEXT,
    images JSONB DEFAULT '[]',
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    sku TEXT,
    commission_rate DECIMAL(5,2),
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    view_count INTEGER DEFAULT 0,
    sales_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Affiliate product selections
CREATE TABLE public.affiliate_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_store_id UUID REFERENCES public.affiliate_stores(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    is_visible BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(affiliate_store_id, product_id)
);

-- Orders table
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL,
    customer_profile_id UUID REFERENCES public.user_profiles(id),
    affiliate_store_id UUID REFERENCES public.affiliate_stores(id),
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    shipping_address JSONB NOT NULL,
    payment_method TEXT NOT NULL,
    subtotal_sar DECIMAL(10,2) NOT NULL,
    shipping_sar DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_sar DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_sar DECIMAL(10,2) NOT NULL,
    status order_status NOT NULL DEFAULT 'pending',
    notes TEXT,
    tracking_number TEXT,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id),
    merchant_id UUID REFERENCES public.merchants(id),
    product_title TEXT NOT NULL,
    product_price_sar DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL,
    commission_rate DECIMAL(5,2) NOT NULL,
    line_total_sar DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Commissions table
CREATE TABLE public.commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_item_id UUID REFERENCES public.order_items(id) ON DELETE CASCADE,
    affiliate_profile_id UUID REFERENCES public.user_profiles(id),
    merchant_id UUID REFERENCES public.merchants(id),
    amount_sar DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(5,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, paid
    confirmed_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Points transactions table
CREATE TABLE public.points_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_profile_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    points_amount INTEGER NOT NULL,
    transaction_type TEXT NOT NULL, -- earned, spent, bonus
    description TEXT NOT NULL,
    reference_id UUID, -- can reference order, product, etc.
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaigns/tracking links table
CREATE TABLE public.campaign_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Reviews table
CREATE TABLE public.product_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    customer_profile_id UUID REFERENCES public.user_profiles(id),
    order_item_id UUID REFERENCES public.order_items(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(order_item_id) -- One review per order item
);

-- Customer wishlists
CREATE TABLE public.wishlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_profile_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(customer_profile_id, product_id)
);

-- Support tickets
CREATE TABLE public.support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_profile_id UUID REFERENCES public.user_profiles(id),
    order_id UUID REFERENCES public.orders(id),
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open', -- open, in_progress, resolved, closed
    priority TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, urgent
    assigned_to UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Create function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role::TEXT FROM public.user_profiles WHERE auth_user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Create function to get current user profile id
CREATE OR REPLACE FUNCTION public.get_current_user_profile_id()
RETURNS UUID AS $$
  SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (auth_user_id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer'::user_role)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER handle_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_merchants_updated_at
    BEFORE UPDATE ON public.merchants
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_affiliate_stores_updated_at
    BEFORE UPDATE ON public.affiliate_stores
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_user_profiles_auth_user_id ON public.user_profiles(auth_user_id);
CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX idx_products_merchant_id ON public.products(merchant_id);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_is_active ON public.products(is_active);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_affiliate_store_id ON public.orders(affiliate_store_id);
CREATE INDEX idx_commissions_status ON public.commissions(status);
CREATE INDEX idx_affiliate_products_store_id ON public.affiliate_products(affiliate_store_id);