-- إنشاء سجلات merchant للحسابات الموجودة التي ليس لديها سجل merchant
INSERT INTO public.merchants (profile_id, business_name, default_commission_rate, vat_enabled)
SELECT 
  p.id,
  COALESCE(p.full_name, p.email, 'تاجر') || ' - متجر',
  10.00,
  true
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.merchants m WHERE m.profile_id = p.id
)
ON CONFLICT (profile_id) DO NOTHING;