-- إنشاء 4 غرف دردشة افتراضية

-- غرفة 1: الغرفة العامة الرئيسية
INSERT INTO public.chat_rooms (name, description, type, is_active, owner_id)
SELECT 
  'الغرفة العامة الرئيسية',
  'غرفة دردشة عامة للجميع - تواصل مع المسوقين والتجار',
  'public',
  true,
  id
FROM public.profiles
WHERE auth_user_id IN (
  SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1
)
ON CONFLICT DO NOTHING;

-- غرفة 2: منتدى التجار
INSERT INTO public.chat_rooms (name, description, type, is_active, owner_id)
SELECT 
  'منتدى التجار',
  'غرفة خاصة بالتجار لمناقشة المنتجات والعروض',
  'public',
  true,
  id
FROM public.profiles
WHERE auth_user_id IN (
  SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1
)
ON CONFLICT DO NOTHING;

-- غرفة 3: ساحة المسوقين
INSERT INTO public.chat_rooms (name, description, type, is_active, owner_id)
SELECT 
  'ساحة المسوقين',
  'غرفة للمسوقين لمشاركة الاستراتيجيات والنصائح',
  'public',
  true,
  id
FROM public.profiles
WHERE auth_user_id IN (
  SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1
)
ON CONFLICT DO NOTHING;

-- غرفة 4: نادي النخبة
INSERT INTO public.chat_rooms (name, description, type, is_active, owner_id)
SELECT 
  'نادي النخبة',
  'غرفة حصرية للمستويات العليا - الفضي والذهبي والأسطوري',
  'public',
  true,
  id
FROM public.profiles
WHERE auth_user_id IN (
  SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1
)
ON CONFLICT DO NOTHING;