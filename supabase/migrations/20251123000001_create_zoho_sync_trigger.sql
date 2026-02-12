-- إنشاء Database Trigger لمزامنة الطلبات مع Zoho Books تلقائياً
-- Migration: Create trigger to automatically sync orders to Zoho Books

-- إنشاء function لاستدعاء Edge Function
CREATE OR REPLACE FUNCTION public.trigger_zoho_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id bigint;
BEGIN
  -- فقط المزامنة عند تأكيد الطلب (عندما يتم تعيين confirmed_at)
  IF (TG_OP = 'UPDATE' AND NEW.confirmed_at IS NOT NULL AND OLD.confirmed_at IS NULL)
     OR (TG_OP = 'INSERT' AND NEW.confirmed_at IS NOT NULL) THEN

    -- التحقق من أن الطلب لم تتم مزامنته بعد
    IF NEW.zoho_sync_status IS NULL OR NEW.zoho_sync_status = 'PENDING' OR NEW.zoho_sync_status = 'FAILED' THEN

      -- استدعاء Edge Function باستخدام pg_net
      SELECT INTO request_id
        net.http_post(
          url := concat(current_setting('app.settings.supabase_url', true), '/functions/v1/sync-order-to-zoho'),
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', concat('Bearer ', current_setting('app.settings.service_role_key', true))
          ),
          body := jsonb_build_object(
            'order_id', NEW.id::text
          )
        );

      -- تسجيل المحاولة
      RAISE LOG 'Zoho sync triggered for order % with request_id %', NEW.id, request_id;

    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- إنشاء Trigger على جدول الطلبات
DROP TRIGGER IF EXISTS trigger_sync_order_to_zoho ON public.ecommerce_orders;

CREATE TRIGGER trigger_sync_order_to_zoho
AFTER INSERT OR UPDATE ON public.ecommerce_orders
FOR EACH ROW
EXECUTE FUNCTION public.trigger_zoho_sync();

-- إضافة تعليق توضيحي
COMMENT ON FUNCTION public.trigger_zoho_sync() IS 'يقوم بإرسال الطلب إلى Zoho Books تلقائياً عند تأكيد الطلب';
COMMENT ON TRIGGER trigger_sync_order_to_zoho ON public.ecommerce_orders IS 'يستدعي Edge Function لمزامنة الطلب مع Zoho Books عند التأكيد';
