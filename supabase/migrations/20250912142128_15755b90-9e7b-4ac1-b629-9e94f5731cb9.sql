-- إنشاء بيانات تجريبية شاملة (نسخة مبسطة ومحدثة)

DO $$
DECLARE
    i INTEGER;
    test_profile_id UUID;
    test_shop_id UUID;
    test_product_id UUID;
    test_merchant_id UUID;
BEGIN
    -- إنشاء ملفات المستخدمين التجريبية (50 مستخدم)
    FOR i IN 1..50 LOOP
        INSERT INTO public.profiles (
            auth_user_id,
            email,
            full_name,
            phone,
            role,
            level,
            is_active,
            points,
            total_earnings,
            created_at
        ) VALUES (
            gen_random_uuid(),
            'customer' || i || '@test.com',
            CASE 
                WHEN i % 4 = 0 THEN 'محمد أحمد العلي'
                WHEN i % 4 = 1 THEN 'فاطمة سالم النور'
                WHEN i % 4 = 2 THEN 'عبدالله خالد الشمري'
                ELSE 'نور عبدالرحمن الزهراني'
            END || ' ' || i,
            '+966' || (500000000 + i)::TEXT,
            CASE 
                WHEN i <= 5 THEN 'merchant'::user_role
                WHEN i <= 15 THEN 'affiliate'::user_role
                WHEN i = 16 THEN 'admin'::user_role
                ELSE 'customer'::user_role
            END,
            CASE 
                WHEN i % 5 = 0 THEN 'gold'::user_level
                WHEN i % 3 = 0 THEN 'silver'::user_level
                ELSE 'bronze'::user_level
            END,
            true,
            (random() * 1000)::INTEGER,
            (random() * 5000)::NUMERIC(10,2),
            now() - (random() * interval '90 days')
        ) RETURNING id INTO test_profile_id;
    END LOOP;

    -- إنشاء merchants أولاً للتجار
    FOR i IN 1..8 LOOP
        SELECT id INTO test_profile_id FROM profiles WHERE role IN ('merchant', 'admin') ORDER BY random() LIMIT 1;
        
        INSERT INTO public.merchants (
            profile_id,
            business_name,
            vat_enabled,
            default_commission_rate,
            created_at
        ) VALUES (
            test_profile_id,
            'شركة ' || CASE i % 4
                WHEN 0 THEN 'الأناقة التجارية'
                WHEN 1 THEN 'عالم التقنية'
                WHEN 2 THEN 'الجمال العصري'
                ELSE 'الهدايا المميزة'
            END || ' ' || i,
            i % 2 = 0,
            (10 + (random() * 10))::NUMERIC(5,2),
            now() - (random() * interval '60 days')
        ) RETURNING id INTO test_merchant_id;

        -- إنشاء متجر لكل تاجر
        INSERT INTO public.shops (
            owner_id,
            display_name,
            slug,
            bio,
            logo_url,
            theme,
            settings,
            created_at
        ) VALUES (
            test_profile_id,
            'متجر ' || CASE i % 4
                WHEN 0 THEN 'الأناقة الذهبية'
                WHEN 1 THEN 'عالم التقنية المتقدم'
                WHEN 2 THEN 'بيت الجمال العصري'
                ELSE 'واحة الهدايا المميزة'
            END || ' ' || i,
            'shop-' || i || '-' || substr(gen_random_uuid()::text, 1, 8),
            'متجر متخصص في بيع أفضل المنتجات عالية الجودة مع خدمة عملاء استثنائية',
            '/lovable-uploads/0e23a745-b356-4596-95c0-39b0050acbd1.png',
            CASE i % 3 
                WHEN 0 THEN 'modern'
                WHEN 1 THEN 'classic'
                ELSE 'minimal'
            END,
            jsonb_build_object(
                'phone', '+966' || (500000000 + i)::TEXT,
                'email', 'shop' || i || '@test.com',
                'primary_color', CASE i % 4 
                    WHEN 0 THEN '#8B5CF6' 
                    WHEN 1 THEN '#F59E0B'
                    WHEN 2 THEN '#10B981'
                    ELSE '#EF4444'
                END
            ),
            now() - (random() * interval '60 days')
        ) RETURNING id INTO test_shop_id;

        -- إنشاء منتجات لكل متجر (25 منتج لكل متجر)
        FOR j IN 1..25 LOOP
            INSERT INTO public.products (
                shop_id,
                merchant_id,
                title,
                description,
                price_sar,
                stock,
                sku,
                category,
                tags,
                images,
                is_active,
                created_at,
                commission_rate
            ) VALUES (
                test_shop_id,
                test_merchant_id,
                CASE (j % 15)
                    WHEN 0 THEN 'ساعة ذكية متقدمة'
                    WHEN 1 THEN 'عطر فاخر أصلي'
                    WHEN 2 THEN 'حقيبة جلدية أنيقة'
                    WHEN 3 THEN 'هاتف ذكي حديث'
                    WHEN 4 THEN 'لابتوب عالي الأداء'
                    WHEN 5 THEN 'كاميرا احترافية'
                    WHEN 6 THEN 'سماعات لاسلكية'
                    WHEN 7 THEN 'طقم مجوهرات'
                    WHEN 8 THEN 'معطف شتوي'
                    WHEN 9 THEN 'حذاء رياضي'
                    WHEN 10 THEN 'نظارة شمسية'
                    WHEN 11 THEN 'محفظة جلدية'
                    WHEN 12 THEN 'شنطة سفر'
                    WHEN 13 THEN 'جهاز تابلت'
                    ELSE 'منتج مميز'
                END || ' - موديل ' || (i * 25 + j),
                'منتج عالي الجودة مع ضمان شامل وتصميم عصري يلبي احتياجات العملاء المميزين.',
                (50 + (random() * 1950))::NUMERIC(10,2),
                (10 + (random() * 490))::INTEGER,
                'SKU-' || LPAD((i * 25 + j)::TEXT, 6, '0'),
                CASE (j % 6)
                    WHEN 0 THEN 'electronics'
                    WHEN 1 THEN 'fashion'
                    WHEN 2 THEN 'beauty'
                    WHEN 3 THEN 'home'
                    WHEN 4 THEN 'sports'
                    ELSE 'other'
                END,
                ARRAY['جودة عالية', 'مميز', 'ضمان', 'توصيل سريع'],
                jsonb_build_array('/lovable-uploads/0e23a745-b356-4596-95c0-39b0050acbd1.png'),
                true,
                now() - (random() * interval '120 days'),
                (5 + (random() * 15))::NUMERIC(5,2)
            );
        END LOOP;
    END LOOP;

    -- إنشاء متاجر أفيليت
    FOR i IN 1..8 LOOP
        SELECT id INTO test_profile_id FROM profiles WHERE role = 'affiliate' ORDER BY random() LIMIT 1;
        
        INSERT INTO public.affiliate_stores (
            profile_id,
            store_name,
            store_slug,
            bio,
            logo_url,
            theme,
            total_sales,
            total_orders,
            is_active,
            created_at
        ) VALUES (
            test_profile_id,
            'متجر المسوق ' || i || ' المتخصص',
            'affiliate-store-' || i || '-' || substr(gen_random_uuid()::text, 1, 8),
            'متجر متخصص في تسويق أفضل المنتجات مع خصومات حصرية للعملاء',
            '/lovable-uploads/0e23a745-b356-4596-95c0-39b0050acbd1.png',
            CASE i % 3
                WHEN 0 THEN 'modern'::theme_type
                WHEN 1 THEN 'classic'::theme_type
                ELSE 'minimal'::theme_type
            END,
            (random() * 50000)::NUMERIC(10,2),
            (random() * 100)::INTEGER,
            true,
            now() - (random() * interval '60 days')
        );
    END LOOP;

    -- إضافة بعض الأنشطة
    FOR i IN 1..50 LOOP
        SELECT id INTO test_profile_id FROM profiles ORDER BY random() LIMIT 1;
        
        INSERT INTO public.user_activities (
            user_id,
            activity_type,
            description,
            created_at
        ) VALUES (
            test_profile_id,
            CASE i % 5
                WHEN 0 THEN 'login'
                WHEN 1 THEN 'product_view'
                WHEN 2 THEN 'profile_update'
                WHEN 3 THEN 'shop_visit'
                ELSE 'search'
            END,
            CASE i % 5
                WHEN 0 THEN 'تسجيل دخول المستخدم'
                WHEN 1 THEN 'مشاهدة منتج'
                WHEN 2 THEN 'تحديث الملف الشخصي'
                WHEN 3 THEN 'زيارة متجر'
                ELSE 'البحث في المنتجات'
            END,
            now() - (random() * interval '30 days')
        );
    END LOOP;

END $$;