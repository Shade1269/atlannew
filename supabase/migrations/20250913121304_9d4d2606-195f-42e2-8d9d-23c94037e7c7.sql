-- إنشاء جدول الموردين
CREATE TABLE public.suppliers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    supplier_number TEXT NOT NULL UNIQUE,
    supplier_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    payment_terms TEXT DEFAULT 'cash',
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول منتجات المخزون
CREATE TABLE public.warehouse_products (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_number TEXT NOT NULL UNIQUE,
    product_name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    supplier_id UUID REFERENCES public.suppliers(id),
    cost_price NUMERIC(10,2) NOT NULL DEFAULT 0,
    selling_price NUMERIC(10,2) NOT NULL DEFAULT 0,
    profit_margin NUMERIC(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN cost_price > 0 THEN ((selling_price - cost_price) / cost_price) * 100
            ELSE 0
        END
    ) STORED,
    min_stock_level INTEGER DEFAULT 1,
    max_stock_level INTEGER,
    barcode TEXT,
    sku TEXT,
    weight NUMERIC(8,2),
    dimensions JSONB,
    has_variants BOOLEAN DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول متغيرات المنتج
CREATE TABLE public.product_variants (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    warehouse_product_id UUID NOT NULL REFERENCES public.warehouse_products(id) ON DELETE CASCADE,
    variant_name TEXT NOT NULL, -- مثل "أحمر - كبير"
    color TEXT,
    size TEXT,
    material TEXT,
    other_attributes JSONB DEFAULT '{}',
    variant_sku TEXT,
    variant_barcode TEXT,
    cost_price NUMERIC(10,2),
    selling_price NUMERIC(10,2),
    current_stock INTEGER NOT NULL DEFAULT 0,
    reserved_stock INTEGER NOT NULL DEFAULT 0,
    available_stock INTEGER GENERATED ALWAYS AS (current_stock - reserved_stock) STORED,
    min_stock_level INTEGER DEFAULT 1,
    image_urls JSONB DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(warehouse_product_id, variant_name)
);

-- إنشاء جدول حركة المخزون
CREATE TABLE public.inventory_movements (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    movement_number TEXT NOT NULL UNIQUE,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('IN', 'OUT', 'ADJUSTMENT', 'RETURN', 'TRANSFER')),
    warehouse_product_id UUID REFERENCES public.warehouse_products(id),
    product_variant_id UUID REFERENCES public.product_variants(id),
    quantity INTEGER NOT NULL,
    unit_cost NUMERIC(10,2),
    total_cost NUMERIC(10,2),
    reference_type TEXT, -- 'order', 'return', 'adjustment', 'purchase'
    reference_id UUID, -- معرف الطلب أو المرجع
    supplier_id UUID REFERENCES public.suppliers(id),
    notes TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول المرتجعات
CREATE TABLE public.product_returns (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    return_number TEXT NOT NULL UNIQUE,
    order_id UUID NOT NULL, -- رقم الطلب الأصلي
    order_number TEXT NOT NULL,
    return_type TEXT NOT NULL CHECK (return_type IN ('FULL', 'PARTIAL')),
    return_reason TEXT,
    total_returned_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    commission_deducted NUMERIC(10,2) NOT NULL DEFAULT 0,
    affiliate_id UUID, -- المسوق
    processed_by UUID NOT NULL, -- الموظف الذي عالج الإرجاع
    status TEXT NOT NULL DEFAULT 'PROCESSED' CHECK (status IN ('PROCESSED', 'CANCELLED')),
    return_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول عناصر المرتجعات
CREATE TABLE public.return_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    return_id UUID NOT NULL REFERENCES public.product_returns(id) ON DELETE CASCADE,
    product_variant_id UUID NOT NULL REFERENCES public.product_variants(id),
    product_name TEXT NOT NULL,
    variant_name TEXT NOT NULL,
    quantity_returned INTEGER NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    total_price NUMERIC(10,2) NOT NULL,
    commission_rate NUMERIC(5,2),
    commission_amount NUMERIC(10,2),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول تنبيهات المخزون
CREATE TABLE public.inventory_alerts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('LOW_STOCK', 'OUT_OF_STOCK', 'NEW_PRODUCT', 'PRODUCT_UPDATED', 'RETURN_PROCESSED')),
    priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    product_variant_id UUID REFERENCES public.product_variants(id),
    warehouse_product_id UUID REFERENCES public.warehouse_products(id),
    return_id UUID REFERENCES public.product_returns(id),
    metadata JSONB DEFAULT '{}',
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_for_role TEXT[] DEFAULT ARRAY['admin', 'inventory_manager', 'inventory_staff'],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- إنشاء فهارس للأداء
CREATE INDEX idx_warehouse_products_supplier ON public.warehouse_products(supplier_id);
CREATE INDEX idx_warehouse_products_active ON public.warehouse_products(is_active);
CREATE INDEX idx_product_variants_warehouse_product ON public.product_variants(warehouse_product_id);
CREATE INDEX idx_product_variants_stock ON public.product_variants(available_stock);
CREATE INDEX idx_inventory_movements_product ON public.inventory_movements(warehouse_product_id);
CREATE INDEX idx_inventory_movements_variant ON public.inventory_movements(product_variant_id);
CREATE INDEX idx_inventory_movements_type ON public.inventory_movements(movement_type);
CREATE INDEX idx_inventory_movements_date ON public.inventory_movements(created_at);
CREATE INDEX idx_product_returns_order ON public.product_returns(order_id);
CREATE INDEX idx_inventory_alerts_type ON public.inventory_alerts(alert_type);
CREATE INDEX idx_inventory_alerts_unread ON public.inventory_alerts(is_read) WHERE is_read = false;

-- تمكين Row Level Security
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_alerts ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات الأمان
-- الموردين
CREATE POLICY "Inventory staff can manage suppliers" ON public.suppliers
    FOR ALL USING (
        has_any_role(auth.uid(), ARRAY['admin', 'inventory_manager', 'inventory_staff'])
    );

-- منتجات المخزون  
CREATE POLICY "Inventory staff can manage warehouse products" ON public.warehouse_products
    FOR ALL USING (
        has_any_role(auth.uid(), ARRAY['admin', 'inventory_manager', 'inventory_staff'])
    );

CREATE POLICY "Affiliates can view active warehouse products" ON public.warehouse_products
    FOR SELECT USING (
        is_active = true AND 
        (get_current_user_role() = 'affiliate' OR has_any_role(auth.uid(), ARRAY['admin', 'inventory_manager', 'inventory_staff']))
    );

-- متغيرات المنتج
CREATE POLICY "Inventory staff can manage product variants" ON public.product_variants
    FOR ALL USING (
        has_any_role(auth.uid(), ARRAY['admin', 'inventory_manager', 'inventory_staff'])
    );

CREATE POLICY "Affiliates can view active product variants" ON public.product_variants
    FOR SELECT USING (
        is_active = true AND available_stock > 0 AND
        (get_current_user_role() = 'affiliate' OR has_any_role(auth.uid(), ARRAY['admin', 'inventory_manager', 'inventory_staff']))
    );

-- حركة المخزون
CREATE POLICY "Inventory staff can manage inventory movements" ON public.inventory_movements
    FOR ALL USING (
        has_any_role(auth.uid(), ARRAY['admin', 'inventory_manager', 'inventory_staff'])
    );

-- المرتجعات
CREATE POLICY "Inventory staff can manage returns" ON public.product_returns
    FOR ALL USING (
        has_any_role(auth.uid(), ARRAY['admin', 'inventory_manager', 'inventory_staff'])
    );

CREATE POLICY "Inventory staff can manage return items" ON public.return_items
    FOR ALL USING (
        has_any_role(auth.uid(), ARRAY['admin', 'inventory_manager', 'inventory_staff'])
    );

-- التنبيهات
CREATE POLICY "Users can view relevant alerts" ON public.inventory_alerts
    FOR SELECT USING (
        get_current_user_role() = ANY(created_for_role) OR
        has_any_role(auth.uid(), ARRAY['admin'])
    );

CREATE POLICY "System can create alerts" ON public.inventory_alerts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update alert read status" ON public.inventory_alerts
    FOR UPDATE USING (
        get_current_user_role() = ANY(created_for_role) OR
        has_any_role(auth.uid(), ARRAY['admin'])
    );

-- إنشاء function لتوليد أرقام تسلسلية
CREATE OR REPLACE FUNCTION public.generate_movement_number()
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
        MAX(CAST(SUBSTRING(movement_number FROM 9) AS INTEGER)), 0
    ) + 1 INTO sequence_num
    FROM inventory_movements 
    WHERE movement_number LIKE 'MOV' || current_year || current_month || '%';
    
    RETURN 'MOV' || current_year || current_month || LPAD(sequence_num::TEXT, 4, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_return_number()
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
        MAX(CAST(SUBSTRING(return_number FROM 8) AS INTEGER)), 0
    ) + 1 INTO sequence_num
    FROM product_returns 
    WHERE return_number LIKE 'RET' || current_year || current_month || '%';
    
    RETURN 'RET' || current_year || current_month || LPAD(sequence_num::TEXT, 4, '0');
END;
$$;

-- إنشاء triggers لتوليد الأرقام التسلسلية
CREATE OR REPLACE FUNCTION public.set_movement_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF NEW.movement_number IS NULL OR NEW.movement_number = '' THEN
        NEW.movement_number := generate_movement_number();
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_return_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF NEW.return_number IS NULL OR NEW.return_number = '' THEN
        NEW.return_number := generate_return_number();
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER set_movement_number_trigger
    BEFORE INSERT ON public.inventory_movements
    FOR EACH ROW
    EXECUTE FUNCTION public.set_movement_number();

CREATE TRIGGER set_return_number_trigger
    BEFORE INSERT ON public.product_returns
    FOR EACH ROW
    EXECUTE FUNCTION public.set_return_number();

-- trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_suppliers_updated_at
    BEFORE UPDATE ON public.suppliers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_timestamp();

CREATE TRIGGER update_warehouse_products_updated_at
    BEFORE UPDATE ON public.warehouse_products
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_timestamp();

CREATE TRIGGER update_product_variants_updated_at
    BEFORE UPDATE ON public.product_variants
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_timestamp();