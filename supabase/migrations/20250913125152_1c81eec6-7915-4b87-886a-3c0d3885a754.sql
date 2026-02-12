-- إنشاء الجداول المفقودة فقط
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

-- تمكين RLS
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_reservations ENABLE ROW LEVEL SECURITY;

-- سياسات بسيطة
CREATE POLICY "Enable read access for warehouses" ON public.warehouses FOR ALL USING (true);
CREATE POLICY "Enable read access for inventory_items" ON public.inventory_items FOR ALL USING (true);
CREATE POLICY "Enable read access for inventory_reservations" ON public.inventory_reservations FOR ALL USING (true);