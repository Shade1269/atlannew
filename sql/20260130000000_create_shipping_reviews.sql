-- Create shipping_reviews table
CREATE TABLE IF NOT EXISTS public.shipping_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    tracking_number TEXT NOT NULL,
    shipping_provider TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    comment TEXT,
    delivery_speed INTEGER CHECK (delivery_speed >= 1 AND delivery_speed <= 5),
    packaging_quality INTEGER CHECK (packaging_quality >= 1 AND packaging_quality <= 5),
    customer_service INTEGER CHECK (customer_service >= 1 AND customer_service <= 5),
    customer_name TEXT,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.shipping_reviews ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Shipping reviews are viewable by everyone" 
    ON public.shipping_reviews FOR SELECT 
    USING (true);

CREATE POLICY "Authenticated users can insert reviews" 
    ON public.shipping_reviews FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own reviews" 
    ON public.shipping_reviews FOR UPDATE 
    USING (auth.uid() = customer_id);

-- Create simple trigger for updated_at
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.shipping_reviews
    FOR EACH ROW
    EXECUTE PROCEDURE extensions.moddatetime(updated_at);
