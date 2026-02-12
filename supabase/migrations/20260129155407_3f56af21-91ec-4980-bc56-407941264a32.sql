
-- ═══════════════════════════════════════════════════════════════════════════
-- إصلاح شامل لمشكلة الحلقة اللانهائية والبيانات اليتيمة
-- ═══════════════════════════════════════════════════════════════════════════

-- الدالة 1: sync_ecommerce_from_order_hub (من order_hub → ecommerce_orders)
CREATE OR REPLACE FUNCTION public.sync_ecommerce_from_order_hub()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_order_status order_status;
  v_payment_status payment_status;
BEGIN
  -- ✅ Guard 1: فقط للطلبات من نوع ecommerce
  IF NEW.source != 'ecommerce' OR NEW.source_order_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- ✅ Guard 2: فحص وجود السجل في ecommerce_orders (لتجنب أخطاء البيانات اليتيمة)
  IF NOT EXISTS (SELECT 1 FROM ecommerce_orders WHERE id = NEW.source_order_id) THEN
    RETURN NEW;
  END IF;
  
  -- ✅ Guard 3: منع الحلقة اللانهائية - تخطي إذا لم يتغير شيء
  IF TG_OP = 'UPDATE' 
     AND NEW.status::text = OLD.status::text 
     AND NEW.payment_status::text = OLD.payment_status::text THEN
    RETURN NEW;
  END IF;
  
  -- تحويل الحالات بشكل آمن
  BEGIN
    IF UPPER(NEW.status) = 'CANCELLED' THEN
      v_order_status := 'CANCELED'::order_status;
    ELSIF UPPER(NEW.status) = 'PROCESSING' THEN
      v_order_status := 'PENDING'::order_status;
    ELSIF UPPER(NEW.status) = 'COMPLETED' THEN
      v_order_status := 'DELIVERED'::order_status;
    ELSE
      v_order_status := UPPER(NEW.status)::order_status;
    END IF;
  EXCEPTION WHEN invalid_text_representation THEN
    v_order_status := NULL;
  END;
  
  BEGIN
    v_payment_status := UPPER(NEW.payment_status)::payment_status;
  EXCEPTION WHEN invalid_text_representation THEN
    v_payment_status := NULL;
  END;
  
  -- التحديث فقط إذا كانت القيم صالحة
  IF v_order_status IS NOT NULL OR v_payment_status IS NOT NULL THEN
    UPDATE public.ecommerce_orders
    SET 
      status = COALESCE(v_order_status, status),
      payment_status = COALESCE(v_payment_status, payment_status),
      updated_at = NOW()
    WHERE id = NEW.source_order_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- الدالة 2: sync_order_hub_from_ecommerce (من ecommerce_orders → order_hub)
CREATE OR REPLACE FUNCTION public.sync_order_hub_from_ecommerce()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.order_hub (
      source, source_order_id, order_number, customer_name, 
      customer_phone, customer_email, total_amount_sar, 
      status, payment_status, shop_id, affiliate_store_id,
      created_at, updated_at
    )
    VALUES (
      'ecommerce', NEW.id, NEW.order_number, NEW.customer_name,
      NEW.customer_phone, NEW.customer_email, COALESCE(NEW.total_sar, 0),
      NEW.status, NEW.payment_status, NEW.shop_id, NEW.affiliate_store_id,
      NEW.created_at, NEW.updated_at
    )
    ON CONFLICT (source, source_order_id) DO NOTHING;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- ✅ Guard: منع الحلقة اللانهائية - تخطي إذا لم يتغير شيء
    IF NEW.status::text = OLD.status::text 
       AND NEW.payment_status::text = OLD.payment_status::text THEN
      RETURN NEW;
    END IF;
    
    UPDATE public.order_hub
    SET 
      order_number = NEW.order_number,
      customer_name = NEW.customer_name,
      customer_phone = NEW.customer_phone,
      customer_email = NEW.customer_email,
      total_amount_sar = COALESCE(NEW.total_sar, 0),
      status = NEW.status,
      payment_status = NEW.payment_status,
      updated_at = NEW.updated_at
    WHERE source = 'ecommerce' AND source_order_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$function$;
