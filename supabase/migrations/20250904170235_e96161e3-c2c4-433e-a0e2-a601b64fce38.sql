-- Fix infinite recursion in channel_members policies
-- The issue is that policies are referencing the same table they're applied to

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Users can view members of their channels" ON public.channel_members;
DROP POLICY IF EXISTS "Users can join channels" ON public.channel_members;
DROP POLICY IF EXISTS "Users can update their own membership" ON public.channel_members;

-- Create safer policies that don't cause infinite recursion
-- Users can always join channels
CREATE POLICY "Users can join channels" 
  ON public.channel_members 
  FOR INSERT 
  WITH CHECK (
    -- Allow users to join with their own profile ID
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = user_id AND p.auth_user_id = auth.uid()
    )
  );

-- Users can view all channel members (simplified)
CREATE POLICY "Users can view channel members" 
  ON public.channel_members 
  FOR SELECT 
  USING (true);

-- Users can update their own membership
CREATE POLICY "Users can update their own membership" 
  ON public.channel_members 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = user_id AND p.auth_user_id = auth.uid()
    )
  );

-- Allow users to leave channels (delete their membership)
CREATE POLICY "Users can leave channels" 
  ON public.channel_members 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = user_id AND p.auth_user_id = auth.uid()
    )
  );