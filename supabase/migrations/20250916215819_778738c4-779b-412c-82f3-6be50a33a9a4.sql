-- إضافة RLS policies للجداول الجديدة لإصلاح مشاكل الأمان
ALTER TABLE public.store_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_store_themes ENABLE ROW LEVEL SECURITY;

-- سياسات للثيمات العامة
CREATE POLICY "Anyone can view active themes" 
ON public.store_themes 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage themes" 
ON public.store_themes 
FOR ALL 
USING (get_current_user_role() = 'admin');

-- سياسات لثيمات المتاجر
CREATE POLICY "Store owners can manage their store themes" 
ON public.affiliate_store_themes 
FOR ALL 
USING (
  store_id IN (
    SELECT id FROM affiliate_stores 
    WHERE profile_id IN (
      SELECT id FROM profiles 
      WHERE auth_user_id = auth.uid()
    )
  )
);

CREATE POLICY "Store owners can view their store themes" 
ON public.affiliate_store_themes 
FOR SELECT 
USING (
  store_id IN (
    SELECT id FROM affiliate_stores 
    WHERE profile_id IN (
      SELECT id FROM profiles 
      WHERE auth_user_id = auth.uid()
    )
  )
);

-- تحديث الدوال لتكون أكثر أماناً
CREATE OR REPLACE FUNCTION apply_theme_to_store(
  p_store_id UUID,
  p_theme_id UUID,
  p_custom_config JSONB DEFAULT '{}'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id UUID;
BEGIN
  -- التأكد من أن المستخدم يملك المتجر
  SELECT profile_id INTO v_profile_id
  FROM affiliate_stores 
  WHERE id = p_store_id;
  
  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'متجر غير موجود';
  END IF;
  
  -- التأكد من أن المستخدم مصرح له
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = v_profile_id AND auth_user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'غير مصرح بتعديل هذا المتجر';
  END IF;
  
  -- التأكد من أن الثيم موجود وفعال
  IF NOT EXISTS (
    SELECT 1 FROM store_themes 
    WHERE id = p_theme_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'الثيم غير موجود أو غير فعال';
  END IF;
  
  -- تحديث المتجر بالثيم الجديد
  UPDATE affiliate_stores 
  SET current_theme_id = p_theme_id, updated_at = now()
  WHERE id = p_store_id;
  
  -- إدراج أو تحديث إعدادات الثيم للمتجر
  INSERT INTO affiliate_store_themes (store_id, theme_id, custom_config)
  VALUES (p_store_id, p_theme_id, p_custom_config)
  ON CONFLICT (store_id) 
  DO UPDATE SET 
    theme_id = p_theme_id,
    custom_config = p_custom_config,
    applied_at = now(),
    updated_at = now();
    
  RETURN TRUE;
END;
$$;

-- تحديث دالة الحصول على إعدادات الثيم
CREATE OR REPLACE FUNCTION get_store_theme_config(p_store_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_theme_config JSONB;
  v_custom_config JSONB;
BEGIN
  SELECT 
    st.theme_config,
    COALESCE(ast.custom_config, '{}')
  INTO v_theme_config, v_custom_config
  FROM affiliate_stores as_table
  LEFT JOIN store_themes st ON st.id = as_table.current_theme_id
  LEFT JOIN affiliate_store_themes ast ON ast.store_id = p_store_id
  WHERE as_table.id = p_store_id;
  
  -- دمج الإعدادات الأساسية مع التخصيصات
  RETURN COALESCE(v_theme_config, '{}') || COALESCE(v_custom_config, '{}');
END;
$$;