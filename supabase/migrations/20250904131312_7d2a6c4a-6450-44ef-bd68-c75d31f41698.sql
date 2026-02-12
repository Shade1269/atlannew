-- إضافة المستخدم كمشرف مباشرة
-- أولاً إنشاء المستخدم في profiles إذا لم يكن موجود
INSERT INTO public.profiles (email, full_name, role, is_active, points, created_at, updated_at)
VALUES ('shade010@hotmail.com', 'Shade', 'moderator', true, 0, now(), now())
ON CONFLICT (email) 
DO UPDATE SET 
  role = 'moderator',
  is_active = true,
  updated_at = now();

-- التأكد من إعطاء صلاحيات المشرف
UPDATE public.profiles 
SET role = 'moderator', is_active = true, updated_at = now()
WHERE email = 'shade010@hotmail.com';