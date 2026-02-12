-- تحديث أو إنشاء المستخدم بصلاحيات admin
-- البحث عن المستخدم أولاً وتحديث دوره
UPDATE public.profiles 
SET role = 'admin'::user_role, 
    is_active = true,
    updated_at = now()
WHERE email = 'shade199633@icloud.com';

-- إذا لم يكن المستخدم موجود، إنشاء profile له
INSERT INTO public.profiles (
  email, 
  full_name, 
  role, 
  is_active, 
  points, 
  total_earnings,
  level,
  created_at,
  updated_at
)
SELECT 
  'shade199633@icloud.com',
  'Shade Admin',
  'admin'::user_role,
  true,
  0,
  0,
  'bronze'::user_level,
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE email = 'shade199633@icloud.com'
);

-- تحديث في جدول user_profiles أيضاً إذا كان موجود
UPDATE public.user_profiles 
SET role = 'admin'::user_role, 
    is_active = true,
    updated_at = now()
WHERE email = 'shade199633@icloud.com';

-- إنشاء سجل في user_profiles إذا لم يكن موجود
INSERT INTO public.user_profiles (
  email, 
  full_name, 
  role, 
  is_active, 
  points, 
  total_earnings,
  level,
  created_at,
  updated_at
)
SELECT 
  'shade199633@icloud.com',
  'Shade Admin',
  'admin'::user_role,
  true,
  0,
  0,
  'bronze'::user_level,
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_profiles WHERE email = 'shade199633@icloud.com'
);