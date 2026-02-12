-- تحسين جداول الدردشة وإضافة ميزات جديدة

-- إضافة جدول للغرف المتقدمة
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'public' CHECK (type IN ('public', 'private', 'direct')),
  owner_id UUID REFERENCES public.profiles(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  max_members INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إضافة جدول عضوية الغرف
CREATE TABLE IF NOT EXISTS public.room_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_banned BOOLEAN NOT NULL DEFAULT false,
  is_muted BOOLEAN NOT NULL DEFAULT false,
  muted_until TIMESTAMP WITH TIME ZONE,
  UNIQUE(room_id, user_id)
);

-- إضافة جدول الرسائل المحسن
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'voice', 'system')),
  reply_to_id UUID REFERENCES public.chat_messages(id),
  is_edited BOOLEAN NOT NULL DEFAULT false,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  pinned_by UUID REFERENCES public.profiles(id),
  pinned_at TIMESTAMP WITH TIME ZONE,
  reactions JSONB DEFAULT '{}',
  mentions UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  edited_at TIMESTAMP WITH TIME ZONE
);

-- إضافة جدول تفاعلات الرسائل
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- إضافة جدول تكامل أتلانتس مع الدردشة
CREATE TABLE IF NOT EXISTS public.atlantis_chat_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('message_sent', 'reaction_given', 'help_given', 'event_participation')),
  points_earned INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل RLS للجداول
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlantis_chat_points ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للغرف
CREATE POLICY "Users can view public rooms" ON public.chat_rooms
  FOR SELECT USING (type = 'public' OR id IN (
    SELECT room_id FROM public.room_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Room owners can manage their rooms" ON public.chat_rooms
  FOR ALL USING (owner_id = auth.uid());

-- سياسات الأمان لعضوية الغرف
CREATE POLICY "Users can view room memberships" ON public.room_members
  FOR SELECT USING (true);

CREATE POLICY "Users can join public rooms" ON public.room_members
  FOR INSERT WITH CHECK (
    room_id IN (SELECT id FROM public.chat_rooms WHERE type = 'public') OR
    room_id IN (SELECT id FROM public.chat_rooms WHERE owner_id = auth.uid())
  );

CREATE POLICY "Room members can leave" ON public.room_members
  FOR DELETE USING (user_id = auth.uid());

-- سياسات الأمان للرسائل
CREATE POLICY "Room members can view messages" ON public.chat_messages
  FOR SELECT USING (
    room_id IN (
      SELECT room_id FROM public.room_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Room members can send messages" ON public.chat_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    room_id IN (
      SELECT room_id FROM public.room_members 
      WHERE user_id = auth.uid() AND is_banned = false AND (is_muted = false OR muted_until < now())
    )
  );

CREATE POLICY "Users can edit their own messages" ON public.chat_messages
  FOR UPDATE USING (sender_id = auth.uid());

-- سياسات الأمان للتفاعلات
CREATE POLICY "Room members can manage reactions" ON public.message_reactions
  FOR ALL USING (
    message_id IN (
      SELECT id FROM public.chat_messages 
      WHERE room_id IN (
        SELECT room_id FROM public.room_members WHERE user_id = auth.uid()
      )
    )
  );

-- سياسات الأمان لنقاط أتلانتس
CREATE POLICY "Users can view their own chat points" ON public.atlantis_chat_points
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert chat points" ON public.atlantis_chat_points
  FOR INSERT WITH CHECK (true);

-- إنشاء فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_chat_rooms_type ON public.chat_rooms(type);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_owner ON public.chat_rooms(owner_id);
CREATE INDEX IF NOT EXISTS idx_room_members_room ON public.room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_room_members_user ON public.room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON public.chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON public.chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON public.message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_atlantis_chat_points_user ON public.atlantis_chat_points(user_id);

-- إنشاء دوال لنظام النقاط
CREATE OR REPLACE FUNCTION public.award_chat_points()
RETURNS TRIGGER AS $$
BEGIN
  -- منح نقاط عند إرسال رسالة (1 نقطة)
  IF TG_OP = 'INSERT' AND NEW.message_type = 'text' THEN
    INSERT INTO public.atlantis_chat_points (user_id, room_id, action_type, points_earned, description)
    VALUES (NEW.sender_id, NEW.room_id, 'message_sent', 1, 'نقطة مقابل إرسال رسالة');
    
    -- تحديث نقاط المستخدم في أتلانتس
    UPDATE public.atlantis_user_levels 
    SET total_points = total_points + 1,
        daily_points = daily_points + 1,
        weekly_points = weekly_points + 1
    WHERE user_id = NEW.sender_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء trigger لنقاط الدردشة
CREATE TRIGGER chat_points_trigger
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.award_chat_points();

-- إنشاء غرف افتراضية
INSERT INTO public.chat_rooms (name, description, type, owner_id) VALUES
  ('الغرفة العامة', 'غرفة للنقاش العام بين جميع الأعضاء', 'public', NULL),
  ('التسويق والمبيعات', 'نقاش حول استراتيجيات التسويق وتحسين المبيعات', 'public', NULL),
  ('الدعم الفني', 'طلب المساعدة والدعم الفني', 'public', NULL),
  ('أتلانتس - التحديات', 'مناقشة التحديات والمنافسات في نظام أتلانتس', 'public', NULL),
  ('التحالفات', 'تنسيق الأنشطة بين التحالفات المختلفة', 'public', NULL)
ON CONFLICT DO NOTHING;

-- إضافة دالة لتحديث timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إضافة triggers للتحديث
CREATE TRIGGER update_chat_rooms_updated_at
  BEFORE UPDATE ON public.chat_rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at
  BEFORE UPDATE ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();