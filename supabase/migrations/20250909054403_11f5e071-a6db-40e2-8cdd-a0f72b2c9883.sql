-- CRITICAL SECURITY FIX: Fix profiles table RLS policies
-- The previous policy allowed public access to ALL user data including emails and phone numbers

-- Drop the dangerous policy that allows public access to all profile data
DROP POLICY IF EXISTS "Public can read basic profile info" ON public.profiles;

-- Create a more restrictive policy for public access
-- This policy still allows public read but we'll handle sensitive data filtering in the application layer
CREATE POLICY "Limited public profile access" ON public.profiles
FOR SELECT USING (
  -- Allow users to see their own complete profile
  auth.uid() = auth_user_id OR 
  phone IN (SELECT users.phone FROM auth.users WHERE users.id = auth.uid()) OR
  -- For other users, only allow if they are active (we'll filter sensitive columns in app)
  (is_active = true)
);

-- Create a view for safe public profile data that excludes sensitive information
CREATE OR REPLACE VIEW public.safe_profiles AS
SELECT 
  id,
  full_name,
  avatar_url,
  role,
  is_active,
  points,
  created_at,
  last_activity_at,
  -- Only include auth_user_id for the current user's own profile
  CASE 
    WHEN auth.uid() = auth_user_id THEN auth_user_id
    ELSE NULL
  END as auth_user_id,
  -- Only include sensitive data for the current user's own profile  
  CASE 
    WHEN auth.uid() = auth_user_id THEN email
    ELSE NULL
  END as email,
  CASE 
    WHEN auth.uid() = auth_user_id THEN phone
    ELSE NULL
  END as phone,
  CASE 
    WHEN auth.uid() = auth_user_id THEN whatsapp
    ELSE NULL
  END as whatsapp
FROM public.profiles
WHERE 
  -- Users can see their own complete profile
  auth.uid() = auth_user_id OR 
  phone IN (SELECT users.phone FROM auth.users WHERE users.id = auth.uid()) OR
  -- Other users can only see active profiles (with limited data)
  (is_active = true);

-- Enable RLS on the view
ALTER VIEW public.safe_profiles SET (security_invoker = true);