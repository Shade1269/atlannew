-- إنشاء جداول نظام العروض والحملات - النسخة المبسطة

-- جدول الحملات الترويجية
CREATE TABLE IF NOT EXISTS promotion_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_store_id UUID REFERENCES affiliate_stores(id) ON DELETE CASCADE,
    
    -- معلومات الحملة الأساسية
    campaign_name TEXT NOT NULL,
    campaign_type TEXT NOT NULL CHECK (campaign_type IN ('flash_sale', 'seasonal', 'bundle', 'loyalty', 'new_customer', 'clearance')),
    description TEXT,
    
    -- تفاصيل العرض
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'buy_x_get_y', 'free_shipping')),
    discount_value NUMERIC NOT NULL DEFAULT 0,
    minimum_order_amount NUMERIC DEFAULT 0,
    maximum_discount_amount NUMERIC,
    
    -- جدولة الحملة
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    timezone TEXT DEFAULT 'Asia/Riyadh',
    
    -- شروط الحملة
    usage_limit INTEGER,
    usage_per_customer INTEGER DEFAULT 1,
    current_usage INTEGER DEFAULT 0,
    
    -- استهداف العملاء
    target_audience JSONB DEFAULT '{"all": true}'::jsonb,
    customer_segments TEXT[] DEFAULT ARRAY['all'],
    
    -- المنتجات المشمولة
    applicable_products JSONB DEFAULT '[]'::jsonb,
    applicable_categories JSONB DEFAULT '[]'::jsonb,
    excluded_products JSONB DEFAULT '[]'::jsonb,
    
    -- إعدادات العرض
    priority INTEGER DEFAULT 1,
    is_stackable BOOLEAN DEFAULT false,
    auto_apply BOOLEAN DEFAULT false,
    
    -- حالة الحملة
    campaign_status TEXT NOT NULL DEFAULT 'draft' CHECK (campaign_status IN ('draft', 'scheduled', 'active', 'paused', 'expired', 'cancelled')),
    is_featured BOOLEAN DEFAULT false,
    
    -- تتبع الأداء
    views_count INTEGER DEFAULT 0,
    clicks_count INTEGER DEFAULT 0,
    conversions_count INTEGER DEFAULT 0,
    revenue_generated NUMERIC DEFAULT 0,
    
    -- إعدادات العرض البصري
    banner_config JSONB DEFAULT '{}'::jsonb,
    countdown_enabled BOOLEAN DEFAULT false,
    urgency_messages JSONB DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- جدول عروض البنادل (اشتري X احصل على Y)
CREATE TABLE IF NOT EXISTS bundle_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES promotion_campaigns(id) ON DELETE CASCADE,
    
    -- تفاصيل البندل
    bundle_name TEXT NOT NULL,
    bundle_type TEXT NOT NULL CHECK (bundle_type IN ('buy_x_get_y', 'mix_and_match', 'product_bundle', 'category_bundle')),
    
    -- شروط البندل
    buy_quantity INTEGER NOT NULL DEFAULT 1,
    get_quantity INTEGER NOT NULL DEFAULT 1,
    buy_products JSONB NOT NULL DEFAULT '[]'::jsonb,
    get_products JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- خصم البندل
    bundle_discount_type TEXT CHECK (bundle_discount_type IN ('percentage', 'fixed_amount', 'free_item')),
    bundle_discount_value NUMERIC DEFAULT 0,
    
    -- شروط إضافية
    minimum_buy_amount NUMERIC DEFAULT 0,
    maximum_bundle_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    
    -- حالة العرض
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- جدول تصنيف العملاء للاستهداف
CREATE TABLE IF NOT EXISTS customer_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES affiliate_stores(id) ON DELETE CASCADE,
    
    -- معلومات التصنيف
    segment_name TEXT NOT NULL,
    segment_description TEXT,
    segment_type TEXT NOT NULL CHECK (segment_type IN ('demographic', 'behavioral', 'transactional', 'geographic', 'custom')),
    
    -- معايير التصنيف
    criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- إحصائيات التصنيف
    customer_count INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- حالة التصنيف
    is_active BOOLEAN DEFAULT true,
    auto_update BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- جدول تتبع استخدام العروض
CREATE TABLE IF NOT EXISTS campaign_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES promotion_campaigns(id) ON DELETE CASCADE,
    customer_id UUID,
    order_id UUID,
    
    -- تفاصيل الاستخدام
    usage_type TEXT NOT NULL CHECK (usage_type IN ('applied', 'clicked', 'viewed')),
    discount_applied NUMERIC DEFAULT 0,
    original_amount NUMERIC,
    final_amount NUMERIC,
    
    -- معلومات إضافية
    user_agent TEXT,
    ip_address INET,
    session_id TEXT,
    referrer TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- جدول الحملات الموسمية المجدولة
CREATE TABLE IF NOT EXISTS seasonal_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES affiliate_stores(id) ON DELETE CASCADE,
    
    -- معلومات الحملة الموسمية
    season_name TEXT NOT NULL,
    season_type TEXT NOT NULL CHECK (season_type IN ('religious', 'national', 'international', 'custom')),
    
    -- جدولة الموسم
    season_start DATE NOT NULL,
    season_end DATE NOT NULL,
    preparation_days INTEGER DEFAULT 7,
    
    -- إعدادات الحملة
    auto_activate BOOLEAN DEFAULT true,
    template_config JSONB DEFAULT '{}'::jsonb,
    
    -- حالة الحملة الموسمية
    is_active BOOLEAN DEFAULT true,
    yearly_repeat BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- إنشاء الفهارس
CREATE INDEX IF NOT EXISTS idx_promotion_campaigns_affiliate_store_id ON promotion_campaigns(affiliate_store_id);
CREATE INDEX IF NOT EXISTS idx_promotion_campaigns_status ON promotion_campaigns(campaign_status);
CREATE INDEX IF NOT EXISTS idx_promotion_campaigns_dates ON promotion_campaigns(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_promotion_campaigns_type ON promotion_campaigns(campaign_type);

CREATE INDEX IF NOT EXISTS idx_bundle_offers_campaign_id ON bundle_offers(campaign_id);
CREATE INDEX IF NOT EXISTS idx_customer_segments_store_id ON customer_segments(store_id);
CREATE INDEX IF NOT EXISTS idx_campaign_usage_campaign ON campaign_usage(campaign_id);
CREATE INDEX IF NOT EXISTS idx_seasonal_campaigns_store ON seasonal_campaigns(store_id);