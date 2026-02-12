-- إنشاء جداول نظام إدارة المخازن

-- جدول المخازن
CREATE TABLE public.warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    location TEXT,
    address JSONB,
    manager_id UUID REFERENCES public.profiles(id),
    shop_id UUID REFERENCES public.shops(id),
    is_active BOOLEAN DEFAULT true,
    capacity_limit INTEGER,
    current_utilization INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- جدول عناصر المخزون
CREATE TABLE public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id),
    warehouse_id UUID REFERENCES public.warehouses(id),
    sku TEXT NOT NULL,
    quantity_available INTEGER DEFAULT 0,
    quantity_reserved INTEGER DEFAULT 0,
    quantity_on_order INTEGER DEFAULT 0,
    reorder_level INTEGER DEFAULT 0,
    max_stock_level INTEGER,
    unit_cost DECIMAL(10,2),
    location_in_warehouse TEXT,
    batch_number TEXT,
    expiry_date DATE,
    last_counted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(product_id, warehouse_id, batch_number)
);

-- جدول حركات المخزون
CREATE TABLE public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_item_id UUID REFERENCES public.inventory_items(id),
    movement_type TEXT NOT NULL CHECK (movement_type IN ('IN', 'OUT', 'TRANSFER', 'ADJUSTMENT')),
    quantity INTEGER NOT NULL,
    reference_type TEXT, -- 'ORDER', 'TRANSFER', 'ADJUSTMENT', 'RETURN'
    reference_id UUID,
    reason TEXT,
    performed_by UUID REFERENCES public.profiles(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- جدول حجوزات المخزون
CREATE TABLE public.inventory_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_item_id UUID REFERENCES public.inventory_items(id),
    order_id UUID,
    reserved_quantity INTEGER NOT NULL,
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'FULFILLED', 'CANCELLED', 'EXPIRED')),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- جدول تنبيهات المخزون
CREATE TABLE public.stock_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_item_id UUID REFERENCES public.inventory_items(id),
    alert_type TEXT NOT NULL CHECK (alert_type IN ('LOW_STOCK', 'OUT_OF_STOCK', 'OVERSTOCK', 'EXPIRING_SOON')),
    priority TEXT DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    message TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- إنشاء فهارس للأداء
CREATE INDEX idx_inventory_items_warehouse_id ON public.inventory_items(warehouse_id);
CREATE INDEX idx_inventory_items_product_id ON public.inventory_items(product_id);
CREATE INDEX idx_inventory_items_sku ON public.inventory_items(sku);
CREATE INDEX idx_inventory_movements_item_id ON public.inventory_movements(inventory_item_id);
CREATE INDEX idx_inventory_movements_created_at ON public.inventory_movements(created_at);
CREATE INDEX idx_inventory_reservations_item_id ON public.inventory_reservations(inventory_item_id);
CREATE INDEX idx_inventory_reservations_status ON public.inventory_reservations(status);
CREATE INDEX idx_stock_alerts_item_id ON public.stock_alerts(inventory_item_id);
CREATE INDEX idx_stock_alerts_is_resolved ON public.stock_alerts(is_resolved);

-- تفعيل Row Level Security
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للمخازن
CREATE POLICY "Shop owners can manage their warehouses" ON public.warehouses
    FOR ALL USING (
        shop_id IN (
            SELECT s.id FROM shops s 
            JOIN profiles p ON p.id = s.owner_id 
            WHERE p.auth_user_id = auth.uid()
        )
    );

-- سياسات الأمان لعناصر المخزون
CREATE POLICY "Warehouse access for inventory items" ON public.inventory_items
    FOR ALL USING (
        warehouse_id IN (
            SELECT w.id FROM warehouses w 
            JOIN shops s ON s.id = w.shop_id
            JOIN profiles p ON p.id = s.owner_id 
            WHERE p.auth_user_id = auth.uid()
        )
    );

-- سياسات الأمان لحركات المخزون
CREATE POLICY "Warehouse access for inventory movements" ON public.inventory_movements
    FOR ALL USING (
        inventory_item_id IN (
            SELECT ii.id FROM inventory_items ii
            JOIN warehouses w ON w.id = ii.warehouse_id
            JOIN shops s ON s.id = w.shop_id
            JOIN profiles p ON p.id = s.owner_id 
            WHERE p.auth_user_id = auth.uid()
        )
    );

