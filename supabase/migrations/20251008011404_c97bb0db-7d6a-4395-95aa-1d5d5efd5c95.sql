-- إضافة merchant للحساب الأخير المسجل (مصحح)
DO $$
DECLARE
  v_profile_id UUID;
  v_user_name TEXT;
BEGIN
  -- الحصول على معرف الـ profile للمستخدم
  SELECT p.id, COALESCE(p.full_name, 'تاجر')
  INTO v_profile_id, v_user_name
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.auth_user_id
  WHERE u.email = 'pipakej247@aupvs.com'
  LIMIT 1;

  -- التأكد من أن الـ profile موجود
  IF v_profile_id IS NOT NULL THEN
    -- إنشاء merchant إذا لم يكن موجوداً
    INSERT INTO public.merchants (
      profile_id,
      business_name,
      default_commission_rate,
      vat_enabled
    )
    VALUES (
      v_profile_id,
      v_user_name || ' - متجر',
      10.00,
      true
    )
    ON CONFLICT (profile_id) DO NOTHING;
    
    RAISE NOTICE 'تم إضافة merchant بنجاح للحساب: %', 'pipakej247@aupvs.com';
  ELSE
    RAISE NOTICE 'لم يتم العثور على الحساب';
  END IF;
END $$;