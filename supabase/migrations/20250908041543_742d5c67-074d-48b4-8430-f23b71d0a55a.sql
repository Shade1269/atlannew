-- إنشاء سياسات RLS للجداول الجديدة لحماية بيانات كل مستخدم

-- سياسات جدول user_activities
CREATE POLICY "Users can view own activities" 
ON public.user_activities 
FOR SELECT 
USING (user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can create own activities" 
ON public.user_activities 
FOR INSERT 
WITH CHECK (user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));

-- سياسات جدول shop_settings_extended  
CREATE POLICY "Shop owners can manage extended settings" 
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
USING (user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));

-- تحديث سياسة products لتعمل مع shop_id
DROP POLICY IF EXISTS "Merchant can manage products" ON public.products;
CREATE POLICY "Shop owners can manage products" 
ON public.products 
FOR ALL 
USING (
    shop_id IN (
        SELECT s.id FROM public.shops s 
        JOIN public.profiles p ON p.id = s.owner_id 
        WHERE p.auth_user_id = auth.uid()
    ) OR 
    merchant_id IN (
        SELECT m.id FROM public.merchants m 
        JOIN public.profiles p ON p.id = m.profile_id 
        WHERE p.auth_user_id = auth.uid()
    )
);

-- تفعيل RLS للجداول الجديدة
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_settings_extended ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- إنشاء function لحفظ نشاط المستخدم
CREATE OR REPLACE FUNCTION log_user_activity(
    p_activity_type TEXT,
    p_description TEXT DEFAULT NULL,
    p_shop_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    current_user_id UUID;
    activity_id UUID;
BEGIN
    -- الحصول على ID المستخدم الحالي
    SELECT id INTO current_user_id 
    FROM public.profiles 
    WHERE auth_user_id = auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- إدراج النشاط
    INSERT INTO public.user_activities (
        user_id, 
        shop_id, 
        activity_type, 
        description, 
        metadata
    ) VALUES (
        current_user_id, 
        p_shop_id, 
        p_activity_type, 
        p_description, 
        p_metadata
    ) RETURNING id INTO activity_id;
    
    RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء function للحصول على متجر المستخدم الحالي
CREATE OR REPLACE FUNCTION get_user_shop()
RETURNS TABLE(
    shop_id UUID,
    shop_name TEXT,
    shop_slug TEXT,
    total_products BIGINT,
    total_orders BIGINT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.display_name,
        s.slug,
        s.total_products::BIGINT,
        s.total_orders::BIGINT,
        s.created_at
    FROM public.shops s
    JOIN public.profiles p ON p.id = s.owner_id
    WHERE p.auth_user_id = auth.uid()
    ORDER BY s.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- trigger لتحديث عدد المنتجات في المتجر تلقائياً
CREATE OR REPLACE FUNCTION update_shop_product_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.shops 
        SET total_products = total_products + 1,
            last_activity_at = now()
        WHERE id = NEW.shop_id;
        
        -- تسجيل النشاط
        PERFORM log_user_activity(
            'product_added',
            'تم إضافة منتج جديد: ' || NEW.title,
            NEW.shop_id,
            jsonb_build_object('product_id', NEW.id, 'product_title', NEW.title)
        );
        
        RETURN NEW;
        
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.shops 
        SET total_products = GREATEST(0, total_products - 1),
            last_activity_at = now()
        WHERE id = OLD.shop_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ربط الـ trigger مع جدول products
DROP TRIGGER IF EXISTS trigger_update_shop_product_count ON public.products;
CREATE TRIGGER trigger_update_shop_product_count
    AFTER INSERT OR DELETE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION update_shop_product_count();