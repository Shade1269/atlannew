-- Fix RLS policies for profiles table to allow phone-based authentication

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "self_read_profile" ON public.profiles;

-- Create new policies that work with phone authentication
CREATE POLICY "Users can read own profile by phone" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = auth_user_id OR 
  phone IN (
    SELECT phone FROM auth.users 
    WHERE auth.users.id = auth.uid()
  )
);

CREATE POLICY "Users can insert profile by phone" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    auth.uid() = auth_user_id OR
    phone IN (
      SELECT phone FROM auth.users 
      WHERE auth.users.id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update own profile by phone" 
ON public.profiles 
FOR UPDATE 
USING (
  auth.uid() = auth_user_id OR 
  phone IN (
    SELECT phone FROM auth.users 
    WHERE auth.users.id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() = auth_user_id OR 
  phone IN (
    SELECT phone FROM auth.users 
    WHERE auth.users.id = auth.uid()
  )
);

-- Also allow public read for basic profile info (needed for chat display)
CREATE POLICY "Public can read basic profile info" 
ON public.profiles 
FOR SELECT 
USING (true);