-- Fix the create_user_level function to use correct enum type
CREATE OR REPLACE FUNCTION public.create_user_level(
  target_user_id uuid, 
  initial_level text DEFAULT 'bronze'::text, 
  initial_points integer DEFAULT 0
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  
  -- Create new level using correct type (user_level not user_level_enum)
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
    initial_level::user_level,
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
$function$;