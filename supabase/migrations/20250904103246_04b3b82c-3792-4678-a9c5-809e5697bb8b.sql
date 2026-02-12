-- Simple moderation system without complex enum changes
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

-- Simple RLS policies - everyone can read for now
CREATE POLICY "Everyone can view bans" ON user_bans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Everyone can view mutes" ON user_mutes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Everyone can view locks" ON channel_locks FOR SELECT TO authenticated USING (true);

-- Only allow inserts from authenticated users for now
CREATE POLICY "Authenticated can create bans" ON user_bans FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can create mutes" ON user_mutes FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can create locks" ON channel_locks FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);