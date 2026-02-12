-- إصلاح التحذيرات الأمنية وإنشاء نظام تتبع الشحنات (محسن)

-- إصلاح search_path للوظائف الموجودة
ALTER FUNCTION public.get_current_user_phone() SET search_path = public;
ALTER FUNCTION public.get_channel_member_count(uuid) SET search_path = public;
ALTER FUNCTION public.debug_user_profile() SET search_path = public;

-- إنشاء جدول الشحنات المحسن
CREATE TABLE IF NOT EXISTS public.shipments_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_number TEXT UNIQUE NOT NULL,
  order_id UUID NOT NULL,
  shipping_provider_id UUID REFERENCES shipping_providers(id),
  tracking_number TEXT UNIQUE,
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
  special_instructions TEXT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول أحداث التتبع
CREATE TABLE IF NOT EXISTS public.shipment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES shipments_tracking(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_description TEXT NOT NULL,
  location TEXT,
  coordinates JSONB,
  event_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source TEXT NOT NULL DEFAULT 'SYSTEM',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول إعدادات الشحن للمتاجر
CREATE TABLE IF NOT EXISTS public.store_shipping_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  default_provider_id UUID REFERENCES shipping_providers(id),
  auto_tracking_enabled BOOLEAN NOT NULL DEFAULT true,
  notification_settings JSONB DEFAULT '{"sms": true, "email": true, "whatsapp": false}',
  pickup_address JSONB NOT NULL,
  return_address JSONB,
  business_hours JSONB DEFAULT '{"sunday": "9:00-17:00", "monday": "9:00-17:00", "tuesday": "9:00-17:00", "wednesday": "9:00-17:00", "thursday": "9:00-17:00"}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(shop_id)
);

-- تفعيل RLS
ALTER TABLE public.shipments_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_shipping_config ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للشحنات
CREATE POLICY "Shop owners manage shipments tracking" ON public.shipments_tracking
FOR ALL USING (
  order_id IN (
    SELECT eo.id FROM ecommerce_orders eo
    JOIN shops s ON s.id = eo.shop_id
    JOIN profiles p ON p.id = s.owner_id
    WHERE p.auth_user_id = auth.uid()
  ) OR get_current_user_role() = 'admin'
);

CREATE POLICY "Customers view their shipments tracking" ON public.shipments_tracking
FOR SELECT USING (
  order_id IN (
    SELECT eo.id FROM ecommerce_orders eo
    JOIN profiles p ON p.id = eo.user_id
    WHERE p.auth_user_id = auth.uid()
  )
);

-- سياسات أحداث التتبع
CREATE POLICY "Shop owners manage shipment events" ON public.shipment_events
FOR ALL USING (
  shipment_id IN (
    SELECT st.id FROM shipments_tracking st
    JOIN ecommerce_orders eo ON eo.id = st.order_id
    JOIN shops sh ON sh.id = eo.shop_id
    JOIN profiles p ON p.id = sh.owner_id
    WHERE p.auth_user_id = auth.uid()
  ) OR get_current_user_role() = 'admin'
);

CREATE POLICY "Customers view their shipment events" ON public.shipment_events
FOR SELECT USING (
  shipment_id IN (
    SELECT st.id FROM shipments_tracking st
    JOIN ecommerce_orders eo ON eo.id = st.order_id
    JOIN profiles p ON p.id = eo.user_id
    WHERE p.auth_user_id = auth.uid()
  )
);

-- سياسات إعدادات الشحن
CREATE POLICY "Shop owners manage store shipping config" ON public.store_shipping_config
FOR ALL USING (
  shop_id IN (
    SELECT s.id FROM shops s
    JOIN profiles p ON p.id = s.owner_id
    WHERE p.auth_user_id = auth.uid()
  ) OR get_current_user_role() = 'admin'
);

-- إنشاء triggers للتحديث التلقائي (مع فحص الوجود أولاً)
DROP TRIGGER IF EXISTS update_shipments_tracking_timestamp ON shipments_tracking;
DROP TRIGGER IF EXISTS update_store_shipping_config_timestamp ON store_shipping_config;
DROP TRIGGER IF EXISTS auto_update_shipment_status_from_events ON shipment_events;

CREATE OR REPLACE FUNCTION update_tracking_timestamp() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_shipments_tracking_timestamp
  BEFORE UPDATE ON shipments_tracking
  FOR EACH ROW EXECUTE FUNCTION update_tracking_timestamp();

CREATE TRIGGER update_store_shipping_config_timestamp
  BEFORE UPDATE ON store_shipping_config
  FOR EACH ROW EXECUTE FUNCTION update_tracking_timestamp();

-- وظيفة تحديث حالة الشحنة من الأحداث
CREATE OR REPLACE FUNCTION update_shipment_from_event() RETURNS TRIGGER AS $$
BEGIN
  UPDATE shipments_tracking 
  SET 
    current_status = NEW.event_type,
    current_location = NEW.location,
    updated_at = now()
  WHERE id = NEW.shipment_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER auto_update_shipment_status_from_events
  AFTER INSERT ON shipment_events
  FOR EACH ROW EXECUTE FUNCTION update_shipment_from_event();

-- إنشاء فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_order_id ON shipments_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number ON shipments_tracking(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipment_events_shipment_id ON shipment_events(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_events_timestamp ON shipment_events(event_timestamp);

-- وظيفة توليد رقم شحنة
CREATE OR REPLACE FUNCTION generate_shipment_tracking_number()
RETURNS TEXT AS $$
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
    FROM shipments_tracking 
    WHERE shipment_number LIKE 'TRK' || current_year || current_month || '%';
    
    RETURN 'TRK' || current_year || current_month || LPAD(sequence_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- trigger لتوليد رقم الشحنة تلقائياً
CREATE OR REPLACE FUNCTION set_shipment_tracking_number() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.shipment_number IS NULL OR NEW.shipment_number = '' THEN
        NEW.shipment_number := generate_shipment_tracking_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_shipment_tracking_number_trigger
    BEFORE INSERT ON shipments_tracking
    FOR EACH ROW EXECUTE FUNCTION set_shipment_tracking_number();