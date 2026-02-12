-- ====================================
-- المرحلة 4(ب): توحيد نظام الشحن (مُصحَّح)
-- ====================================

-- 1️⃣ إضافة الحقول المفقودة في جدول shipments
ALTER TABLE public.shipments 
ADD COLUMN IF NOT EXISTS tracking_url TEXT,
ADD COLUMN IF NOT EXISTS estimated_delivery_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS actual_delivery_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS current_location TEXT,
ADD COLUMN IF NOT EXISTS last_update_time TIMESTAMPTZ DEFAULT NOW();

-- 2️⃣ إنشاء جدول shipment_events للأحداث التاريخية
CREATE TABLE IF NOT EXISTS public.shipment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  event_description TEXT,
  location TEXT,
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3️⃣ إضافة فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_shipment_events_shipment_id 
ON public.shipment_events(shipment_id);

CREATE INDEX IF NOT EXISTS idx_shipment_events_timestamp 
ON public.shipment_events(event_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number 
ON public.shipments(tracking_number) WHERE tracking_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_shipments_status 
ON public.shipments(status);

-- 4️⃣ إضافة FK بين shipment_events و shipments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_shipment_events_shipment'
  ) THEN
    ALTER TABLE public.shipment_events 
    ADD CONSTRAINT fk_shipment_events_shipment 
    FOREIGN KEY (shipment_id) 
    REFERENCES public.shipments(id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- 5️⃣ دالة لتسجيل أحداث الشحن تلقائياً
CREATE OR REPLACE FUNCTION public.log_shipment_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- تسجيل إنشاء شحنة جديدة
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.shipment_events (
      shipment_id,
      event_type,
      event_description,
      location,
      event_timestamp
    ) VALUES (
      NEW.id,
      'CREATED',
      'تم إنشاء الشحنة',
      NEW.current_location,
      NOW()
    );
  END IF;

  -- تسجيل تغيير الحالة
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.shipment_events (
      shipment_id,
      event_type,
      event_description,
      location,
      event_timestamp
    ) VALUES (
      NEW.id,
      NEW.status,
      'تغيير حالة الشحنة إلى: ' || NEW.status,
      NEW.current_location,
      NOW()
    );
  END IF;

  -- تسجيل تحديث الموقع
  IF TG_OP = 'UPDATE' AND OLD.current_location IS DISTINCT FROM NEW.current_location 
     AND NEW.current_location IS NOT NULL THEN
    INSERT INTO public.shipment_events (
      shipment_id,
      event_type,
      event_description,
      location,
      event_timestamp
    ) VALUES (
      NEW.id,
      'LOCATION_UPDATE',
      'تحديث موقع الشحنة',
      NEW.current_location,
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$;

-- 6️⃣ Triggers لتسجيل الأحداث تلقائياً
DROP TRIGGER IF EXISTS trg_log_shipment_changes ON public.shipments;
CREATE TRIGGER trg_log_shipment_changes
  AFTER INSERT OR UPDATE ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.log_shipment_event();

-- 7️⃣ دالة للحصول على تاريخ الشحنة الكامل
CREATE OR REPLACE FUNCTION public.get_shipment_history(p_shipment_id UUID)
RETURNS TABLE (
  event_id UUID,
  event_type TEXT,
  event_description TEXT,
  location TEXT,
  event_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id as event_id,
    event_type,
    event_description,
    location,
    event_timestamp,
    created_at
  FROM public.shipment_events
  WHERE shipment_id = p_shipment_id
  ORDER BY event_timestamp DESC;
$$;

-- 8️⃣ دالة للحصول على آخر حدث لشحنة
CREATE OR REPLACE FUNCTION public.get_latest_shipment_event(p_shipment_id UUID)
RETURNS TABLE (
  event_type TEXT,
  event_description TEXT,
  location TEXT,
  event_timestamp TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    event_type,
    event_description,
    location,
    event_timestamp
  FROM public.shipment_events
  WHERE shipment_id = p_shipment_id
  ORDER BY event_timestamp DESC
  LIMIT 1;
$$;

-- 9️⃣ View موحد للشحنات مع آخر حدث
CREATE OR REPLACE VIEW public.shipments_with_latest_event AS
SELECT 
  s.*,
  (SELECT jsonb_build_object(
    'event_type', se.event_type,
    'event_description', se.event_description,
    'location', se.location,
    'event_timestamp', se.event_timestamp
  )
  FROM public.shipment_events se
  WHERE se.shipment_id = s.id
  ORDER BY se.event_timestamp DESC
  LIMIT 1) as latest_event
FROM public.shipments s;

-- تعليقات توضيحية
COMMENT ON TABLE public.shipments IS 'جدول الشحنات الموحد - يحتوي على جميع بيانات الشحن والتتبع';
COMMENT ON TABLE public.shipment_events IS 'سجل تاريخي كامل لجميع أحداث الشحنات';
COMMENT ON FUNCTION public.get_shipment_history IS 'دالة للحصول على التاريخ الكامل لشحنة معينة';
COMMENT ON FUNCTION public.log_shipment_event IS 'دالة تلقائية لتسجيل جميع التغييرات على الشحنات';
COMMENT ON VIEW public.shipments_with_latest_event IS 'عرض موحد للشحنات مع آخر حدث';