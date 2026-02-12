-- Fix user roles enum and add moderation system
-- Add new values to existing user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'moderator';

-- Add moderation system for chat
-- User bans table
CREATE TABLE IF NOT EXISTS user_bans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    banned_by UUID NOT NULL,
    channel_id UUID,
    reason TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (banned_by) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE
);

-- User mutes table
CREATE TABLE IF NOT EXISTS user_mutes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    muted_by UUID NOT NULL,
    channel_id UUID NOT NULL,
    reason TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (muted_by) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE
);

-- Channel locks table
CREATE TABLE IF NOT EXISTS channel_locks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL,
    locked_by UUID NOT NULL,
    reason TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
    FOREIGN KEY (locked_by) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Add is_locked column to channels
ALTER TABLE channels ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false;

-- Enable RLS on moderation tables
ALTER TABLE user_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_mutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_locks ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_bans
CREATE POLICY "Admins can manage bans" ON user_bans
FOR ALL TO authenticated
USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.auth_user_id = auth.uid() 
    AND profiles.role IN ('admin', 'moderator')
));

-- RLS policies for user_mutes
CREATE POLICY "Admins can manage mutes" ON user_mutes
FOR ALL TO authenticated
USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.auth_user_id = auth.uid() 
    AND profiles.role IN ('admin', 'moderator')
));

-- RLS policies for channel_locks
CREATE POLICY "Admins can manage locks" ON channel_locks
FOR ALL TO authenticated
USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.auth_user_id = auth.uid() 
    AND profiles.role IN ('admin', 'moderator')
));

-- Users can view their own bans/mutes
CREATE POLICY "Users can view their bans" ON user_bans
FOR SELECT TO authenticated
USING (user_id IN (
    SELECT id FROM profiles WHERE auth_user_id = auth.uid()
));

CREATE POLICY "Users can view their mutes" ON user_mutes
FOR SELECT TO authenticated
USING (user_id IN (
    SELECT id FROM profiles WHERE auth_user_id = auth.uid()
));

-- Everyone can view channel locks
CREATE POLICY "Everyone can view channel locks" ON channel_locks
FOR SELECT TO authenticated
USING (true);