-- Create edge function to handle data migration from Supabase to Firebase
-- This will be handled by the migrate-supabase-to-firestore edge function

-- For now, create a simple test migration status table
CREATE TABLE IF NOT EXISTS public.migration_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  total_items INTEGER DEFAULT 0,
  migrated_items INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.migration_status ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admin can manage migrations" ON public.migration_status
FOR ALL USING (true);