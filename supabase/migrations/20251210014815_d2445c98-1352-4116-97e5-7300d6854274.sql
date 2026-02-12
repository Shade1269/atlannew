-- Create function to get or create customer service chat room
CREATE OR REPLACE FUNCTION get_or_create_customer_service_chat(
  p_store_id UUID,
  p_customer_profile_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room_id UUID;
  v_store_owner_id UUID;
  v_room_name TEXT;
BEGIN
  -- Get the store owner's profile ID
  SELECT profile_id INTO v_store_owner_id
  FROM affiliate_stores
  WHERE id = p_store_id;
  
  IF v_store_owner_id IS NULL THEN
    RAISE EXCEPTION 'Store not found';
  END IF;
  
  -- Check if a chat room already exists between this customer and store
  SELECT cr.id INTO v_room_id
  FROM chat_rooms cr
  WHERE cr.type = 'customer_service'
    AND cr.owner_id = v_store_owner_id
    AND EXISTS (
      SELECT 1 FROM room_members rm 
      WHERE rm.room_id = cr.id 
        AND rm.user_id = p_customer_profile_id
    );
  
  -- If room exists, return it
  IF v_room_id IS NOT NULL THEN
    RETURN v_room_id;
  END IF;
  
  -- Get room name from store
  SELECT store_name INTO v_room_name
  FROM affiliate_stores
  WHERE id = p_store_id;
  
  -- Create a new chat room
  INSERT INTO chat_rooms (name, type, owner_id, description, is_active)
  VALUES (
    COALESCE(v_room_name, 'دعم العملاء'),
    'customer_service',
    v_store_owner_id,
    'محادثة دعم العملاء',
    true
  )
  RETURNING id INTO v_room_id;
  
  -- Add the store owner as a member
  INSERT INTO room_members (room_id, user_id, role, is_active)
  VALUES (v_room_id, v_store_owner_id, 'owner', true)
  ON CONFLICT DO NOTHING;
  
  -- Add the customer as a member
  INSERT INTO room_members (room_id, user_id, role, is_active)
  VALUES (v_room_id, p_customer_profile_id, 'member', true)
  ON CONFLICT DO NOTHING;
  
  RETURN v_room_id;
END;
$$;