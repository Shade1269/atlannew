-- حذف الـ Trigger والدالة القديمة التي تستخدم أعمدة غير صحيحة
DROP TRIGGER IF EXISTS trg_record_platform_revenue ON public.ecommerce_orders;
DROP FUNCTION IF EXISTS public.trigger_record_platform_revenue();