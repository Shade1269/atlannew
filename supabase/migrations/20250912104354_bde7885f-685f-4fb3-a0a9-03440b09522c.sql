-- إنشاء نظام إدارة الشحن والتوصيل

-- جدول شركات الشحن
CREATE TABLE public.shipping_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_en TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    api_endpoint TEXT,
    supported_services JSONB DEFAULT '[]',
    configuration JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- جدول المناطق والمدن
CREATE TABLE public.shipping_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_en TEXT NOT NULL,
    zone_code TEXT UNIQUE NOT NULL,
    zone_type TEXT NOT NULL CHECK (zone_type IN ('region', 'city', 'district')),
    parent_zone_id UUID REFERENCES public.shipping_zones(id),
    postal_codes TEXT[],
    is_active BOOLEAN DEFAULT true,
    delivery_days_min INTEGER DEFAULT 1,
    delivery_days_max INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- جدول أسعار الشحن
CREATE TABLE public.shipping_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES public.shipping_providers(id) NOT NULL,
    zone_id UUID REFERENCES public.shipping_zones(id) NOT NULL,
    service_type TEXT NOT NULL, -- express, standard, economy
    weight_from DECIMAL(8,2) DEFAULT 0,
    weight_to DECIMAL(8,2) DEFAULT 999999,
    price_per_kg DECIMAL(8,2) DEFAULT 0,
    base_price DECIMAL(8,2) DEFAULT 0,
    min_price DECIMAL(8,2) DEFAULT 0,
    max_price DECIMAL(8,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(provider_id, zone_id, service_type, weight_from, weight_to)
);

-- جدول الشحنات
CREATE TABLE public.shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_number TEXT UNIQUE NOT NULL,
    order_id UUID REFERENCES public.orders(id),
    shop_id UUID REFERENCES public.shops(id),
    provider_id UUID REFERENCES public.shipping_providers(id) NOT NULL,
    tracking_number TEXT,
    external_tracking_id TEXT,
    
    -- بيانات المرسل
    sender_name TEXT NOT NULL,
    sender_phone TEXT NOT NULL,
    sender_address JSONB NOT NULL,
    
    -- بيانات المستلم
    recipient_name TEXT NOT NULL,
    recipient_phone TEXT NOT NULL,
    recipient_address JSONB NOT NULL,
    
    -- تفاصيل الشحنة
    service_type TEXT NOT NULL,
    weight_kg DECIMAL(8,2) NOT NULL,
    dimensions JSONB, -- {length, width, height}
    declared_value DECIMAL(10,2),
    cash_on_delivery DECIMAL(10,2) DEFAULT 0,
    
    -- التكاليف
    shipping_cost DECIMAL(8,2) NOT NULL,
    insurance_cost DECIMAL(8,2) DEFAULT 0,
    cod_fee DECIMAL(8,2) DEFAULT 0,
    total_cost DECIMAL(8,2) NOT NULL,
    
    -- الحالة والتتبع
    status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, CONFIRMED, PICKED_UP, IN_TRANSIT, DELIVERED, RETURNED, CANCELLED
    current_location TEXT,
    estimated_delivery DATE,
    actual_delivery_date TIMESTAMP WITH TIME ZONE,
    
    -- بيانات إضافية
    special_instructions TEXT,
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- جدول تتبع الشحنات (لحفظ تاريخ التتبع)
CREATE TABLE public.shipment_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID REFERENCES public.shipments(id) NOT NULL,
    status TEXT NOT NULL,
    status_description TEXT,
    location TEXT,
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
    provider_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE public.shipping_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_tracking ENABLE ROW LEVEL SECURITY;

-- Policies للشحن
CREATE POLICY "Public can view shipping providers" ON public.shipping_providers FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view shipping zones" ON public.shipping_zones FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view shipping rates" ON public.shipping_rates FOR SELECT USING (is_active = true);

CREATE POLICY "Shop owners can manage their shipments" ON public.shipments FOR ALL USING (
    shop_id IN (
        SELECT s.id FROM shops s 
        JOIN profiles p ON p.id = s.owner_id 
        WHERE p.auth_user_id = auth.uid()
    )
);

CREATE POLICY "Shop owners can view their shipment tracking" ON public.shipment_tracking FOR SELECT USING (
    shipment_id IN (
        SELECT sh.id FROM shipments sh 
        JOIN shops s ON s.id = sh.shop_id
        JOIN profiles p ON p.id = s.owner_id 
        WHERE p.auth_user_id = auth.uid()
    )
);

-- دالة لتوليد رقم الشحنة
CREATE OR REPLACE FUNCTION public.generate_shipment_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_year TEXT;
    current_month TEXT;
    sequence_num INTEGER;
BEGIN
    current_year := EXTRACT(YEAR FROM NOW())::TEXT;
    current_month := LPAD(EXTRACT(MONTH FROM NOW())::TEXT, 2, '0');
    
    SELECT COALESCE(
        MAX(CAST(SUBSTRING(shipment_number FROM 9) AS INTEGER)), 0
    ) + 1 INTO sequence_num
    FROM shipments 
    WHERE shipment_number LIKE 'SHP' || current_year || current_month || '%';
    
    RETURN 'SHP' || current_year || current_month || LPAD(sequence_num::TEXT, 4, '0');
END;
$$;

-- تريجر لتوليد رقم الشحنة تلقائياً
CREATE OR REPLACE FUNCTION public.set_shipment_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF NEW.shipment_number IS NULL OR NEW.shipment_number = '' THEN
        NEW.shipment_number := generate_shipment_number();
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER set_shipment_number_trigger
    BEFORE INSERT ON public.shipments
    FOR EACH ROW EXECUTE FUNCTION public.set_shipment_number();

-- تريجر لتحديث updated_at
CREATE TRIGGER update_shipments_updated_at
    BEFORE UPDATE ON public.shipments
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_shipping_providers_updated_at
    BEFORE UPDATE ON public.shipping_providers
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();