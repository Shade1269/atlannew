-- إنشاء نظام متكامل لحفظ بيانات المتاجر والمستخدمين

-- أولاً: التأكد من أن جدول profiles يعمل بشكل صحيح
-- إضافة عمود لتتبع آخر نشاط
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS created_shops_count INTEGER DEFAULT 0;

-- ثانياً: تحسين جدول shops ليكون مرتبط بكل مستخدم
-- التأكد من وجود العواميد المطلوبة
ALTER TABLE public.shops 
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS total_products INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_orders INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- ثالثاً: إنشاء جدول لتتبع أنشطة المستخدمين
CREATE TABLE IF NOT EXISTS public.user_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL, -- 'product_added', 'product_updated', 'order_received', 'shop_created', etc.
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- رابعاً: إنشاء جدول للمنتجات المخصصة لكل متجر
-- التأكد من أن جدول products يرتبط بالمتاجر بشكل صحيح
-- (الجدول موجود بالفعل لكن نضيف عواميد مفيدة)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMP WITH TIME ZONE;

-- خامساً: إنشاء جدول لحفظ إعدادات المتجر المفصلة
CREATE TABLE IF NOT EXISTS public.shop_settings_extended (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL UNIQUE REFERENCES public.shops(id) ON DELETE CASCADE,
    currency TEXT DEFAULT 'SAR',
    tax_rate DECIMAL(5,2) DEFAULT 15.00,
    shipping_settings JSONB DEFAULT '{}',
    payment_methods JSONB DEFAULT '[]',
    notification_settings JSONB DEFAULT '{}',
    theme_settings JSONB DEFAULT '{}',
    business_hours JSONB DEFAULT '{}',
    social_links JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- سادساً: إنشاء جدول لحفظ جلسات العمل
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_data JSONB DEFAULT '{}',
    last_saved_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days')
);

-- سابعاً: إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON public.user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_shop_id ON public.user_activities(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_shop_id ON public.products(shop_id);
CREATE INDEX IF NOT EXISTS idx_shops_owner_id ON public.shops(owner_id);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ثامناً: إنشاء triggers لتحديث آخر نشاط تلقائياً
CREATE OR REPLACE FUNCTION update_last_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- تحديث آخر نشاط في profiles
    UPDATE public.profiles 
    SET last_activity_at = now() 
    WHERE id = NEW.user_id;
    
    -- تحديث آخر نشاط في shops إذا كان مرتبط بمتجر
    IF NEW.shop_id IS NOT NULL THEN
        UPDATE public.shops 
        SET last_activity_at = now() 
        WHERE id = NEW.shop_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ربط الـ trigger مع جدول الأنشطة
DROP TRIGGER IF EXISTS trigger_update_last_activity ON public.user_activities;
CREATE TRIGGER trigger_update_last_activity
    AFTER INSERT ON public.user_activities
    FOR EACH ROW
    EXECUTE FUNCTION update_last_activity();

-- تاسعاً: إنشاء function لإنشاء متجر جديد للمستخدم
CREATE OR REPLACE FUNCTION create_user_shop(
    p_user_id UUID,
    p_shop_name TEXT,
    p_shop_slug TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_shop_id UUID;
    final_slug TEXT;
BEGIN
    -- إنشاء slug تلقائي إذا لم يتم تقديمه
    IF p_shop_slug IS NULL THEN
        final_slug := lower(replace(p_shop_name, ' ', '-')) || '-' || substr(gen_random_uuid()::text, 1, 8);
    ELSE
        final_slug := p_shop_slug;
    END IF;
    
    -- إنشاء المتجر
    INSERT INTO public.shops (owner_id, display_name, slug, created_at)
    VALUES (p_user_id, p_shop_name, final_slug, now())
    RETURNING id INTO new_shop_id;
    
    -- إنشاء إعدادات المتجر المفصلة
    INSERT INTO public.shop_settings_extended (shop_id)
    VALUES (new_shop_id);
    
    -- تحديث عدد المتاجر للمستخدم
    UPDATE public.profiles 
    SET created_shops_count = created_shops_count + 1,
        last_activity_at = now()
    WHERE id = p_user_id;
    
    -- تسجيل النشاط
    INSERT INTO public.user_activities (user_id, shop_id, activity_type, description)
    VALUES (p_user_id, new_shop_id, 'shop_created', 'تم إنشاء متجر جديد: ' || p_shop_name);
    
    RETURN new_shop_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- عاشراً: تفعيل Real-time للجداول المهمة
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_activities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shops;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- تفعيل REPLICA IDENTITY للتحديثات المباشرة
ALTER TABLE public.user_activities REPLICA IDENTITY FULL;
ALTER TABLE public.products REPLICA IDENTITY FULL;
ALTER TABLE public.shops REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;