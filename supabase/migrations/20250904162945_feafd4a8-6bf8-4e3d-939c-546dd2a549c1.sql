-- Security Fix 1: Prevent privilege escalation on profiles
-- Update the prevent_role_escalation function to allow service_role changes
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_user_role user_role;
  jwt_role text;
BEGIN
  -- Get the JWT role to check if this is a service_role request
  jwt_role := auth.jwt()->>'role';
  
  -- Allow service_role to change roles (for admin edge function)
  IF jwt_role = 'service_role' THEN
    RETURN NEW;
  END IF;
  
  -- For regular users, check if they have admin role
  SELECT role INTO current_user_role
  FROM profiles 
  WHERE auth_user_id = auth.uid();
  
  IF OLD.role != NEW.role AND current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can change user roles';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Add trigger to profiles table to prevent privilege escalation
DROP TRIGGER IF EXISTS prevent_role_escalation_trigger ON public.profiles;
CREATE TRIGGER prevent_role_escalation_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_escalation();

-- Security Fix 2: Tighten moderation data visibility
-- Update user_bans SELECT policy
DROP POLICY IF EXISTS "Everyone can view bans" ON public.user_bans;
CREATE POLICY "Moderators and affected users can view bans" 
ON public.user_bans 
FOR SELECT 
USING (
  get_current_user_role() = ANY (ARRAY['admin'::text, 'moderator'::text])
  OR user_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
);

-- Update user_mutes SELECT policy  
DROP POLICY IF EXISTS "Everyone can view mutes" ON public.user_mutes;
CREATE POLICY "Moderators and affected users can view mutes"
ON public.user_mutes
FOR SELECT
USING (
  get_current_user_role() = ANY (ARRAY['admin'::text, 'moderator'::text])
  OR user_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
);

-- Update channel_locks SELECT policy
DROP POLICY IF EXISTS "Everyone can view locks" ON public.channel_locks;
CREATE POLICY "Moderators can view locks"
ON public.channel_locks
FOR SELECT
USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'moderator'::text]));

-- Security Fix 3: Restrict channel_members visibility
DROP POLICY IF EXISTS "Users can view channel members" ON public.channel_members;
CREATE POLICY "Users can view members of their channels"
ON public.channel_members
FOR SELECT
USING (
  channel_id IN (
    SELECT cm.channel_id 
    FROM channel_members cm
    JOIN profiles p ON p.id = cm.user_id
    WHERE p.auth_user_id = auth.uid()
  )
);

-- Create a safe channel member counts view
CREATE OR REPLACE VIEW public.channel_member_counts AS
SELECT 
  channel_id,
  COUNT(*) as member_count
FROM public.channel_members
GROUP BY channel_id;

-- Security Fix 4: Lock down payments INSERT
DROP POLICY IF EXISTS "System can insert payments" ON public.payments;
CREATE POLICY "Only service role can insert payments"
ON public.payments
FOR INSERT
WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Add RLS policy for the new view
ALTER VIEW public.channel_member_counts SET (security_invoker = true);
CREATE POLICY "Anyone can view channel member counts"
ON public.channel_member_counts
FOR SELECT
USING (true);