-- ====================================
-- المرحلة 4(ب): توحيد نظام الشحن (مُصحّح نهائي)
-- ====================================

-- 1️⃣ إضافة الحقول المفقودة في جدول shipments
ALTER TABLE public.shipments 
ADD COLUMN IF NOT EXISTS tracking_url TEXT,
ADD COLUMN IF NOT EXISTS estimated_delivery_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS actual_delivery_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS current_location TEXT,
ADD COLUMN IF NOT EXISTS last_update_time TIMESTAMPTZ DEFAULT NOW();

-- 2️⃣ إنشاء جدول shipment_events إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS public.shipment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  event_description TEXT,
  location TEXT,
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3️⃣ إضافة عمود created_by إذا لم يكن موجوداً
ALTER TABLE public.shipment_events
ADD COLUMN IF NOT EXISTS created_by UUID;

-- 4️⃣ إضافة فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_shipment_events_shipment_id 
ON public.shipment_events(shipment_id);

CREATE INDEX IF NOT EXISTS idx_shipment_events_timestamp 
ON public.shipment_events(event_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_shipment_events_created_by
ON public.shipment_events(created_by) WHERE created_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number
ON public.shipments(tracking_number) WHERE tracking_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_shipments_status
ON public.shipments(status);

-- 5️⃣ إضافة FK بين shipment_events و shipments
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
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_shipment_events_created_by'
  ) THEN
    ALTER TABLE public.shipment_events 
    ADD CONSTRAINT fk_shipment_events_created_by 
    FOREIGN KEY (created_by) 
    REFERENCES public.profiles(id) 
    ON DELETE SET NULL;
  END IF;
END $$;

-- 6️⃣ دالة لتسجيل إنشاء شحنة جديدة
CREATE OR REPLACE FUNCTION public.log_shipment_creation_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
    COALESCE(NEW.current_location, 'نقطة الانطلاق'),
    NEW.created_at
  );
  
  RETURN NEW;
END;
$$;

-- 7️⃣ دالة لتسجيل تحديثات الشحنة
CREATE OR REPLACE FUNCTION public.log_shipment_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- تسجيل تغيير الحالة
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
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
      COALESCE(NEW.current_location, 'غير محدد'),
      NOW()
    );
  END IF;

  -- تسجيل تحديث الموقع
  IF (TG_OP = 'UPDATE' AND OLD.current_location IS DISTINCT FROM NEW.current_location AND NEW.current_location IS NOT NULL) THEN
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

  -- تحديث last_update_time
  NEW.last_update_time := NOW();

  RETURN NEW;
END;
$$;

-- 8️⃣ Triggers لتسجيل الأحداث تلقائياً
DROP TRIGGER IF EXISTS trg_log_shipment_creation ON public.shipments;
CREATE TRIGGER trg_log_shipment_creation
  AFTER INSERT ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.log_shipment_creation_event();

DROP TRIGGER IF EXISTS trg_log_shipment_changes ON public.shipments;
CREATE TRIGGER trg_log_shipment_changes
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.log_shipment_event();

-- 9️⃣ دالة للحصول على تاريخ الشحنة
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

-- 🔟 دالة للحصول على آخر موقع للشحنة
CREATE OR REPLACE FUNCTION public.get_latest_shipment_location(p_shipment_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT location
  FROM public.shipment_events
  WHERE shipment_id = p_shipment_id
    AND location IS NOT NULL
  ORDER BY event_timestamp DESC
  LIMIT 1;
$$;

COMMENT ON TABLE public.shipments IS 'جدول الشحنات الموحد - يحتوي على جميع بيانات الشحن والتتبع';
COMMENT ON TABLE public.shipment_events IS 'سجل تاريخي لجميع أحداث الشحنات - يتم تحديثه تلقائياً عبر Triggers';