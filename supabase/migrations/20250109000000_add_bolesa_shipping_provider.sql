-- إضافة شركة الشحن BOLESA
-- BOLESA هي منصة شحن متكاملة تستخدم ShipLink للتعامل مع شركات الشحن المتعددة
-- الشركات الفعلية (carriers) تُجلب ديناميكياً من BOLESA API بناءً على المسار والوزن

INSERT INTO public.shipping_providers (
  name,
  name_en,
  code,
  logo_url,
  api_endpoint,
  supported_services,
  configuration,
  is_active
) VALUES (
  'بوليصه',
  'Bolesa',
  'BOLESA',
  null,
  'https://app.bolesa.net/api',
  '["standard", "express"]'::jsonb,
  '{
    "api_key_required": true,
    "supports_cod": true,
    "max_weight": 999,
    "dynamic_carriers": true,
    "carrier_selection_strategy": {
      "priority": ["price", "speed", "name"],
      "filter_invalid_prices": true
    },
    "shiplink_integration": true,
    "features": [
      "real_time_pricing",
      "multiple_carriers",
      "automatic_carrier_selection",
      "tracking_support"
    ]
  }'::jsonb,
  true
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  api_endpoint = EXCLUDED.api_endpoint,
  supported_services = EXCLUDED.supported_services,
  configuration = EXCLUDED.configuration,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- ملاحظة: 
-- BOLESA لا تحتاج إلى shipping_rates ثابتة لأن:
-- 1. الأسعار تُحسب ديناميكياً من API بناءً على المسار والوزن
-- 2. الشركات (carriers) تُجلب من ShipLink integration
-- 3. الاستراتيجيات مطبقة في الكود (Backend & Frontend):
--    - ترتيب حسب السعر (الأرخص أولاً)
--    - ثم حسب السرعة (الأسرع أولاً)
--    - ثم حسب اسم الشركة (للاستقرار)
--    - فلترة الأسعار غير الصالحة (price <= 0)

