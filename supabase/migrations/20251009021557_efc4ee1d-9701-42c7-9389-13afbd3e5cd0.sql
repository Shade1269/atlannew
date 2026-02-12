-- تفعيل RLS لجدول shipping_providers
ALTER TABLE public.shipping_providers ENABLE ROW LEVEL SECURITY;

-- السماح للمستخدمين بقراءة شركات الشحن النشطة
CREATE POLICY "Public can view active shipping providers"
ON public.shipping_providers
FOR SELECT
TO public
USING (is_active = true);

-- السماح للأدمن بإدارة شركات الشحن
CREATE POLICY "Admins can manage shipping providers"
ON public.shipping_providers
FOR ALL
TO authenticated
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

-- تفعيل RLS لجدول shipping_zones
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;

-- السماح للجميع بقراءة المناطق النشطة
CREATE POLICY "Public can view active shipping zones"
ON public.shipping_zones
FOR SELECT
TO public
USING (is_active = true);

-- السماح للأدمن بإدارة المناطق
CREATE POLICY "Admins can manage shipping zones"
ON public.shipping_zones
FOR ALL
TO authenticated
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');