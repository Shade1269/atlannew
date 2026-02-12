-- Create remaining tables
CREATE TABLE public.merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Orders table
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Enable RLS on new tables
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create helper functions
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role::TEXT FROM public.user_profiles WHERE auth_user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_current_user_profile_id()
RETURNS UUID AS $$
  SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Create basic policies
CREATE POLICY "Merchants can manage their data" ON public.merchants
    FOR ALL USING (user_profile_id = get_current_user_profile_id());

CREATE POLICY "Affiliates can manage their stores" ON public.affiliate_stores
    FOR ALL USING (user_profile_id = get_current_user_profile_id());

CREATE POLICY "Public can view active stores" ON public.affiliate_stores
    FOR SELECT USING (is_active = true);

CREATE POLICY "Merchants can manage their products" ON public.products
    FOR ALL USING (
        merchant_id IN (
            SELECT id FROM public.merchants 
            WHERE user_profile_id = get_current_user_profile_id()
        )
    );

CREATE POLICY "Public can view active products" ON public.products
    FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can create orders" ON public.orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view related orders" ON public.orders
    FOR SELECT USING (
        customer_profile_id = get_current_user_profile_id()
        OR affiliate_store_id IN (
            SELECT id FROM public.affiliate_stores 
            WHERE user_profile_id = get_current_user_profile_id()
        )
        OR get_current_user_role() = 'admin'
    );