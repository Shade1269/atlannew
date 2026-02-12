-- ============================================================================
-- إضافة Trigger لإنشاء العمولات تلقائياً عند دفع الطلب
-- ============================================================================

-- 1. التأكد من وجود function _on_order_paid_generate_commissions
-- (يتم إنشاؤها في migration 20251103070652)
-- إذا لم تكن موجودة، ننشئها هنا
CREATE OR REPLACE FUNCTION public._on_order_paid_generate_commissions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.payment_status = 'COMPLETED' AND (OLD.payment_status IS DISTINCT FROM NEW.payment_status) THEN
    PERFORM public._generate_commissions_for_order(NEW.id);
    RAISE NOTICE 'Generated commissions for order: %', NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- 2. إسقاط Trigger القديم إن وجد
DROP TRIGGER IF EXISTS trg_order_paid_generate_commissions ON public.ecommerce_orders;
DROP TRIGGER IF EXISTS trg_ecommerce_order_paid_generate_commissions ON public.ecommerce_orders;

-- 3. إنشاء Trigger جديد لجدول ecommerce_orders
CREATE TRIGGER trg_ecommerce_order_paid_generate_commissions
  AFTER INSERT OR UPDATE OF payment_status ON public.ecommerce_orders
  FOR EACH ROW
  WHEN (NEW.payment_status = 'COMPLETED')
  EXECUTE FUNCTION public._on_order_paid_generate_commissions();

-- 2. Trigger لجدول orders (الجدول القديم)
-- ينشئ العمولات تلقائياً عندما يصبح status = 'completed'
CREATE OR REPLACE FUNCTION public.trg_order_completed_generate_commissions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- فقط عندما يصبح status = 'delivered' (القيمة الصحيحة في enum order_status)
  -- enum order_status يحتوي على: 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
    -- إنشاء العمولات للطلب
    PERFORM public._generate_commissions_for_order(NEW.id);
    
    RAISE NOTICE 'Generated commissions for order: %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- إسقاط Trigger القديم إن وجد
DROP TRIGGER IF EXISTS trg_order_completed_generate_commissions ON public.orders;

-- إنشاء Trigger جديد
CREATE TRIGGER trg_order_completed_generate_commissions
  AFTER INSERT OR UPDATE OF status ON public.orders
  FOR EACH ROW
  WHEN (NEW.status = 'delivered')
  EXECUTE FUNCTION public.trg_order_completed_generate_commissions();

-- 3. إضافة تعليقات توضيحية
COMMENT ON FUNCTION public.trg_order_paid_generate_commissions() IS 
'ينشئ العمولات تلقائياً عند دفع الطلب في جدول ecommerce_orders';

COMMENT ON FUNCTION public.trg_order_completed_generate_commissions() IS 
'ينشئ العمولات تلقائياً عند اكتمال الطلب في جدول orders';
