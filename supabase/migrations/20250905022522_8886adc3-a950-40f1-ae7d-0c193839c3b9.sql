-- Check if the owner_id properly links when creating shops
-- Add debugging to help identify the issue

-- First, let's see what the current user profile looks like
CREATE OR REPLACE FUNCTION debug_user_profile()
RETURNS TABLE(
  profile_id UUID,
  auth_user_id UUID,
  current_auth_uid UUID
) 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE 
SET search_path = public
AS $$
  SELECT 
    p.id as profile_id,
    p.auth_user_id,
    auth.uid() as current_auth_uid
  FROM profiles p
  WHERE p.auth_user_id = auth.uid();
$$;