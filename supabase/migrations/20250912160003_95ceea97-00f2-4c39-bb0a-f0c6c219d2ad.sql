-- إصلاح التحذيرات الأمنية وإنشاء نظام تتبع الشحنات

-- إصلاح search_path للوظائف الموجودة
ALTER FUNCTION public.get_current_user_phone() SET search_path = public;
ALTER FUNCTION public.get_channel_member_count(uuid) SET search_path = public;
ALTER FUNCTION public.debug_user_profile() SET search_path = public;

-- إنشاء جدول حالات الشحن
CREATE TABLE IF NOT EXISTS public.shipment_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  status TEXT NOT NULL,
  location TEXT,
  notes TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول الشحنات
CREATE TABLE IF NOT EXISTS public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_number TEXT UNIQUE NOT NULL,
  order_id UUID NOT NULL,
  shipping_provider_id UUID REFERENCES shipping_providers(id),
  tracking_number TEXT,
  estimated_delivery_date DATE,
  actual_delivery_date DATE,
  current_status TEXT NOT NULL DEFAULT 'PREPARING',
  current_location TEXT,
  pickup_address JSONB NOT NULL,
  delivery_address JSONB NOT NULL,
  weight_kg NUMERIC,
  dimensions JSONB,
  insurance_amount_sar NUMERIC DEFAULT 0,
  cod_amount_sar NUMERIC DEFAULT 0,
  shipping_cost_sar NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول تتبع تفصيلي للشحنات
CREATE TABLE IF NOT EXISTS public.shipment_tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_description TEXT NOT NULL,
  location TEXT,
  coordinates JSONB,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source TEXT NOT NULL DEFAULT 'SYSTEM',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول إعدادات الشحن لكل متجر
CREATE TABLE IF NOT EXISTS public.shop_shipping_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  default_provider_id UUID REFERENCES shipping_providers(id),
  auto_tracking_enabled BOOLEAN NOT NULL DEFAULT true,
  notification_settings JSONB DEFAULT '{"sms": true, "email": true}',
  pickup_address JSONB NOT NULL,
  return_address JSONB,
  business_hours JSONB DEFAULT '{"sunday": "9:00-17:00", "monday": "9:00-17:00", "tuesday": "9:00-17:00", "wednesday": "9:00-17:00", "thursday": "9:00-17:00"}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(shop_id)
);

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_shipping_settings ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للشحنات
CREATE POLICY "Shop owners can manage shipments" ON public.shipments
FOR ALL USING (
  order_id IN (
    SELECT eo.id FROM ecommerce_orders eo
    JOIN shops s ON s.id = eo.shop_id
    JOIN profiles p ON p.id = s.owner_id
    WHERE p.auth_user_id = auth.uid()
  ) OR get_current_user_role() = 'admin'
);

CREATE POLICY "Customers can view their shipments" ON public.shipments
FOR SELECT USING (
  order_id IN (
    SELECT eo.id FROM ecommerce_orders eo
    JOIN profiles p ON p.id = eo.user_id
    WHERE p.auth_user_id = auth.uid()
  )
);

-- سياسات الأمان لأحداث التتبع
CREATE POLICY "Shop owners can manage tracking events" ON public.shipment_tracking_events
FOR ALL USING (
  shipment_id IN (
    SELECT s.id FROM shipments s
    JOIN ecommerce_orders eo ON eo.id = s.order_id
    JOIN shops sh ON sh.id = eo.shop_id
    JOIN profiles p ON p.id = sh.owner_id
    WHERE p.auth_user_id = auth.uid()
  ) OR get_current_user_role() = 'admin'
);

CREATE POLICY "Customers can view their tracking events" ON public.shipment_tracking_events
FOR SELECT USING (
  shipment_id IN (
    SELECT s.id FROM shipments s
    JOIN ecommerce_orders eo ON eo.id = s.order_id
    JOIN profiles p ON p.id = eo.user_id
    WHERE p.auth_user_id = auth.uid()
  )
);

-- سياسات الأمان لحالات الشحن
CREATE POLICY "Shop owners can manage shipment statuses" ON public.shipment_statuses
FOR ALL USING (
  order_id IN (
    SELECT eo.id FROM ecommerce_orders eo
    JOIN shops s ON s.id = eo.shop_id
    JOIN profiles p ON p.id = s.owner_id
    WHERE p.auth_user_id = auth.uid()
  ) OR get_current_user_role() = 'admin'
);

-- سياسات الأمان لإعدادات الشحن
CREATE POLICY "Shop owners can manage shipping settings" ON public.shop_shipping_settings
FOR ALL USING (
  shop_id IN (
    SELECT s.id FROM shops s
    JOIN profiles p ON p.id = s.owner_id
    WHERE p.auth_user_id = auth.uid()
  ) OR get_current_user_role() = 'admin'
);

-- إنشاء triggers للتحديث التلقائي
CREATE OR REPLACE FUNCTION update_shipment_timestamp() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_shipments_updated_at
  BEFORE UPDATE ON shipments
  FOR EACH ROW EXECUTE FUNCTION update_shipment_timestamp();

CREATE TRIGGER update_shop_shipping_settings_updated_at
  BEFORE UPDATE ON shop_shipping_settings
  FOR EACH ROW EXECUTE FUNCTION update_shipment_timestamp();

-- إنشاء فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number ON shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipment_tracking_events_shipment_id ON shipment_tracking_events(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_tracking_events_timestamp ON shipment_tracking_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_shipment_statuses_order_id ON shipment_statuses(order_id);

-- إضافة وظيفة لتحديث حالة الشحنة تلقائياً
CREATE OR REPLACE FUNCTION update_shipment_status() RETURNS TRIGGER AS $$
BEGIN
  -- تحديث الحالة الحالية في جدول الشحنات
  UPDATE shipments 
  SET 
    current_status = NEW.event_type,
    current_location = NEW.location,
    updated_at = now()
  WHERE id = NEW.shipment_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER auto_update_shipment_status
  AFTER INSERT ON shipment_tracking_events
  FOR EACH ROW EXECUTE FUNCTION update_shipment_status();