-- إدراج البيانات الأولية لشركات الشحن السعودية

INSERT INTO public.shipping_providers (name, name_en, code, logo_url, api_endpoint, supported_services, configuration) VALUES
('سمسا إكسبرس', 'SMSA Express', 'SMSA', null, 'https://api.smsaexpress.com', 
 '["standard", "express", "cod"]'::jsonb,
 '{"api_key_required": true, "supports_cod": true, "max_weight": 30}'::jsonb),

('البريد السعودي', 'Saudi Post', 'SAUDI_POST', null, 'https://api.splonline.com.sa',
 '["standard", "express", "registered"]'::jsonb,
 '{"api_key_required": true, "supports_cod": true, "max_weight": 50}'::jsonb),

('أرامكس', 'Aramex', 'ARAMEX', null, 'https://ws.aramex.net',
 '["standard", "express", "overnight"]'::jsonb,
 '{"api_key_required": true, "supports_cod": true, "max_weight": 25}'::jsonb),

('فاست لو', 'Fastlo', 'FASTLO', null, 'https://api.fastlo.me',
 '["same_day", "next_day", "standard"]'::jsonb,
 '{"api_key_required": true, "supports_cod": true, "max_weight": 20}'::jsonb),

('أجيال', 'Ajial', 'AJIAL', null, 'https://api.ajial.sa',
 '["standard", "express"]'::jsonb,
 '{"api_key_required": true, "supports_cod": true, "max_weight": 30}'::jsonb);

-- إدراج المناطق الرئيسية في السعودية
INSERT INTO public.shipping_zones (name, name_en, zone_code, zone_type, delivery_days_min, delivery_days_max) VALUES
-- المناطق الرئيسية
('منطقة الرياض', 'Riyadh Region', 'RY', 'region', 1, 2),
('المنطقة الشرقية', 'Eastern Province', 'EP', 'region', 1, 3),
('منطقة مكة المكرمة', 'Makkah Region', 'MK', 'region', 1, 3),
('منطقة المدينة المنورة', 'Madinah Region', 'MD', 'region', 2, 4),
('منطقة القصيم', 'Qassim Region', 'QS', 'region', 2, 3),
('المنطقة الشمالية', 'Northern Region', 'NR', 'region', 2, 4),
('منطقة حائل', 'Hail Region', 'HL', 'region', 2, 4),
('منطقة تبوك', 'Tabuk Region', 'TB', 'region', 2, 4),
('منطقة الجوف', 'Al Jawf Region', 'JF', 'region', 3, 5),
('منطقة عسير', 'Asir Region', 'AS', 'region', 2, 4),
('منطقة الباحة', 'Al Bahah Region', 'BH', 'region', 2, 4),
('منطقة نجران', 'Najran Region', 'NJ', 'region', 3, 5),
('منطقة جازان', 'Jazan Region', 'JZ', 'region', 2, 4);

-- المدن الرئيسية
DO $$
DECLARE
    riyadh_id UUID;
    eastern_id UUID;
    makkah_id UUID;
    madinah_id UUID;
BEGIN
    -- الحصول على معرفات المناطق
    SELECT id INTO riyadh_id FROM public.shipping_zones WHERE zone_code = 'RY';
    SELECT id INTO eastern_id FROM public.shipping_zones WHERE zone_code = 'EP';
    SELECT id INTO makkah_id FROM public.shipping_zones WHERE zone_code = 'MK';
    SELECT id INTO madinah_id FROM public.shipping_zones WHERE zone_code = 'MD';
    
    -- إدراج المدن الرئيسية
    INSERT INTO public.shipping_zones (name, name_en, zone_code, zone_type, parent_zone_id, postal_codes, delivery_days_min, delivery_days_max) VALUES
    -- مدن الرياض
    ('الرياض', 'Riyadh', 'RYD_CITY', 'city', riyadh_id, ARRAY['11564', '11575', '11586', '11693'], 1, 1),
    ('الخرج', 'Al Kharj', 'KHARJ', 'city', riyadh_id, ARRAY['11942'], 1, 2),
    ('الدرعية', 'Diriyah', 'DIRIYAH', 'city', riyadh_id, ARRAY['15811'], 1, 2),
    
    -- مدن المنطقة الشرقية
    ('الدمام', 'Dammam', 'DAMMAM', 'city', eastern_id, ARRAY['31441', '31451', '31461'], 1, 2),
    ('الخبر', 'Al Khobar', 'KHOBAR', 'city', eastern_id, ARRAY['31952', '31982'], 1, 2),
    ('الظهران', 'Dhahran', 'DHAHRAN', 'city', eastern_id, ARRAY['31261'], 1, 2),
    ('الجبيل', 'Jubail', 'JUBAIL', 'city', eastern_id, ARRAY['35514'], 1, 3),
    ('الأحساء', 'Al Ahsa', 'AHSA', 'city', eastern_id, ARRAY['31982'], 2, 3),
    
    -- مدن مكة المكرمة
    ('مكة المكرمة', 'Makkah', 'MAKKAH', 'city', makkah_id, ARRAY['21955', '24231'], 1, 2),
    ('جدة', 'Jeddah', 'JEDDAH', 'city', makkah_id, ARRAY['21577', '23218', '23321'], 1, 2),
    ('الطائف', 'Taif', 'TAIF', 'city', makkah_id, ARRAY['21944'], 2, 3),
    
    -- مدن المدينة المنورة
    ('المدينة المنورة', 'Madinah', 'MADINAH_CITY', 'city', madinah_id, ARRAY['42311', '41511'], 2, 3),
    ('ينبع', 'Yanbu', 'YANBU', 'city', madinah_id, ARRAY['46455'], 2, 4);
END $$;