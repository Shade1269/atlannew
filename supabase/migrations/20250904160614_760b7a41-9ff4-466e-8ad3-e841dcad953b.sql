-- CRITICAL SECURITY FIXES (Corrected)

-- 1. Fix profiles table - prevent users from changing their own role
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE 
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id); -- Will handle role changes via trigger

-- Create trigger to prevent role changes by non-admins
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  current_user_role user_role;
BEGIN
  -- Get the current user's role
  SELECT role INTO current_user_role
  FROM profiles 
  WHERE auth_user_id = auth.uid();
  
  -- If role is being changed and user is not admin, reject
  IF OLD.role != NEW.role AND current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can change user roles';
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_role_escalation_trigger ON public.profiles;
CREATE TRIGGER prevent_role_escalation_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_escalation();

-- 2. Enable RLS and secure sensitive tables
ALTER TABLE public.event_log ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.points_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own points_events" ON public.points_events
  FOR SELECT
  USING (
    affiliate_id IN (
      SELECT id FROM profiles WHERE auth_user_id = auth.uid()
    )
  );

ALTER TABLE public.leaderboard_weekly ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view leaderboard" ON public.leaderboard_weekly
  FOR SELECT
  USING (true);

ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Merchant owners can manage merchants" ON public.merchants
  FOR ALL
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view merchants" ON public.merchants
  FOR SELECT
  USING (true);

-- 3. Secure moderation tables - only admins/moderators can create
DROP POLICY IF EXISTS "Authenticated can create bans" ON public.user_bans;
CREATE POLICY "Moderators can create bans" ON public.user_bans
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'moderator')
    )
  );

DROP POLICY IF EXISTS "Authenticated can create mutes" ON public.user_mutes;
CREATE POLICY "Moderators can create mutes" ON public.user_mutes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'moderator')
    )
  );

DROP POLICY IF EXISTS "Authenticated can create locks" ON public.channel_locks;
CREATE POLICY "Moderators can create locks" ON public.channel_locks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'moderator')
    )
  );

-- 4. Secure transaction tables - remove "anyone_create" policies
DROP POLICY IF EXISTS "anyone_create_order" ON public.orders;
CREATE POLICY "Authenticated users can create orders" ON public.orders
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "anyone_create_order_items" ON public.order_items;
CREATE POLICY "Authenticated users can create order_items" ON public.order_items
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "anyone_create_commissions" ON public.commissions;
CREATE POLICY "System can create commissions" ON public.commissions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE auth_user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- 5. Create security definer function to prevent RLS recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role::text FROM public.profiles WHERE auth_user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Add admin policies using the security definer function
CREATE POLICY "Admins can view event_log" ON public.event_log
  FOR SELECT
  USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can view all points_events" ON public.points_events
  FOR SELECT
  USING (public.get_current_user_role() = 'admin');