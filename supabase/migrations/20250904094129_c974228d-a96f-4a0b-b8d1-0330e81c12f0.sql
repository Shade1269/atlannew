-- Fix RLS policies that are causing infinite recursion
-- Drop ALL existing policies first
DROP POLICY IF EXISTS "Channel admins can manage members" ON channel_members;
DROP POLICY IF EXISTS "Users can view channel members of channels they are members of" ON channel_members;
DROP POLICY IF EXISTS "Users can join general channels" ON channel_members;

DROP POLICY IF EXISTS "Users can view channels they are members of" ON channels;
DROP POLICY IF EXISTS "Users can create channels" ON channels;
DROP POLICY IF EXISTS "Channel owners can update their channels" ON channels;

-- Create simplified, non-recursive policies for channel_members
CREATE POLICY "Users can view channel members"
ON channel_members FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can join channels"
ON channel_members FOR INSERT
TO authenticated
WITH CHECK (user_id IN (
  SELECT id FROM profiles WHERE auth_user_id = auth.uid()
));

CREATE POLICY "Users can update their own membership"
ON channel_members FOR UPDATE
TO authenticated
USING (user_id IN (
  SELECT id FROM profiles WHERE auth_user_id = auth.uid()
));

-- Create simplified policies for channels
CREATE POLICY "Users can view all active channels"
ON channels FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Users can create new channels"
ON channels FOR INSERT
TO authenticated
WITH CHECK (owner_id IN (
  SELECT id FROM profiles WHERE auth_user_id = auth.uid()
));

-- Create a general channel if it doesn't exist
INSERT INTO channels (name, description, type, owner_id, is_active)
SELECT 
  'الدردشة العامة',
  'غرفة الدردشة العامة للجميع',
  'general',
  (SELECT id FROM profiles LIMIT 1),
  true
WHERE NOT EXISTS (
  SELECT 1 FROM channels WHERE name = 'الدردشة العامة'
);

-- Add avatar_url column to profiles table for user photos
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;