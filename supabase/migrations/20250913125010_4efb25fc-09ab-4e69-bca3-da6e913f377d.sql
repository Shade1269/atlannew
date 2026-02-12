-- إنشاء الجداول المفقودة لنظام المخازن

-- جدول المخازن
CREATE TABLE IF NOT EXISTS public.warehouses (
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

-- جدول متغيرات المنتجات (إذا كان مفقود)
CREATE TABLE IF NOT EXISTS public.product_variants (
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

-- جدول عناصر المخزون
CREATE TABLE IF NOT EXISTS public.inventory_items (
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

-- جدول حجوزات المخزون
CREATE TABLE IF NOT EXISTS public.inventory_reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  quantity_reserved INTEGER NOT NULL,
  reserved_for TEXT NOT NULL,
  reservation_type TEXT DEFAULT 'ORDER' CHECK (reservation_type IN ('ORDER', 'TRANSFER', 'MAINTENANCE', 'OTHER')),
  expires_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'FULFILLED', 'CANCELLED', 'EXPIRED')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول المرتجعات
CREATE TABLE IF NOT EXISTS public.returns (
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

-- تمكين RLS للجداول الجديدة
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;

-- إضافة السياسات الأمنية
CREATE POLICY "Users can view warehouses" ON public.warehouses FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage warehouses" ON public.warehouses FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view product variants" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage product variants" ON public.product_variants FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view inventory items" ON public.inventory_items FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage inventory items" ON public.inventory_items FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view inventory reservations" ON public.inventory_reservations FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage inventory reservations" ON public.inventory_reservations FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view returns" ON public.returns FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage returns" ON public.returns FOR ALL USING (auth.uid() IS NOT NULL);

-- إضافة triggers للتحديث التلقائي للتواريخ
CREATE TRIGGER update_warehouses_updated_at BEFORE UPDATE ON public.warehouses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inventory_reservations_updated_at BEFORE UPDATE ON public.inventory_reservations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_returns_updated_at BEFORE UPDATE ON public.returns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();