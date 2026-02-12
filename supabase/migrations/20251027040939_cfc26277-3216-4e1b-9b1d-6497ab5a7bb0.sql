
-- إصلاح النظام المالي: تأكيد العمولات عند التسليم فقط
-- =================================================================

-- 1) دالة لتأكيد العمولات عند التسليم
CREATE OR REPLACE FUNCTION public._confirm_commissions_on_delivery(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- تحديث حالة جميع العمولات المرتبطة بالطلب إلى CONFIRMED
  UPDATE public.commissions
  SET 
    status = 'CONFIRMED',
    confirmed_at = NOW(),
    updated_at = NOW()
  WHERE order_id = p_order_id
    AND status = 'PENDING';  -- فقط العمولات المعلقة

  -- تحديث actual_delivery_date في order_hub
  UPDATE public.order_hub
  SET 
    actual_delivery_date = NOW(),
    updated_at = NOW()
  WHERE source_order_id = p_order_id
    AND actual_delivery_date IS NULL;

END;
$$;

-- 2) Trigger على order_hub عند تغيير الحالة إلى DELIVERED
CREATE OR REPLACE FUNCTION public._on_order_delivered_confirm_commissions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- التحقق من أن الحالة تغيرت إلى DELIVERED
  IF NEW.status = 'DELIVERED' 
     AND (OLD.status IS DISTINCT FROM NEW.status) 
     AND NEW.source = 'ecommerce' THEN
    
    -- تأكيد العمولات للطلب
    PERFORM public._confirm_commissions_on_delivery(NEW.source_order_id);
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- حذف الـ trigger القديم إن وجد
DROP TRIGGER IF EXISTS trg_order_delivered_confirm_commissions ON public.order_hub;

-- إنشاء الـ trigger الجديد
CREATE TRIGGER trg_order_delivered_confirm_commissions
AFTER UPDATE OF status ON public.order_hub
FOR EACH ROW
EXECUTE FUNCTION public._on_order_delivered_confirm_commissions();

-- 3) إضافة index لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_commissions_order_status 
ON public.commissions(order_id, status) 
WHERE status = 'PENDING';

-- 4) إضافة comment للتوثيق
COMMENT ON FUNCTION public._confirm_commissions_on_delivery IS 
'تأكيد العمولات تلقائياً عند تسليم الطلب من قبل الأدمن';
