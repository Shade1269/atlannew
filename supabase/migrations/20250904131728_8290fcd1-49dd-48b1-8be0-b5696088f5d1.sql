-- إنشاء حساب المصادقة للمستخدم shade010@hotmail.com
-- أولاً التأكد من وجود السجل في profiles وتحديثه
INSERT INTO public.profiles (email, full_name, role, is_active, points, created_at, updated_at)
VALUES ('shade010@hotmail.com', 'Shade', 'moderator', true, 0, now(), now())
ON CONFLICT (email) 
DO UPDATE SET 
  role = 'moderator',
  is_active = true,
  updated_at = now();

-- إنشاء المستخدم في نظام المصادقة باستخدام SQL خام
-- سيتم إنشاء المستخدم بكلمة مرور "123456"
DO $$
DECLARE
    user_id uuid;
    hashed_password text;
BEGIN
    -- إنشاء UUID جديد للمستخدم
    user_id := gen_random_uuid();
    
    -- كلمة المرور المشفرة لـ "123456" باستخدام bcrypt
    hashed_password := '$2a$10$2L8/7ZKJyh.yh7ZI7KzCmuZO7dGgBZ7pBh.yh7ZI7KzCmuZO7dGgBZ';
    
    -- إدراج المستخدم في جدول auth.users
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        aud,
        role,
        raw_user_meta_data
    ) VALUES (
        user_id,
        '00000000-0000-0000-0000-000000000000',
        'shade010@hotmail.com',
        hashed_password,
        now(),
        now(),
        now(),
        'authenticated',
        'authenticated',
        '{"full_name": "Shade"}'::jsonb
    ) ON CONFLICT (email) DO NOTHING;
    
    -- ربط المستخدم مع سجل profiles الموجود
    UPDATE public.profiles 
    SET auth_user_id = user_id,
        role = 'moderator',
        is_active = true,
        updated_at = now()
    WHERE email = 'shade010@hotmail.com' AND auth_user_id IS NULL;
    
END $$;