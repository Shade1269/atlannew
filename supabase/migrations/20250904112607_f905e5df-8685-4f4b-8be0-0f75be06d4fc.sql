-- Add message status tracking
ALTER TABLE messages ADD COLUMN status text DEFAULT 'sent' CHECK (status IN ('sending', 'sent', 'delivered', 'failed'));

-- Add message threading support  
ALTER TABLE messages ADD COLUMN reply_to_message_id uuid REFERENCES messages(id) ON DELETE SET NULL;

-- Add message pinning
ALTER TABLE messages ADD COLUMN is_pinned boolean DEFAULT false;
ALTER TABLE messages ADD COLUMN pinned_at timestamp with time zone;
ALTER TABLE messages ADD COLUMN pinned_by uuid REFERENCES profiles(id) ON DELETE SET NULL;