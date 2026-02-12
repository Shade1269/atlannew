-- إضافة سياسات الأمان RLS للجداول الجديدة

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_settings_extended ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- سياسات جدول user_activities
CREATE POLICY "Users can view own activities" 
ON public.user_activities 
FOR SELECT 
USING (user_id IN (
  SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
));

CREATE POLICY "System can insert activities" 
ON public.user_activities 
FOR INSERT 
WITH CHECK (user_id IN (
  SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
));

-- سياسات جدول shop_settings_extended
CREATE POLICY "Shop owners can manage settings" 
ON public.shop_settings_extended 
FOR ALL 
USING (shop_id IN (
  SELECT s.id FROM public.shops s 
  JOIN public.profiles p ON p.id = s.owner_id 
  WHERE p.auth_user_id = auth.uid()
));

-- سياسات جدول user_sessions
CREATE POLICY "Users can manage own sessions" 
ON public.user_sessions 
FOR ALL 
USING (user_id IN (
  SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
));

-- إصلاح search_path للـ functions
ALTER FUNCTION update_last_activity() SET search_path = public;
ALTER FUNCTION create_user_shop(UUID, TEXT, TEXT) SET search_path = public;