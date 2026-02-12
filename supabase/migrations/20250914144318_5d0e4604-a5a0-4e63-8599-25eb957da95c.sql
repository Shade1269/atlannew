-- Fix RLS policies for user_levels table to allow proper level creation

-- Drop existing problematic policies
DROP POLICY IF EXISTS "System can manage levels" ON public.user_levels;
DROP POLICY IF EXISTS "Users can update own level" ON public.user_levels;

-- Create new policies that work properly
CREATE POLICY "Allow authenticated users to create their own levels" 
ON public.user_levels 
FOR INSERT 
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT profiles.id 
    FROM profiles 
    WHERE profiles.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Allow system and admins to manage all levels" 
ON public.user_levels 
FOR ALL 
TO authenticated
USING (
  -- Allow if user is admin
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.auth_user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
  OR
  -- Allow service role (for system operations)
  auth.jwt() ->> 'role' = 'service_role'
);

CREATE POLICY "Users can update their own levels" 
ON public.user_levels 
FOR UPDATE 
TO authenticated
USING (
  user_id IN (
    SELECT profiles.id 
    FROM profiles 
    WHERE profiles.auth_user_id = auth.uid()
  )
)
WITH CHECK (
  user_id IN (
    SELECT profiles.id 
    FROM profiles 
    WHERE profiles.auth_user_id = auth.uid()
  )
);

-- Also create a function to safely create user levels
CREATE OR REPLACE FUNCTION public.create_user_level(
  target_user_id UUID,
  initial_level TEXT DEFAULT 'bronze',
  initial_points INTEGER DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_level_id UUID;
BEGIN
  -- Check if level already exists
  SELECT id INTO new_level_id 
  FROM user_levels 
  WHERE user_id = target_user_id;
  
  IF new_level_id IS NOT NULL THEN
    RETURN new_level_id;
  END IF;
  
  -- Create new level
  INSERT INTO user_levels (
    user_id,
    current_level,
    total_points,
    level_points,
    next_level_threshold,
    level_achieved_at,
    created_at,
    updated_at
  ) VALUES (
    target_user_id,
    initial_level::user_level_enum,
    initial_points,
    initial_points,
    CASE 
      WHEN initial_level = 'bronze' THEN 1000
      WHEN initial_level = 'silver' THEN 2500
      WHEN initial_level = 'gold' THEN 5000
      WHEN initial_level = 'platinum' THEN 10000
      ELSE 20000
    END,
    NOW(),
    NOW(),
    NOW()
  ) RETURNING id INTO new_level_id;
  
  RETURN new_level_id;
END;
$$;