ALTER TABLE public.chat_rooms 
ADD COLUMN IF NOT EXISTS affiliate_store_id UUID REFERENCES public.affiliate_stores(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS customer_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- إنشاء فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_chat_rooms_affiliate_store_id ON public.chat_rooms(affiliate_store_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_customer_profile_id ON public.chat_rooms(customer_profile_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_last_message_at ON public.chat_rooms(last_message_at);

DROP POLICY IF EXISTS "Customers can view their own customer service chats" ON public.chat_rooms;
CREATE POLICY "Customers can view their own customer service chats" ON public.chat_rooms
  FOR SELECT USING (
    type = 'direct' AND 
    customer_profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Store owners can view their store's customer service chats" ON public.chat_rooms;
CREATE POLICY "Store owners can view their store's customer service chats" ON public.chat_rooms
  FOR SELECT USING (
    type = 'direct' AND
    affiliate_store_id IN (
      SELECT id FROM public.affiliate_stores WHERE profile_id IN (
        SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Authenticated users can create customer service chats" ON public.chat_rooms;
CREATE POLICY "Authenticated users can create customer service chats" ON public.chat_rooms
  FOR INSERT WITH CHECK (
    type = 'direct' AND
    auth.uid() IS NOT NULL AND
    (
      customer_profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()) OR
      owner_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    )
  );

CREATE OR REPLACE FUNCTION public.get_or_create_customer_service_chat(
  p_store_id UUID,
  p_customer_profile_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_room_id UUID;
  v_store_owner_id UUID;
  v_room_name TEXT;
BEGIN
  SELECT profile_id INTO v_store_owner_id
  FROM public.affiliate_stores
  WHERE id = p_store_id;

  IF v_store_owner_id IS NULL THEN
    RAISE EXCEPTION 'Store not found';
  END IF;

  SELECT id INTO v_room_id
  FROM public.chat_rooms
  WHERE type = 'direct'
    AND affiliate_store_id = p_store_id
    AND customer_profile_id = p_customer_profile_id;

  IF v_room_id IS NULL THEN
    SELECT 'دردشة خدمة العملاء - ' || store_name INTO v_room_name
    FROM public.affiliate_stores
    WHERE id = p_store_id;

    INSERT INTO public.chat_rooms (
      name,
      description,
      type,
      owner_id,
      affiliate_store_id,
      customer_profile_id,
      is_active,
      max_members
    ) VALUES (
      v_room_name,
      'محادثة خدمة العملاء',
      'direct',
      v_store_owner_id,
      p_store_id,
      p_customer_profile_id,
      true,
      2
    )
    RETURNING id INTO v_room_id;

    INSERT INTO public.room_members (room_id, user_id, role)
    VALUES 
      (v_room_id, p_customer_profile_id, 'member'),
      (v_room_id, v_store_owner_id, 'owner');
  END IF;

  RETURN v_room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.update_chat_room_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_rooms
  SET last_message_at = NEW.created_at
  WHERE id = NEW.room_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_chat_room_last_message_trigger ON public.chat_messages;
CREATE TRIGGER update_chat_room_last_message_trigger
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_chat_room_last_message();
