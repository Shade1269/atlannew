-- حذف الجداول الموجودة المتعلقة بالمخزون القديم
DROP TABLE IF EXISTS public.inventory_reservations CASCADE;
DROP TABLE IF EXISTS public.inventory_items CASCADE;
DROP TABLE IF EXISTS public.inventory_movements CASCADE;
DROP TABLE IF EXISTS public.stock_alerts CASCADE;
DROP TABLE IF EXISTS public.warehouses CASCADE;
DROP TABLE IF EXISTS public.product_variants CASCADE;

-- حذف functions وtriggers المتعلقة بالنظام القديم
DROP FUNCTION IF EXISTS public.update_inventory_item_quantities() CASCADE;
DROP FUNCTION IF EXISTS public.check_stock_alerts() CASCADE;

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