-- إضافة merchant لجميع الحسابات القديمة التي ليس لديها merchant
INSERT INTO public.merchants (profile_id, business_name, default_commission_rate, vat_enabled)
SELECT 
  p.id,
  COALESCE(p.full_name, p.email, 'مستخدم') || ' - متجر',
  10.00,
  true
FROM public.profiles p
LEFT JOIN public.merchants m ON m.profile_id = p.id
WHERE m.id IS NULL
  AND p.id IS NOT NULL
ON CONFLICT (profile_id) DO NOTHING;