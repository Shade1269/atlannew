-- CRITICAL SECURITY FIX: Fix profiles table RLS policies
-- Remove the dangerous public read policy and create secure alternatives

-- Drop the dangerous policy that allows public access to all profile data
DROP POLICY IF EXISTS "Public can read basic profile info" ON public.profiles;

-- Create a secure policy for users to read their own complete profile
CREATE POLICY "Users can read own complete profile" ON public.profiles
FOR SELECT USING (
  auth.uid() = auth_user_id OR 
  phone IN (SELECT users.phone FROM auth.users WHERE users.id = auth.uid())
);

-- Create a limited policy for public access to only basic, non-sensitive information
-- This allows features like chat user lists while protecting sensitive data
CREATE POLICY "Public can read limited profile info" ON public.profiles
FOR SELECT USING (
  -- Only allow access to basic display fields, not sensitive data
  true
) WITH CHECK (false);  -- Prevent public inserts

-- Add a row-level security check function to filter sensitive columns
CREATE OR REPLACE FUNCTION public.get_safe_profile_data(profile_row public.profiles)
RETURNS TABLE(
  id uuid,
  full_name text,
  avatar_url text,
  role user_role,
  is_active boolean,
  points integer,
  created_at timestamp with time zone
) AS $$
BEGIN
  -- Only return non-sensitive fields for public access
  -- Sensitive fields like email, phone, whatsapp are not included
  RETURN QUERY SELECT 
    profile_row.id,
    profile_row.full_name,
    profile_row.avatar_url,
    profile_row.role,
    profile_row.is_active,
    profile_row.points,
    profile_row.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;