-- سياسات الأمان لحجوزات المخزون
CREATE POLICY "Warehouse access for inventory reservations" ON public.inventory_reservations
    FOR ALL USING (
        inventory_item_id IN (
            SELECT ii.id FROM inventory_items ii
            JOIN warehouses w ON w.id = ii.warehouse_id
            JOIN shops s ON s.id = w.shop_id
            JOIN profiles p ON p.id = s.owner_id 
            WHERE p.auth_user_id = auth.uid()
        )
    );

-- سياسات الأمان للتنبيهات
CREATE POLICY "Warehouse access for stock alerts" ON public.stock_alerts
    FOR ALL USING (
        inventory_item_id IN (
            SELECT ii.id FROM inventory_items ii
            JOIN warehouses w ON w.id = ii.warehouse_id
            JOIN shops s ON s.id = w.shop_id
            JOIN profiles p ON p.id = s.owner_id 
            WHERE p.auth_user_id = auth.uid()
        )
    );

-- دالة لتحديث الحقول التلقائيا
CREATE OR REPLACE FUNCTION public.update_inventory_item_quantities()
RETURNS TRIGGER AS $$
BEGIN
    -- تحديث الكمية المحجوزة
    UPDATE public.inventory_items 
    SET quantity_reserved = (
        SELECT COALESCE(SUM(reserved_quantity), 0) 
        FROM public.inventory_reservations 
        WHERE inventory_item_id = NEW.inventory_item_id 
        AND status = 'ACTIVE'
    )
    WHERE id = NEW.inventory_item_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تحديث timestamps تلقائيا
CREATE TRIGGER update_warehouses_updated_at
    BEFORE UPDATE ON public.warehouses
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_inventory_items_updated_at
    BEFORE UPDATE ON public.inventory_items
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_inventory_reservations_updated_at
    BEFORE UPDATE ON public.inventory_reservations
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- تحديث الكميات المحجوزة عند تغيير الحجوزات
CREATE TRIGGER update_reserved_quantities
    AFTER INSERT OR UPDATE OR DELETE ON public.inventory_reservations
    FOR EACH ROW EXECUTE FUNCTION public.update_inventory_item_quantities();

-- دالة لإنشاء تنبيهات المخزون التلقائية
CREATE OR REPLACE FUNCTION public.check_stock_alerts()
RETURNS TRIGGER AS $$
BEGIN
    -- تنبيه نفاد المخزون
    IF NEW.quantity_available = 0 THEN
        INSERT INTO public.stock_alerts (inventory_item_id, alert_type, priority, message)
        VALUES (NEW.id, 'OUT_OF_STOCK', 'CRITICAL', 'المنتج نفد من المخزون تماماً')
        ON CONFLICT DO NOTHING;
    
    -- تنبيه انخفاض المخزون
    ELSIF NEW.quantity_available <= NEW.reorder_level AND NEW.reorder_level > 0 THEN
        INSERT INTO public.stock_alerts (inventory_item_id, alert_type, priority, message)
        VALUES (NEW.id, 'LOW_STOCK', 'HIGH', 'المخزون أقل من الحد الأدنى المطلوب')
        ON CONFLICT DO NOTHING;
    
    -- تنبيه زيادة المخزون
    ELSIF NEW.max_stock_level IS NOT NULL AND NEW.quantity_available > NEW.max_stock_level THEN
        INSERT INTO public.stock_alerts (inventory_item_id, alert_type, priority, message)
        VALUES (NEW.id, 'OVERSTOCK', 'MEDIUM', 'المخزون يتجاوز الحد الأقصى المسموح')
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- تنبيه انتهاء الصلاحية
    IF NEW.expiry_date IS NOT NULL AND NEW.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN
        INSERT INTO public.stock_alerts (inventory_item_id, alert_type, priority, message)
        VALUES (NEW.id, 'EXPIRING_SOON', 'HIGH', 'المنتج سينتهي صلاحيته قريباً')
        ON CONFLICT DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تشغيل فحص التنبيهات عند تحديث المخزون
CREATE TRIGGER check_stock_alerts_trigger
    AFTER INSERT OR UPDATE OF quantity_available, reorder_level, max_stock_level, expiry_date
    ON public.inventory_items
    FOR EACH ROW EXECUTE FUNCTION public.check_stock_alerts();