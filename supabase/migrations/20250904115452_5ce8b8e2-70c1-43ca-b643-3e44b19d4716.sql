-- Fix the missing foreign key constraint for reply_to_message_id
-- This will enable proper self-referencing for message replies

ALTER TABLE messages 
ADD CONSTRAINT messages_reply_to_message_id_fkey 
FOREIGN KEY (reply_to_message_id) 
REFERENCES messages(id) 
ON DELETE SET NULL;