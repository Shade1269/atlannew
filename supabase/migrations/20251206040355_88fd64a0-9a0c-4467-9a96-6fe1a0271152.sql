-- Drop existing INSERT policy for chat_messages
DROP POLICY IF EXISTS "Room members can send messages" ON public.chat_messages;

-- Create new INSERT policy that correctly links auth.uid() to profiles.auth_user_id
CREATE POLICY "Room members can send messages" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (
  sender_id IN (
    SELECT p.id FROM profiles p WHERE p.auth_user_id = auth.uid()
  )
  AND room_id IN (
    SELECT rm.room_id 
    FROM room_members rm
    JOIN profiles p ON p.id = rm.user_id
    WHERE p.auth_user_id = auth.uid()
    AND rm.is_banned = false
    AND (rm.is_muted = false OR rm.muted_until < now())
  )
);