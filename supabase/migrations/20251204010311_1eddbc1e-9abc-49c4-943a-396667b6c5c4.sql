
-- إصلاح search_path للـ Functions لتجنب ثغرات SQL injection
-- هذا يضمن أن الـ functions تستخدم schema محدد

ALTER FUNCTION public._confirm_commissions_on_delivery(uuid) SET search_path = public;
ALTER FUNCTION public._on_order_delivered_confirm_commissions() SET search_path = public;
ALTER FUNCTION public.add_affiliate_product(uuid, uuid, boolean, integer, numeric) SET search_path = public;
ALTER FUNCTION public.create_merchant_pending_balance_trigger() SET search_path = public;
ALTER FUNCTION public.get_all_columns() SET search_path = public;
ALTER FUNCTION public.get_all_tables() SET search_path = public;
ALTER FUNCTION public.get_product_rating_stats(uuid) SET search_path = public;
ALTER FUNCTION public.log_product_activity(uuid, text, jsonb, jsonb) SET search_path = public;
ALTER FUNCTION public.prevent_legacy_write() SET search_path = public;
ALTER FUNCTION public.trigger_log_product_activity() SET search_path = public;
ALTER FUNCTION public.update_store_settings_updated_at() SET search_path = public;
ALTER FUNCTION public.update_store_themes_updated_at() SET search_path = public;
