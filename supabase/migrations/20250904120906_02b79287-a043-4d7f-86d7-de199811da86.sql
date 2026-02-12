-- Step 2: Create function to update user role and set up moderator profile
CREATE OR REPLACE FUNCTION public.update_user_role(
    target_email text,
    new_role user_role
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_role user_role;
    target_user_record profiles%ROWTYPE;
BEGIN
    -- Check if the current user is admin
    SELECT role INTO current_user_role
    FROM profiles 
    WHERE auth_user_id = auth.uid();
    
    IF current_user_role != 'admin' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Access denied. Admin privileges required.'
        );
    END IF;
    
    -- Find the target user by email
    SELECT * INTO target_user_record
    FROM profiles 
    WHERE email = target_email;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User not found with email: ' || target_email
        );
    END IF;
    
    -- Update the user role
    UPDATE profiles 
    SET role = new_role, updated_at = now()
    WHERE email = target_email;
    
    RETURN json_build_object(
        'success', true,
        'message', 'User role updated successfully',
        'user_email', target_email,
        'new_role', new_role
    );
END;
$$;

-- Create profile for the user with moderator role
INSERT INTO profiles (auth_user_id, email, full_name, role)
VALUES (
    null, -- will be updated when user signs up
    'shade010@hotmail.com',
    'Shade',
    'moderator'::user_role
)
ON CONFLICT (email) 
DO UPDATE SET 
    role = 'moderator'::user_role,
    updated_at = now();

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_user_role TO authenticated;