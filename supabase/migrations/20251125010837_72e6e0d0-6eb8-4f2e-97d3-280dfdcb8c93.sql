-- إصلاح Security Definer Functions والـ Views
-- إضافة SET search_path TO 'public' لجميع الدوال والـ views

-- إصلاح الدوال التي تحتاج search_path
ALTER FUNCTION public.get_current_user_role() SET search_path TO 'public';
ALTER FUNCTION public.get_current_user_phone() SET search_path TO 'public';
ALTER FUNCTION public.has_any_role(uuid, text[]) SET search_path TO 'public';
ALTER FUNCTION public.debug_user_profile() SET search_path TO 'public';
ALTER FUNCTION public.get_primary_role(uuid) SET search_path TO 'public';
ALTER FUNCTION public.has_role(uuid, user_role) SET search_path TO 'public';
ALTER FUNCTION public.get_latest_shipment_event(uuid) SET search_path TO 'public';
ALTER FUNCTION public.get_latest_shipment_location(uuid) SET search_path TO 'public';
ALTER FUNCTION public.get_shipment_history(uuid) SET search_path TO 'public';
ALTER FUNCTION public.get_store_cms_pages(uuid, uuid) SET search_path TO 'public';
ALTER FUNCTION public.get_channel_member_count(uuid) SET search_path TO 'public';
ALTER FUNCTION public.get_store_orders_for_session(uuid, text) SET search_path TO 'public';
ALTER FUNCTION public.create_customer_otp_session(uuid, text) SET search_path TO 'public';
ALTER FUNCTION public.create_customer_account(text, text, text, uuid) SET search_path TO 'public';
ALTER FUNCTION public.get_store_theme_config(uuid) SET search_path TO 'public';
ALTER FUNCTION public.cleanup_expired_otp() SET search_path TO 'public';
ALTER FUNCTION public.check_profile_orphans() SET search_path TO 'public';
ALTER FUNCTION public.generate_invoice_number() SET search_path TO 'public';
ALTER FUNCTION public.generate_shipment_number() SET search_path TO 'public';
ALTER FUNCTION public.generate_shipment_tracking_number() SET search_path TO 'public';
ALTER FUNCTION public.generate_return_number() SET search_path TO 'public';
ALTER FUNCTION public.generate_refund_number() SET search_path TO 'public';
ALTER FUNCTION public.generate_movement_number() SET search_path TO 'public';
ALTER FUNCTION public.check_all_data_quality() SET search_path TO 'public';
ALTER FUNCTION public.auto_fix_missing_data() SET search_path TO 'public';
ALTER FUNCTION public.broadcast_payments_changes() SET search_path TO 'public';
ALTER FUNCTION public.broadcast_shipments_changes() SET search_path TO 'public';

-- تعليق على الإصلاح
COMMENT ON FUNCTION public.get_current_user_role() IS 'Fixed: Added search_path for security';
COMMENT ON FUNCTION public.has_any_role(uuid, text[]) IS 'Fixed: Added search_path for security';