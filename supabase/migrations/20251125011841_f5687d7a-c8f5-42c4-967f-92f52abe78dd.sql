-- إصلاح الدوال المتبقية التي تحتاج search_path
ALTER FUNCTION public.calculate_final_price(numeric, discount_type, numeric, timestamp with time zone, timestamp with time zone) SET search_path TO 'public';
ALTER FUNCTION public.calculate_loyalty_points(numeric, numeric) SET search_path TO 'public';
ALTER FUNCTION public.calculate_invoice_totals() SET search_path TO 'public';
ALTER FUNCTION public.update_last_activity() SET search_path TO 'public';
ALTER FUNCTION public.update_review_helpful_count() SET search_path TO 'public';
ALTER FUNCTION public.update_customer_tier(uuid) SET search_path TO 'public';
ALTER FUNCTION public.update_marketing_timestamp() SET search_path TO 'public';
ALTER FUNCTION public.handle_new_auth_user() SET search_path TO 'public';
ALTER FUNCTION public.gen_random_uuid() SET search_path TO 'public';
ALTER FUNCTION public.update_alliance_stats() SET search_path TO 'public';
ALTER FUNCTION public.update_coupon_usage_count() SET search_path TO 'public';
ALTER FUNCTION public.update_banner_timestamp() SET search_path TO 'public';
ALTER FUNCTION public.award_chat_points() SET search_path TO 'public';
ALTER FUNCTION public.auto_create_merchant() SET search_path TO 'public';
ALTER FUNCTION public._mark_order_paid_from_tx() SET search_path TO 'public';
ALTER FUNCTION public._on_order_paid_generate_commissions() SET search_path TO 'public';
ALTER FUNCTION public._on_order_paid_grant_points() SET search_path TO 'public';
ALTER FUNCTION public._on_order_payment_update_manage_inventory() SET search_path TO 'public';
ALTER FUNCTION public._update_updated_at() SET search_path TO 'public';
ALTER FUNCTION public.auto_calculate_catalog_price() SET search_path TO 'public';

-- إصلاح الـ Views: إعادة إنشائها بدون SECURITY DEFINER أو مع security_barrier
-- نستخدم security_barrier بدلاً من SECURITY DEFINER للـ views
DROP VIEW IF EXISTS public.safe_profiles CASCADE;
CREATE VIEW public.safe_profiles 
WITH (security_barrier = true) AS
SELECT 
  id, 
  auth_user_id,
  email,
  full_name,
  phone,
  avatar_url,
  bio,
  role,
  is_active,
  points,
  created_at,
  updated_at,
  last_activity_at
FROM public.profiles;

COMMENT ON VIEW public.safe_profiles IS 'Secure view with security_barrier to prevent data leakage';

-- منح الصلاحيات للـ view
GRANT SELECT ON public.safe_profiles TO authenticated;
GRANT SELECT ON public.safe_profiles TO anon;