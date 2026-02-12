-- Fix Views Security: Change from SECURITY DEFINER to SECURITY INVOKER

-- 1. safe_profiles view
DROP VIEW IF EXISTS public.safe_profiles CASCADE;
CREATE VIEW public.safe_profiles 
WITH (security_invoker = true)
AS
SELECT 
  id,
  full_name,
  avatar_url,
  role,
  is_active,
  created_at
FROM public.profiles;

-- 2. user_profiles_compat view
DROP VIEW IF EXISTS public.user_profiles_compat CASCADE;
CREATE VIEW public.user_profiles_compat
WITH (security_invoker = true)
AS
SELECT 
  id,
  auth_user_id,
  full_name,
  email,
  phone,
  avatar_url,
  role,
  is_active,
  created_at,
  updated_at
FROM public.profiles;

-- 3. v_user_stats view (using correct column user_id)
DROP VIEW IF EXISTS public.v_user_stats CASCADE;
CREATE VIEW public.v_user_stats
WITH (security_invoker = true)
AS
SELECT 
  p.id,
  p.full_name,
  p.email,
  p.role,
  p.is_active,
  p.created_at,
  COALESCE(
    (SELECT COUNT(*) FROM public.ecommerce_orders o WHERE o.user_id = p.auth_user_id),
    0
  ) as total_orders,
  COALESCE(
    (SELECT SUM(total_sar) FROM public.ecommerce_orders o WHERE o.user_id = p.auth_user_id AND o.payment_status = 'COMPLETED'),
    0
  ) as total_spent
FROM public.profiles p;

-- 4. archived_legacy_orders view
DROP VIEW IF EXISTS public.archived_legacy_orders CASCADE;
CREATE VIEW public.archived_legacy_orders
WITH (security_invoker = true)
AS
SELECT * FROM public.orders;

-- 5. archived_legacy_simple_orders view  
DROP VIEW IF EXISTS public.archived_legacy_simple_orders CASCADE;
CREATE VIEW public.archived_legacy_simple_orders
WITH (security_invoker = true)
AS
SELECT * FROM public.simple_orders;