-- SECURITY FIXES - Drop all existing policies and recreate safely

-- Drop ALL existing policies first to avoid conflicts
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_record.policyname, policy_record.tablename);
    END LOOP;
END $$;

-- Now create all security policies from scratch

-- 1. PROFILES - Prevent privilege escalation
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT 
  WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "self_read_profile" ON public.profiles
  FOR SELECT 
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE 
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- Create trigger to prevent role changes by non-admins
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  current_user_role user_role;
BEGIN
  SELECT role INTO current_user_role
  FROM profiles 
  WHERE auth_user_id = auth.uid();
  
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

-- 2. CHANNELS
CREATE POLICY "Users can view all active channels" ON public.channels
  FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Users can create new channels" ON public.channels
  FOR INSERT 
  WITH CHECK (owner_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

-- 3. CHANNEL MEMBERS  
CREATE POLICY "Users can view channel members" ON public.channel_members
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can join channels" ON public.channel_members
  FOR INSERT 
  WITH CHECK (user_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can update their own membership" ON public.channel_members
  FOR UPDATE 
  USING (user_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

-- 4. MESSAGES - Secure chat
CREATE POLICY "Users can view messages in channels they are members of" ON public.messages
  FOR SELECT 
  USING (channel_id IN (
    SELECT cm.channel_id 
    FROM channel_members cm 
    JOIN profiles p ON p.id = cm.user_id 
    WHERE p.auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can send messages to channels they are members of" ON public.messages
  FOR INSERT 
  WITH CHECK (
    sender_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()) 
    AND channel_id IN (
      SELECT cm.channel_id 
      FROM channel_members cm 
      JOIN profiles p ON p.id = cm.user_id 
      WHERE p.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own messages" ON public.messages
  FOR UPDATE 
  USING (sender_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can delete their own messages" ON public.messages
  FOR DELETE 
  USING (sender_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

-- 5. MODERATION - Only admins/moderators
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role::text FROM public.profiles WHERE auth_user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

CREATE POLICY "Everyone can view bans" ON public.user_bans
  FOR SELECT 
  USING (true);

CREATE POLICY "Moderators can create bans" ON public.user_bans
  FOR INSERT 
  WITH CHECK (public.get_current_user_role() IN ('admin', 'moderator'));

CREATE POLICY "Everyone can view mutes" ON public.user_mutes
  FOR SELECT 
  USING (true);

CREATE POLICY "Moderators can create mutes" ON public.user_mutes
  FOR INSERT 
  WITH CHECK (public.get_current_user_role() IN ('admin', 'moderator'));

CREATE POLICY "Everyone can view locks" ON public.channel_locks
  FOR SELECT 
  USING (true);

CREATE POLICY "Moderators can create locks" ON public.channel_locks
  FOR INSERT 
  WITH CHECK (public.get_current_user_role() IN ('admin', 'moderator'));

-- 6. SECURE SENSITIVE TABLES
ALTER TABLE public.event_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view event_log" ON public.event_log
  FOR SELECT 
  USING (public.get_current_user_role() = 'admin');

ALTER TABLE public.points_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own points_events" ON public.points_events
  FOR SELECT 
  USING (affiliate_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Admins can view all points_events" ON public.points_events
  FOR SELECT 
  USING (public.get_current_user_role() = 'admin');

ALTER TABLE public.leaderboard_weekly ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view leaderboard" ON public.leaderboard_weekly
  FOR SELECT 
  USING (true);

ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Merchant owners can manage merchants" ON public.merchants
  FOR ALL 
  USING (profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Public can view merchants" ON public.merchants
  FOR SELECT 
  USING (true);

-- 7. SECURE TRANSACTION TABLES
CREATE POLICY "Authenticated users can create orders" ON public.orders
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view orders for their shops" ON public.orders
  FOR SELECT 
  USING (shop_id IN (
    SELECT s.id FROM shops s 
    JOIN profiles p ON p.id = s.owner_id 
    WHERE p.auth_user_id = auth.uid()
  ));

CREATE POLICY "Authenticated users can create order_items" ON public.order_items
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view order_items for their shops" ON public.order_items
  FOR SELECT 
  USING (order_id IN (
    SELECT o.id FROM orders o 
    JOIN shops s ON s.id = o.shop_id 
    JOIN profiles p ON p.id = s.owner_id 
    WHERE p.auth_user_id = auth.uid()
  ));

CREATE POLICY "Admins can create commissions" ON public.commissions
  FOR INSERT 
  WITH CHECK (public.get_current_user_role() = 'admin');

CREATE POLICY "Users can view own commissions" ON public.commissions
  FOR SELECT 
  USING (affiliate_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

-- 8. RESTORE OTHER NECESSARY POLICIES
CREATE POLICY "Users can view commission payouts" ON public.commission_payouts
  FOR SELECT 
  USING (affiliate_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Merchant can manage products" ON public.products
  FOR ALL 
  USING (merchant_id IN (
    SELECT m.id FROM merchants m 
    JOIN profiles p ON p.id = m.profile_id 
    WHERE p.auth_user_id = auth.uid()
  ));

CREATE POLICY "Public can view active products" ON public.products
  FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Library owner can manage product_library" ON public.product_library
  FOR ALL 
  USING (shop_id IN (
    SELECT s.id FROM shops s 
    JOIN profiles p ON p.id = s.owner_id 
    WHERE p.auth_user_id = auth.uid()
  ));

CREATE POLICY "Shop owner can manage shops" ON public.shops
  FOR ALL 
  USING (owner_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Public can view shops" ON public.shops
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can view own shop payments" ON public.payments
  FOR SELECT 
  USING (order_id IN (
    SELECT o.id FROM orders o 
    JOIN shops s ON s.id = o.shop_id 
    JOIN profiles p ON p.id = s.owner_id 
    WHERE p.auth_user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all payments" ON public.payments
  FOR SELECT 
  USING (public.get_current_user_role() = 'admin');

CREATE POLICY "System can insert payments" ON public.payments
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can update own shop payments" ON public.payments
  FOR UPDATE 
  USING (order_id IN (
    SELECT o.id FROM orders o 
    JOIN shops s ON s.id = o.shop_id 
    JOIN profiles p ON p.id = s.owner_id 
    WHERE p.auth_user_id = auth.uid()
  ));