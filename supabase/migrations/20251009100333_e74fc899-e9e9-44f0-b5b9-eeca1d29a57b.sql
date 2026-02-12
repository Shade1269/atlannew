-- ========================================
-- المرحلة 5: تحسين جدول الشحن (مبسط)
-- ========================================

-- إضافة فهارس فقط لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_shipments_order_id 
  ON public.shipments_tracking(order_id);

CREATE INDEX IF NOT EXISTS idx_shipments_provider 
  ON public.shipments_tracking(shipping_provider_id);

CREATE INDEX IF NOT EXISTS idx_shipments_status 
  ON public.shipments_tracking(current_status);

CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number 
  ON public.shipments_tracking(tracking_number);

CREATE INDEX IF NOT EXISTS idx_shipments_dates 
  ON public.shipments_tracking(estimated_delivery_date, actual_delivery_date);

COMMENT ON TABLE public.shipments_tracking IS 'جدول تتبع الشحنات مع معلومات كاملة عن التسليم';