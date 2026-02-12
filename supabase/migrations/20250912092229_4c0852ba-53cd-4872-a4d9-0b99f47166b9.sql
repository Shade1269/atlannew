-- إعادة هيكلة نظام الأدوار - إنشاء جدول منفصل للأدوار

-- إنشاء enum للأدوار
CREATE TYPE public.app_role AS ENUM ('admin', 'merchant', 'affiliate', 'customer', 'moderator');

-- إنشاء جدول الأدوار
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    assigned_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true,
    UNIQUE (user_id, role)
);

-- تفعيل RLS على جدول الأدوار
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- إنشاء دالة للتحقق من الأدوار
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND is_active = true
  )
$$;

-- دالة للحصول على أدوار المستخدم
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS SETOF app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
    AND is_active = true
$$;

-- دالة للحصول على الدور الأساسي للمستخدم
CREATE OR REPLACE FUNCTION public.get_primary_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
    AND is_active = true
  ORDER BY 
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'merchant' THEN 2
      WHEN 'affiliate' THEN 3
      WHEN 'moderator' THEN 4
      WHEN 'customer' THEN 5
    END
  LIMIT 1
$$;

-- نقل البيانات الموجودة من profiles إلى user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT 
  auth_user_id,
  role::app_role
FROM public.profiles 
WHERE auth_user_id IS NOT NULL
  AND role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- إضافة policies لجدول user_roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all user roles" 
ON public.user_roles 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their initial role" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (user_id = auth.uid() AND role = 'customer');

-- تحديث دالة get_current_user_role لتستخدم النظام الجديد
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role::text FROM public.get_primary_role(auth.uid())),
    'customer'::text
  );
$$;