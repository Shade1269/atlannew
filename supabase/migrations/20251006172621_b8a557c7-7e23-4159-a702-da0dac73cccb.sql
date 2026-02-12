-- إنشاء دالة لإضافة الدور في user_roles عند إنشاء profile
CREATE OR REPLACE FUNCTION public.sync_user_role_on_profile_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- إدراج الدور في user_roles إذا لم يكن موجوداً
  INSERT INTO public.user_roles (user_id, role, is_active)
  VALUES (NEW.auth_user_id, NEW.role, true)
  ON CONFLICT (user_id, role) 
  DO UPDATE SET is_active = true;
  
  RETURN NEW;
END;
$$;

-- إنشاء trigger على profiles
DROP TRIGGER IF EXISTS sync_user_role_trigger ON public.profiles;
CREATE TRIGGER sync_user_role_trigger
  AFTER INSERT OR UPDATE OF role ON public.profiles
  FOR EACH ROW
  WHEN (NEW.auth_user_id IS NOT NULL AND NEW.role IS NOT NULL)
  EXECUTE FUNCTION public.sync_user_role_on_profile_insert();

-- إنشاء trigger على user_profiles
DROP TRIGGER IF EXISTS sync_user_role_trigger ON public.user_profiles;
CREATE TRIGGER sync_user_role_trigger
  AFTER INSERT OR UPDATE OF role ON public.user_profiles
  FOR EACH ROW
  WHEN (NEW.auth_user_id IS NOT NULL AND NEW.role IS NOT NULL)
  EXECUTE FUNCTION public.sync_user_role_on_profile_insert();

-- ملء الأدوار المفقودة من profiles (فقط للمستخدمين الموجودين في auth.users)
INSERT INTO public.user_roles (user_id, role, is_active)
SELECT DISTINCT p.auth_user_id, p.role, true
FROM public.profiles p
WHERE p.auth_user_id IS NOT NULL 
  AND p.role IS NOT NULL
  AND EXISTS (SELECT 1 FROM auth.users WHERE id = p.auth_user_id)
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = p.auth_user_id 
    AND ur.role = p.role
  )
ON CONFLICT (user_id, role) DO NOTHING;

-- ملء الأدوار المفقودة من user_profiles (فقط للمستخدمين الموجودين في auth.users)
INSERT INTO public.user_roles (user_id, role, is_active)
SELECT DISTINCT up.auth_user_id, up.role, true
FROM public.user_profiles up
WHERE up.auth_user_id IS NOT NULL 
  AND up.role IS NOT NULL
  AND EXISTS (SELECT 1 FROM auth.users WHERE id = up.auth_user_id)
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = up.auth_user_id 
    AND ur.role = up.role
  )
ON CONFLICT (user_id, role) DO NOTHING;