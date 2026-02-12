-- إنشاء user profile للحساب الموجود إذا لم يكن موجود
INSERT INTO user_profiles (auth_user_id, email, full_name, role, level, points, total_earnings, is_active)
SELECT 
    '6714386a-af60-4569-855f-1021f5f82cb8'::uuid,
    'shade199633@icloud.com',
    'Shade',
    'admin'::user_role,
    'legendary'::user_level,
    9999,
    0,
    true
WHERE NOT EXISTS (
    SELECT 1 FROM user_profiles WHERE email = 'shade199633@icloud.com'
);

-- تحديث الدور إلى admin في كلا الجدولين للتأكد
UPDATE profiles 
SET role = 'admin'::user_role, is_active = true 
WHERE email = 'shade199633@icloud.com';

UPDATE user_profiles 
SET role = 'admin'::user_role, is_active = true, level = 'legendary'::user_level, points = 9999
WHERE email = 'shade199633@icloud.com';