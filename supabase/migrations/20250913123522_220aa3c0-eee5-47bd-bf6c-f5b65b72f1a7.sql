-- إنشاء جداول نظام إدارة المخازن والمخزون

-- جدول المخازن
CREATE TABLE public.warehouses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'Saudi Arabia',
  phone TEXT,
  email TEXT,
  manager_name TEXT,
  storage_capacity INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول الموردين
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_name TEXT NOT NULL,
  supplier_code TEXT UNIQUE NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'Saudi Arabia',
  payment_terms TEXT,
  tax_number TEXT,
  is_active BOOLEAN DEFAULT true,
  rating INTEGER DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول منتجات المخزن
CREATE TABLE public.warehouse_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_code TEXT UNIQUE NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT,
  brand TEXT,
  unit_of_measure TEXT DEFAULT 'piece',
  weight DECIMAL(10,2),
  dimensions TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول متغيرات المنتجات (الألوان، الأحجام، إلخ)
CREATE TABLE public.product_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  warehouse_product_id UUID REFERENCES public.warehouse_products(id) ON DELETE CASCADE,
  variant_name TEXT NOT NULL,
  variant_code TEXT UNIQUE NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  size TEXT,
  color TEXT,
  weight DECIMAL(10,2),
  cost_price DECIMAL(10,2) DEFAULT 0,
  selling_price DECIMAL(10,2) DEFAULT 0,
  available_stock INTEGER DEFAULT 0,
  reserved_stock INTEGER DEFAULT 0,
  reorder_level INTEGER DEFAULT 0,
  max_stock_level INTEGER DEFAULT 1000,
  location_in_warehouse TEXT,
  expiry_date DATE,
  batch_number TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول عناصر المخزون (ربط المنتجات بالمخازن)
CREATE TABLE public.inventory_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE CASCADE,
  product_variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  quantity_available INTEGER DEFAULT 0,
  quantity_reserved INTEGER DEFAULT 0,
  quantity_on_order INTEGER DEFAULT 0,
  reorder_level INTEGER DEFAULT 0,
  max_stock_level INTEGER DEFAULT 1000,
  unit_cost DECIMAL(10,2) DEFAULT 0,
  location TEXT,
  expiry_date DATE,
  batch_number TEXT,
  last_counted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(warehouse_id, product_variant_id)
);

-- جدول حركات المخزون
CREATE TABLE public.inventory_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('IN', 'OUT', 'ADJUSTMENT', 'TRANSFER')),
  quantity INTEGER NOT NULL,
  unit_cost DECIMAL(10,2) DEFAULT 0,
  total_value DECIMAL(10,2) DEFAULT 0,
  reference_number TEXT,
  reason TEXT,
  notes TEXT,
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول التنبيهات
CREATE TABLE public.inventory_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('LOW_STOCK', 'OUT_OF_STOCK', 'OVERSTOCK', 'EXPIRING_SOON', 'EXPIRED')),
  priority TEXT DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول حجوزات المخزون
CREATE TABLE public.inventory_reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  quantity_reserved INTEGER NOT NULL,
  reserved_for TEXT NOT NULL, -- order_id, customer_id, etc.
  reservation_type TEXT DEFAULT 'ORDER' CHECK (reservation_type IN ('ORDER', 'TRANSFER', 'MAINTENANCE', 'OTHER')),
  expires_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'FULFILLED', 'CANCELLED', 'EXPIRED')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول المرتجعات
CREATE TABLE public.returns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  return_number TEXT UNIQUE NOT NULL,
  original_order_id TEXT,
  customer_id UUID,
  quantity_returned INTEGER NOT NULL,
  return_reason TEXT NOT NULL,
  return_condition TEXT CHECK (return_condition IN ('NEW', 'USED', 'DAMAGED', 'DEFECTIVE')),
  refund_amount DECIMAL(10,2) DEFAULT 0,
  restocking_fee DECIMAL(10,2) DEFAULT 0,
  commission_deducted DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'PROCESSED', 'REFUNDED')),
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- فهرسة للأداء
CREATE INDEX idx_inventory_items_warehouse ON public.inventory_items(warehouse_id);
CREATE INDEX idx_inventory_items_sku ON public.inventory_items(sku);
CREATE INDEX idx_inventory_movements_warehouse ON public.inventory_movements(warehouse_id);
CREATE INDEX idx_inventory_movements_created_at ON public.inventory_movements(created_at);
CREATE INDEX idx_inventory_alerts_warehouse ON public.inventory_alerts(warehouse_id);
CREATE INDEX idx_inventory_alerts_unread ON public.inventory_alerts(is_read) WHERE is_read = false;
CREATE INDEX idx_product_variants_warehouse_product ON public.product_variants(warehouse_product_id);
CREATE INDEX idx_warehouse_products_warehouse ON public.warehouse_products(warehouse_id);

-- تمكين RLS
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;

-- سياسات RLS للمخازن
CREATE POLICY "Users can view warehouses" ON public.warehouses FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage warehouses" ON public.warehouses FOR ALL USING (auth.uid() IS NOT NULL);

-- سياسات RLS للموردين
CREATE POLICY "Users can view suppliers" ON public.suppliers FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage suppliers" ON public.suppliers FOR ALL USING (auth.uid() IS NOT NULL);

-- سياسات RLS لمنتجات المخزن
CREATE POLICY "Users can view warehouse products" ON public.warehouse_products FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage warehouse products" ON public.warehouse_products FOR ALL USING (auth.uid() IS NOT NULL);

-- سياسات RLS لمتغيرات المنتجات
CREATE POLICY "Users can view product variants" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage product variants" ON public.product_variants FOR ALL USING (auth.uid() IS NOT NULL);

-- سياسات RLS لعناصر المخزون
CREATE POLICY "Users can view inventory items" ON public.inventory_items FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage inventory items" ON public.inventory_items FOR ALL USING (auth.uid() IS NOT NULL);

-- سياسات RLS لحركات المخزون
CREATE POLICY "Users can view inventory movements" ON public.inventory_movements FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create inventory movements" ON public.inventory_movements FOR INSERT USING (auth.uid() IS NOT NULL);

-- سياسات RLS للتنبيهات
CREATE POLICY "Users can view inventory alerts" ON public.inventory_alerts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage inventory alerts" ON public.inventory_alerts FOR ALL USING (auth.uid() IS NOT NULL);

-- سياسات RLS للحجوزات
CREATE POLICY "Users can view inventory reservations" ON public.inventory_reservations FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage inventory reservations" ON public.inventory_reservations FOR ALL USING (auth.uid() IS NOT NULL);

-- سياسات RLS للمرتجعات
CREATE POLICY "Users can view returns" ON public.returns FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage returns" ON public.returns FOR ALL USING (auth.uid() IS NOT NULL);

-- دوال للتحديث التلقائي للتواريخ
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- إضافة تحديث التواريخ التلقائي
CREATE TRIGGER update_warehouses_updated_at BEFORE UPDATE ON public.warehouses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_warehouse_products_updated_at BEFORE UPDATE ON public.warehouse_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inventory_reservations_updated_at BEFORE UPDATE ON public.inventory_reservations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_returns_updated_at BEFORE UPDATE ON public.returns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();