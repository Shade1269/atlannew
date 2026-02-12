-- إسقاط القيد القديم
ALTER TABLE chat_rooms DROP CONSTRAINT chat_rooms_type_check;

-- إنشاء قيد جديد يسمح بنوع customer_service
ALTER TABLE chat_rooms ADD CONSTRAINT chat_rooms_type_check 
CHECK (type = ANY (ARRAY['public'::text, 'private'::text, 'direct'::text, 'customer_service'::text]));

-- تحديث الدالة لتستخدم النوع الصحيح
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
  -- الحصول على مالك المتجر
  SELECT profile_id INTO v_store_owner_id
  FROM affiliate_stores
  WHERE id = p_store_id;

  IF v_store_owner_id IS NULL THEN
    RAISE EXCEPTION 'Store not found';
  END IF;

  -- البحث عن غرفة موجودة
  SELECT cr.id INTO v_room_id
  FROM chat_rooms cr
  INNER JOIN room_members rm1 ON rm1.room_id = cr.id AND rm1.user_id = p_customer_profile_id
  INNER JOIN room_members rm2 ON rm2.room_id = cr.id AND rm2.user_id = v_store_owner_id
  WHERE cr.type = 'customer_service'
  LIMIT 1;

  -- إذا لم توجد غرفة، إنشاء واحدة جديدة
  IF v_room_id IS NULL THEN
    SELECT store_name INTO v_room_name FROM affiliate_stores WHERE id = p_store_id;
    
    INSERT INTO chat_rooms (name, type, owner_id, is_active, description)
    VALUES (
      COALESCE(v_room_name, 'دردشة دعم العملاء'),
      'customer_service',
      v_store_owner_id,
      true,
      'غرفة دعم العملاء'
    )
    RETURNING id INTO v_room_id;

    -- إضافة العميل كعضو
    INSERT INTO room_members (room_id, user_id, role, is_active)
    VALUES (v_room_id, p_customer_profile_id, 'member', true)
    ON CONFLICT (room_id, user_id) DO NOTHING;

    -- إضافة مالك المتجر كعضو
    INSERT INTO room_members (room_id, user_id, role, is_active)
    VALUES (v_room_id, v_store_owner_id, 'owner', true)
    ON CONFLICT (room_id, user_id) DO NOTHING;
  END IF;

  RETURN v_room_id;
END;
$$;