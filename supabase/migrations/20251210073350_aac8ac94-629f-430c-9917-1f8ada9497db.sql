
-- Create meeting_rooms table for history and room management
CREATE TABLE public.meeting_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code TEXT NOT NULL UNIQUE,
  room_name TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_private BOOLEAN NOT NULL DEFAULT false,
  password_hash TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  max_participants INTEGER DEFAULT 100,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  participant_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create meeting_participants table
CREATE TABLE public.meeting_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.meeting_rooms(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  participant_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'listener' CHECK (role IN ('speaker', 'listener')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  left_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER
);

-- Enable RLS
ALTER TABLE public.meeting_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for meeting_rooms
CREATE POLICY "Anyone can view active public rooms"
ON public.meeting_rooms FOR SELECT
USING (is_active = true AND is_private = false);

CREATE POLICY "Room creators can view their rooms"
ON public.meeting_rooms FOR SELECT
USING (created_by IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Authenticated users can create rooms"
ON public.meeting_rooms FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Room creators can update their rooms"
ON public.meeting_rooms FOR UPDATE
USING (created_by IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

-- RLS Policies for meeting_participants
CREATE POLICY "Anyone can view participants of rooms they can access"
ON public.meeting_participants FOR SELECT
USING (EXISTS (
  SELECT 1 FROM meeting_rooms mr 
  WHERE mr.id = room_id 
  AND (mr.is_private = false OR mr.created_by IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()))
));

CREATE POLICY "Authenticated users can join rooms"
ON public.meeting_participants FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Participants can update their own record"
ON public.meeting_participants FOR UPDATE
USING (profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

-- Function to generate unique room code
CREATE OR REPLACE FUNCTION public.generate_room_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyz';
  result TEXT := '';
  i INTEGER;
BEGIN
  -- Generate format: xxx-xxxx-xxx (like Google Meet)
  FOR i IN 1..3 LOOP
    result := result || substr(chars, floor(random() * 26 + 1)::int, 1);
  END LOOP;
  result := result || '-';
  FOR i IN 1..4 LOOP
    result := result || substr(chars, floor(random() * 26 + 1)::int, 1);
  END LOOP;
  result := result || '-';
  FOR i IN 1..3 LOOP
    result := result || substr(chars, floor(random() * 26 + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER update_meeting_rooms_updated_at
  BEFORE UPDATE ON public.meeting_rooms
  FOR EACH ROW
  EXECUTE FUNCTION public._update_updated_at();

-- Index for room lookups
CREATE INDEX idx_meeting_rooms_code ON public.meeting_rooms(room_code);
CREATE INDEX idx_meeting_rooms_created_by ON public.meeting_rooms(created_by);
CREATE INDEX idx_meeting_participants_room ON public.meeting_participants(room_id);
