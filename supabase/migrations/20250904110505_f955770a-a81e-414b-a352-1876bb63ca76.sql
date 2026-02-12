-- إنشاء مستخدم جديد في auth.users و profiles
-- أولاً، إنشاء المستخدم في auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_sent_at,
  confirmation_token,
  recovery_sent_at,
  recovery_token,
  email_change_sent_at,
  email_change,
  email_change_token_new,
  email_change_token_current,
  phone_change_sent_at,
  phone_change,
  phone_change_token,
  reauthentication_sent_at,
  reauthentication_token,
  phone_confirmed_at,
  phone_change_confirmed_at,
  email_change_confirmed_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_change_new,
  email_change_new,
  is_sso_user,
  deleted_at,
  is_anonymous
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'Zahrhalharbi2@gmail.com',
  crypt('123456', gen_salt('bf')),
  now(),
  now(),
  '',
  null,
  '',
  null,
  '',
  '',
  '',
  null,
  null,
  '',
  null,
  '',
  null,
  null,
  null,
  null,
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "زهرة الحربي"}',
  false,
  now(),
  now(),
  null,
  null,
  null,
  false,
  null,
  false
) ON CONFLICT (email) DO NOTHING;

-- التأكد من وجود profile للمستخدم
INSERT INTO public.profiles (
  auth_user_id,
  email,
  full_name,
  role
) SELECT 
  au.id,
  au.email,
  'زهرة الحربي',
  'affiliate'::user_role
FROM auth.users au 
WHERE au.email = 'Zahrhalharbi2@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM public.profiles p 
  WHERE p.auth_user_id = au.id
);