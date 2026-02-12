-- ============================================
-- Fix RLS policies for profiles table to allow signup
-- إصلاح سياسات RLS للسماح بالتسجيل
-- ============================================

-- Drop existing INSERT policies that might be blocking
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert profile by phone" ON public.profiles;
DROP POLICY IF EXISTS "Service can create customer profiles via OTP" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can create profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;

-- Create a policy that allows authenticated users to insert their own profile
-- This is needed during signup when the user is authenticated but profile doesn't exist yet
-- The policy must check that auth_user_id matches the authenticated user's ID
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND (
    auth_user_id = auth.uid()
    OR auth_user_id IS NULL  -- Allow NULL during initial creation, will be set by trigger
  )
);

-- Also allow service_role to insert profiles (for backend operations)
CREATE POLICY "Service role can insert profiles"
ON public.profiles
FOR INSERT
TO service_role
WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create a trigger to automatically set auth_user_id if it's NULL during INSERT
-- This helps with cases where the profile is created before auth_user_id is set
CREATE OR REPLACE FUNCTION public.set_auth_user_id_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If auth_user_id is NULL, set it to the current authenticated user's ID
  IF NEW.auth_user_id IS NULL AND auth.uid() IS NOT NULL THEN
    NEW.auth_user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_set_auth_user_id_on_insert ON public.profiles;
CREATE TRIGGER trigger_set_auth_user_id_on_insert
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_auth_user_id_on_insert();

