-- إضافة أسعار الشحن النموذجية للشركات والمناطق

DO $$
DECLARE
    smsa_id UUID;
    saudi_post_id UUID;
    aramex_id UUID;
    riyadh_zone_id UUID;
    eastern_zone_id UUID;
    makkah_zone_id UUID;
BEGIN
    -- الحصول على معرفات الشركات
    SELECT id INTO smsa_id FROM public.shipping_providers WHERE code = 'SMSA';
    SELECT id INTO saudi_post_id FROM public.shipping_providers WHERE code = 'SAUDI_POST';
    SELECT id INTO aramex_id FROM public.shipping_providers WHERE code = 'ARAMEX';
    
    -- الحصول على معرفات المناطق
    SELECT id INTO riyadh_zone_id FROM public.shipping_zones WHERE zone_code = 'RY';
    SELECT id INTO eastern_zone_id FROM public.shipping_zones WHERE zone_code = 'EP';
    SELECT id INTO makkah_zone_id FROM public.shipping_zones WHERE zone_code = 'MK';
    
    -- إدراج أسعار سمسا إكسبرس
    INSERT INTO public.shipping_rates (provider_id, zone_id, service_type, weight_from, weight_to, base_price, price_per_kg, min_price, max_price) VALUES
    -- الرياض
    (smsa_id, riyadh_zone_id, 'standard', 0, 1, 15.00, 0, 15.00, null),
    (smsa_id, riyadh_zone_id, 'standard', 1, 5, 15.00, 5.00, 15.00, null),
    (smsa_id, riyadh_zone_id, 'standard', 5, 30, 15.00, 3.00, 15.00, null),
    (smsa_id, riyadh_zone_id, 'express', 0, 1, 25.00, 0, 25.00, null),
    (smsa_id, riyadh_zone_id, 'express', 1, 5, 25.00, 8.00, 25.00, null),
    (smsa_id, riyadh_zone_id, 'express', 5, 30, 25.00, 5.00, 25.00, null),
    
    -- المنطقة الشرقية
    (smsa_id, eastern_zone_id, 'standard', 0, 1, 20.00, 0, 20.00, null),
    (smsa_id, eastern_zone_id, 'standard', 1, 5, 20.00, 6.00, 20.00, null),
    (smsa_id, eastern_zone_id, 'standard', 5, 30, 20.00, 4.00, 20.00, null),
    (smsa_id, eastern_zone_id, 'express', 0, 1, 35.00, 0, 35.00, null),
    (smsa_id, eastern_zone_id, 'express', 1, 5, 35.00, 10.00, 35.00, null),
    (smsa_id, eastern_zone_id, 'express', 5, 30, 35.00, 7.00, 35.00, null),
    
    -- مكة المكرمة
    (smsa_id, makkah_zone_id, 'standard', 0, 1, 18.00, 0, 18.00, null),
    (smsa_id, makkah_zone_id, 'standard', 1, 5, 18.00, 6.00, 18.00, null),
    (smsa_id, makkah_zone_id, 'standard', 5, 30, 18.00, 4.00, 18.00, null),
    (smsa_id, makkah_zone_id, 'express', 0, 1, 30.00, 0, 30.00, null),
    (smsa_id, makkah_zone_id, 'express', 1, 5, 30.00, 9.00, 30.00, null),
    (smsa_id, makkah_zone_id, 'express', 5, 30, 30.00, 6.00, 30.00, null);

    -- إدراج أسعار البريد السعودي
    INSERT INTO public.shipping_rates (provider_id, zone_id, service_type, weight_from, weight_to, base_price, price_per_kg, min_price, max_price) VALUES
    -- الرياض
    (saudi_post_id, riyadh_zone_id, 'standard', 0, 1, 12.00, 0, 12.00, null),
    (saudi_post_id, riyadh_zone_id, 'standard', 1, 5, 12.00, 4.00, 12.00, null),
    (saudi_post_id, riyadh_zone_id, 'standard', 5, 50, 12.00, 2.50, 12.00, null),
    (saudi_post_id, riyadh_zone_id, 'express', 0, 1, 20.00, 0, 20.00, null),
    (saudi_post_id, riyadh_zone_id, 'express', 1, 5, 20.00, 6.00, 20.00, null),
    (saudi_post_id, riyadh_zone_id, 'express', 5, 50, 20.00, 4.00, 20.00, null),
    
    -- المنطقة الشرقية
    (saudi_post_id, eastern_zone_id, 'standard', 0, 1, 15.00, 0, 15.00, null),
    (saudi_post_id, eastern_zone_id, 'standard', 1, 5, 15.00, 5.00, 15.00, null),
    (saudi_post_id, eastern_zone_id, 'standard', 5, 50, 15.00, 3.00, 15.00, null),
    (saudi_post_id, eastern_zone_id, 'express', 0, 1, 28.00, 0, 28.00, null),
    (saudi_post_id, eastern_zone_id, 'express', 1, 5, 28.00, 8.00, 28.00, null),
    (saudi_post_id, eastern_zone_id, 'express', 5, 50, 28.00, 5.00, 28.00, null);

    -- إدراج أسعار أرامكس
    INSERT INTO public.shipping_rates (provider_id, zone_id, service_type, weight_from, weight_to, base_price, price_per_kg, min_price, max_price) VALUES
    -- الرياض
    (aramex_id, riyadh_zone_id, 'standard', 0, 1, 22.00, 0, 22.00, null),
    (aramex_id, riyadh_zone_id, 'standard', 1, 5, 22.00, 7.00, 22.00, null),
    (aramex_id, riyadh_zone_id, 'standard', 5, 25, 22.00, 4.50, 22.00, null),
    (aramex_id, riyadh_zone_id, 'express', 0, 1, 40.00, 0, 40.00, null),
    (aramex_id, riyadh_zone_id, 'express', 1, 5, 40.00, 12.00, 40.00, null),
    (aramex_id, riyadh_zone_id, 'express', 5, 25, 40.00, 8.00, 40.00, null),
    
    -- المنطقة الشرقية
    (aramex_id, eastern_zone_id, 'standard', 0, 1, 28.00, 0, 28.00, null),
    (aramex_id, eastern_zone_id, 'standard', 1, 5, 28.00, 8.00, 28.00, null),
    (aramex_id, eastern_zone_id, 'standard', 5, 25, 28.00, 5.50, 28.00, null),
    (aramex_id, eastern_zone_id, 'express', 0, 1, 45.00, 0, 45.00, null),
    (aramex_id, eastern_zone_id, 'express', 1, 5, 45.00, 15.00, 45.00, null),
    (aramex_id, eastern_zone_id, 'express', 5, 25, 45.00, 10.00, 45.00, null);

END $$;