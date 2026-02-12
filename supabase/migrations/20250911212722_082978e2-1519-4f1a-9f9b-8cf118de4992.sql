-- Optimize get_current_user_role function for better performance
CREATE OR REPLACE FUNCTION public.get_current_user_role()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT role::text FROM public.profiles WHERE auth_user_id = auth.uid()),
    'customer'::text
  );
$function$;

-- Create a function to get user role with caching support
CREATE OR REPLACE FUNCTION public.get_user_role_cached(user_id uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(role::text, 'customer'::text) 
  FROM public.profiles 
  WHERE auth_user_id = user_id;
$function$;

-- Create a fast role check function for multiple roles
CREATE OR REPLACE FUNCTION public.has_any_role(user_id uuid, allowed_roles text[])
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE auth_user_id = user_id 
    AND role::text = ANY(allowed_roles)
    AND is_active = true
  );
$function$;

-- Add an index for faster role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user_id_role_active 
ON public.profiles(auth_user_id, role, is_active);

-- Add an index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email_active 
ON public.profiles(email, is_active) WHERE email IS NOT NULL;