-- إنشاء بيانات تجريبية شاملة للاختبار (محدث بناءً على الأعمدة الموجودة)

DO $$
DECLARE
    i INTEGER;
    test_profile_id UUID;
    test_shop_id UUID;
    test_product_id UUID;
    test_order_id UUID;
    test_affiliate_store_id UUID;
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

    -- إنشاء 15 متجر تجريبي
    FOR i IN 1..15 LOOP
        SELECT id INTO test_profile_id FROM profiles WHERE role IN ('merchant', 'admin') ORDER BY random() LIMIT 1;
        
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
            CASE 
                WHEN i % 5 = 0 THEN 'متجر الأناقة الذهبية'
                WHEN i % 5 = 1 THEN 'بيت الجمال العصري'
                WHEN i % 5 = 2 THEN 'عالم التقنية المتقدم'
                WHEN i % 5 = 3 THEN 'مملكة الأزياء الراقية'
                ELSE 'واحة الهدايا المميزة'
            END || ' ' || i,
            'shop-' || i || '-' || substr(gen_random_uuid()::text, 1, 8),
            'متجر متخصص في بيع أفضل المنتجات عالية الجودة مع خدمة عملاء استثنائية وضمان شامل على جميع المنتجات',
            '/lovable-uploads/0e23a745-b356-4596-95c0-39b0050acbd1.png',
            CASE i % 3 
                WHEN 0 THEN 'modern'
                WHEN 1 THEN 'classic'
                ELSE 'minimal'
            END,
            jsonb_build_object(
                'phone', '+966' || (500000000 + i)::TEXT,
                'email', 'shop' || i || '@test.com',
                'website', 'shop' || i || '.atlantis.com',
                'primary_color', CASE i % 4 
                    WHEN 0 THEN '#8B5CF6' 
                    WHEN 1 THEN '#F59E0B'
                    WHEN 2 THEN '#10B981'
                    ELSE '#EF4444'
                END
            ),
            now() - (random() * interval '60 days')
        ) RETURNING id INTO test_shop_id;
    END LOOP;

    -- إنشاء 200 منتج تجريبي موزع على المتاجر
    FOR i IN 1..200 LOOP
        SELECT id INTO test_shop_id FROM shops ORDER BY random() LIMIT 1;
        
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
            seo_title,
            seo_description,
            commission_rate
        ) VALUES (
            test_shop_id,
            (SELECT owner_id FROM shops WHERE id = test_shop_id),
            CASE (i % 20)
                WHEN 0 THEN 'ساعة ذكية متقدمة'
                WHEN 1 THEN 'عطر فاخر أصلي'
                WHEN 2 THEN 'حقيبة جلدية أنيقة'
                WHEN 3 THEN 'هاتف ذكي حديث'
                WHEN 4 THEN 'لابتوب عالي الأداء'
                WHEN 5 THEN 'كاميرا تصوير احترافية'
                WHEN 6 THEN 'سماعات لاسلكية'
                WHEN 7 THEN 'طقم مجوهرات راقي'
                WHEN 8 THEN 'معطف شتوي أنيق'
                WHEN 9 THEN 'حذاء رياضي مريح'
                WHEN 10 THEN 'نظارة شمسية عصرية'
                WHEN 11 THEN 'محفظة جلدية فاخرة'
                WHEN 12 THEN 'شنطة سفر قوية'
                WHEN 13 THEN 'جهاز تابلت ذكي'
                WHEN 14 THEN 'ساعة حائط مودرن'
                WHEN 15 THEN 'مصباح LED ديكوري'
                WHEN 16 THEN 'كوب قهوة حراري'
                WHEN 17 THEN 'وسادة طبية مريحة'
                WHEN 18 THEN 'مرآة مكياج بإضاءة'
                ELSE 'منتج مميز خاص'
            END || ' - موديل ' || i,
            'منتج عالي الجودة مصنوع من أفضل المواد الخام مع ضمان شامل لمدة عامين. يتميز بالتصميم العصري والأداء المتفوق الذي يلبي احتياجات العملاء المميزين.',
            (50 + (random() * 1950))::NUMERIC(10,2),
            (10 + (random() * 490))::INTEGER,
            'SKU-' || LPAD(i::TEXT, 6, '0'),
            CASE (i % 8)
                WHEN 0 THEN 'electronics'
                WHEN 1 THEN 'fashion'
                WHEN 2 THEN 'beauty'
                WHEN 3 THEN 'home'
                WHEN 4 THEN 'sports'
                WHEN 5 THEN 'books'
                WHEN 6 THEN 'toys'
                ELSE 'other'
            END,
            ARRAY['جودة عالية', 'مميز', 'أفضل سعر', 'ضمان', 'توصيل سريع'],
            jsonb_build_array('/lovable-uploads/0e23a745-b356-4596-95c0-39b0050acbd1.png', '/lovable-uploads/60b94ef9-9e25-4acc-ab85-a92fc7810b69.png'),
            true,
            now() - (random() * interval '120 days'),
            CASE (i % 20)
                WHEN 0 THEN 'ساعة ذكية متقدمة - أحدث التقنيات'
                WHEN 1 THEN 'عطر فاخر أصلي - رائحة مميزة'
                ELSE 'منتج عالي الجودة - أفضل الأسعار'
            END,
            'اكتشف منتجنا المميز بأفضل جودة وسعر تنافسي مع ضمان شامل وتوصيل مجاني',
            (5 + (random() * 15))::NUMERIC(5,2)
        ) RETURNING id INTO test_product_id;
    END LOOP;

    -- إنشاء متاجر أفيليت
    FOR i IN 1..10 LOOP
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
            'متجر متخصص في تسويق أفضل المنتجات مع خصومات حصرية وعروض مميزة لعملائنا الكرام',
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
        ) RETURNING id INTO test_affiliate_store_id;

        -- إضافة منتجات للمتاجر الأفيليت
        FOR j IN 1..20 LOOP
            SELECT id INTO test_product_id FROM products ORDER BY random() LIMIT 1;
            INSERT INTO public.affiliate_products (
                affiliate_store_id,
                product_id,
                sort_order,
                is_visible,
                added_at
            ) VALUES (
                test_affiliate_store_id,
                test_product_id,
                j,
                true,
                now() - (random() * interval '30 days')
            ) ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;

    -- إنشاء طلبات تجريبية
    FOR i IN 1..150 LOOP
        SELECT id INTO test_profile_id FROM profiles WHERE role IN ('customer', 'affiliate') ORDER BY random() LIMIT 1;
        SELECT id INTO test_shop_id FROM shops ORDER BY random() LIMIT 1;
        
        INSERT INTO public.ecommerce_orders (
            shop_id,
            user_id,
            order_number,
            customer_name,
            customer_phone,
            customer_email,
            shipping_address,
            payment_method,
            payment_status,
            status,
            subtotal_sar,
            shipping_sar,
            tax_sar,
            discount_sar,
            total_sar,
            shipping_method,
            notes,
            created_at,
            confirmed_at,
            shipped_at,
            delivered_at
        ) VALUES (
            test_shop_id,
            test_profile_id,
            'ORD-' || EXTRACT(YEAR FROM now())::TEXT || LPAD(i::TEXT, 6, '0'),
            (SELECT full_name FROM profiles WHERE id = test_profile_id),
            (SELECT phone FROM profiles WHERE id = test_profile_id),
            (SELECT email FROM profiles WHERE id = test_profile_id),
            jsonb_build_object(
                'name', 'عبدالله أحمد السعيد',
                'phone', '+966501234567',
                'street', 'شارع الملك فهد، حي الملك فيصل',
                'city', CASE i % 5 
                    WHEN 0 THEN 'الرياض'
                    WHEN 1 THEN 'جدة'
                    WHEN 2 THEN 'الدمام'
                    WHEN 3 THEN 'مكة المكرمة'
                    ELSE 'المدينة المنورة'
                END,
                'postal_code', (11000 + (i % 1000))::TEXT,
                'country', 'السعودية'
            ),
            CASE i % 3
                WHEN 0 THEN 'CREDIT_CARD'::payment_method
                WHEN 1 THEN 'BANK_TRANSFER'::payment_method
                ELSE 'CASH_ON_DELIVERY'::payment_method
            END,
            CASE i % 4
                WHEN 0 THEN 'COMPLETED'::payment_status
                WHEN 1 THEN 'PENDING'::payment_status
                WHEN 2 THEN 'FAILED'::payment_status
                ELSE 'REFUNDED'::payment_status
            END,
            CASE i % 6
                WHEN 0 THEN 'DELIVERED'::order_status
                WHEN 1 THEN 'SHIPPED'::order_status
                WHEN 2 THEN 'CONFIRMED'::order_status
                WHEN 3 THEN 'PROCESSING'::order_status
                WHEN 4 THEN 'CANCELLED'::order_status
                ELSE 'PENDING'::order_status
            END,
            (50 + (random() * 1450))::NUMERIC(10,2),
            CASE WHEN i % 4 = 0 THEN 0 ELSE 15 END,
            0, -- سيتم حساب الضريبة
            CASE WHEN i % 5 = 0 THEN (random() * 100)::NUMERIC(10,2) ELSE 0 END,
            0, -- سيتم حساب المجموع
            CASE i % 3
                WHEN 0 THEN 'STANDARD'::shipping_method
                WHEN 1 THEN 'EXPRESS'::shipping_method
                ELSE 'SAME_DAY'::shipping_method
            END,
            CASE WHEN i % 10 = 0 THEN 'طلب عاجل، يرجى الإسراع في التوصيل' ELSE NULL END,
            now() - (random() * interval '45 days'),
            CASE WHEN i % 6 != 4 THEN now() - (random() * interval '40 days') ELSE NULL END,
            CASE WHEN i % 6 IN (0, 1) THEN now() - (random() * interval '30 days') ELSE NULL END,
            CASE WHEN i % 6 = 0 THEN now() - (random() * interval '20 days') ELSE NULL END
        ) RETURNING id INTO test_order_id;

        -- إضافة عناصر للطلبات
        FOR j IN 1..(1 + (random() * 4)::INTEGER) LOOP
            SELECT id INTO test_product_id FROM products WHERE shop_id = test_shop_id ORDER BY random() LIMIT 1;
            
            INSERT INTO public.ecommerce_order_items (
                order_id,
                product_id,
                product_title,
                product_sku,
                quantity,
                unit_price_sar,
                total_price_sar,
                commission_rate,
                commission_sar,
                created_at
            ) VALUES (
                test_order_id,
                test_product_id,
                (SELECT title FROM products WHERE id = test_product_id),
                (SELECT sku FROM products WHERE id = test_product_id),
                (1 + (random() * 3)::INTEGER),
                (SELECT price_sar FROM products WHERE id = test_product_id),
                ((1 + (random() * 3)::INTEGER) * (SELECT price_sar FROM products WHERE id = test_product_id)),
                (5 + (random() * 15))::NUMERIC(5,2),
                0, -- سيتم حساب العمولة لاحقاً
                now() - (random() * interval '45 days')
            );
        END LOOP;

        -- تحديث مجموع الطلب
        UPDATE public.ecommerce_orders 
        SET 
            subtotal_sar = (SELECT COALESCE(SUM(total_price_sar), 0) FROM ecommerce_order_items WHERE order_id = test_order_id),
            tax_sar = (SELECT COALESCE(SUM(total_price_sar), 0) * 0.15 FROM ecommerce_order_items WHERE order_id = test_order_id),
            total_sar = (
                SELECT COALESCE(SUM(total_price_sar), 0) + 
                       (COALESCE(SUM(total_price_sar), 0) * 0.15) + 
                       (CASE WHEN i % 4 = 0 THEN 0 ELSE 15 END) - 
                       (CASE WHEN i % 5 = 0 THEN (random() * 100)::NUMERIC(10,2) ELSE 0 END)
                FROM ecommerce_order_items WHERE order_id = test_order_id
            )
        WHERE id = test_order_id;
    END LOOP;

    -- إضافة بعض الأنشطة والتفاعلات
    FOR i IN 1..100 LOOP
        SELECT id INTO test_profile_id FROM profiles ORDER BY random() LIMIT 1;
        
        INSERT INTO public.user_activities (
            user_id,
            activity_type,
            description,
            metadata,
            created_at
        ) VALUES (
            test_profile_id,
            CASE i % 6
                WHEN 0 THEN 'login'
                WHEN 1 THEN 'product_view'
                WHEN 2 THEN 'order_placed'
                WHEN 3 THEN 'profile_update'
                WHEN 4 THEN 'shop_visit'
                ELSE 'search'
            END,
            CASE i % 6
                WHEN 0 THEN 'تسجيل دخول المستخدم'
                WHEN 1 THEN 'مشاهدة منتج'
                WHEN 2 THEN 'تقديم طلب شراء'
                WHEN 3 THEN 'تحديث الملف الشخصي'
                WHEN 4 THEN 'زيارة متجر'
                ELSE 'البحث في المنتجات'
            END,
            jsonb_build_object(
                'ip_address', '192.168.1.' || (1 + (i % 254))::TEXT,
                'user_agent', 'Mozilla/5.0 (compatible)',
                'session_id', gen_random_uuid()
            ),
            now() - (random() * interval '30 days')
        );
    END LOOP;

END $$;