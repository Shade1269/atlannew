-- تحديث المستخدم الموجود ليصبح مؤكداً
UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  encrypted_password = crypt('123456', gen_salt('bf')),
  raw_user_meta_data = '{"full_name": "Shade"}'
WHERE email = 'shade199633@icloud.com';