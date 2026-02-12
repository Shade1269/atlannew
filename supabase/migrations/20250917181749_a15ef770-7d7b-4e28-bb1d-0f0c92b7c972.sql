-- إنشاء جداول نظام العروض والحملات المتقدم

-- جدول الحملات الترويجية
CREATE TABLE IF NOT EXISTS promotion_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES affiliate_stores(id) ON DELETE CASCADE,
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
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'expired', 'cancelled')),
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

-- جدول ربط العملاء بالتصنيفات
CREATE TABLE IF NOT EXISTS customer_segment_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    segment_id UUID REFERENCES customer_segments(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    
    -- معلومات العضوية
    added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    score NUMERIC DEFAULT 0, -- نقاط التطابق مع معايير التصنيف
    last_activity TIMESTAMP WITH TIME ZONE,
    
    -- حالة العضوية
    is_active BOOLEAN DEFAULT true,
    
    UNIQUE(segment_id, customer_id)
);

-- جدول تتبع استخدام العروض
CREATE TABLE IF NOT EXISTS campaign_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES promotion_campaigns(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    order_id UUID, -- يمكن ربطه بجداول الطلبات المختلفة
    
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
    season_name TEXT NOT NULL, -- رمضان، عيد الفطر، عيد الأضحى، الجمعة البيضاء، الهالوين، إلخ
    season_type TEXT NOT NULL CHECK (season_type IN ('religious', 'national', 'international', 'custom')),
    
    -- جدولة الموسم
    season_start DATE NOT NULL,
    season_end DATE NOT NULL,
    preparation_days INTEGER DEFAULT 7, -- أيام التحضير قبل الموسم
    
    -- إعدادات الحملة
    auto_activate BOOLEAN DEFAULT true,
    template_config JSONB DEFAULT '{}'::jsonb,
    
    -- حالة الحملة الموسمية
    is_active BOOLEAN DEFAULT true,
    yearly_repeat BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- إنشاء الفهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_promotion_campaigns_store_id ON promotion_campaigns(store_id);
CREATE INDEX IF NOT EXISTS idx_promotion_campaigns_affiliate_store_id ON promotion_campaigns(affiliate_store_id);
CREATE INDEX IF NOT EXISTS idx_promotion_campaigns_status ON promotion_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_promotion_campaigns_dates ON promotion_campaigns(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_promotion_campaigns_type ON promotion_campaigns(campaign_type);

CREATE INDEX IF NOT EXISTS idx_bundle_offers_campaign_id ON bundle_offers(campaign_id);
CREATE INDEX IF NOT EXISTS idx_bundle_offers_active ON bundle_offers(is_active);

CREATE INDEX IF NOT EXISTS idx_customer_segments_store_id ON customer_segments(store_id);
CREATE INDEX IF NOT EXISTS idx_customer_segments_type ON customer_segments(segment_type);
CREATE INDEX IF NOT EXISTS idx_customer_segments_active ON customer_segments(is_active);

CREATE INDEX IF NOT EXISTS idx_customer_segment_members_segment ON customer_segment_members(segment_id);
CREATE INDEX IF NOT EXISTS idx_customer_segment_members_customer ON customer_segment_members(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_segment_members_active ON customer_segment_members(is_active);

CREATE INDEX IF NOT EXISTS idx_campaign_usage_campaign ON campaign_usage(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_usage_customer ON campaign_usage(customer_id);
CREATE INDEX IF NOT EXISTS idx_campaign_usage_type ON campaign_usage(usage_type);
CREATE INDEX IF NOT EXISTS idx_campaign_usage_date ON campaign_usage(created_at);

CREATE INDEX IF NOT EXISTS idx_seasonal_campaigns_store ON seasonal_campaigns(store_id);
CREATE INDEX IF NOT EXISTS idx_seasonal_campaigns_dates ON seasonal_campaigns(season_start, season_end);
CREATE INDEX IF NOT EXISTS idx_seasonal_campaigns_active ON seasonal_campaigns(is_active);

-- إنشاء triggers لتحديث timestamps
CREATE OR REPLACE FUNCTION update_campaign_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_promotion_campaigns_timestamp
  BEFORE UPDATE ON promotion_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_timestamp();

CREATE TRIGGER update_bundle_offers_timestamp
  BEFORE UPDATE ON bundle_offers
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_timestamp();

CREATE TRIGGER update_customer_segments_timestamp
  BEFORE UPDATE ON customer_segments
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_timestamp();

CREATE TRIGGER update_seasonal_campaigns_timestamp
  BEFORE UPDATE ON seasonal_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_timestamp();

-- إنشاء RLS policies
ALTER TABLE promotion_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_segment_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasonal_campaigns ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للحملات الترويجية
CREATE POLICY "Store owners can manage their campaigns" ON promotion_campaigns
  FOR ALL USING (
    store_id IN (
      SELECT s.id FROM shops s 
      JOIN profiles p ON p.id = s.owner_id 
      WHERE p.auth_user_id = auth.uid()
    ) OR
    affiliate_store_id IN (
      SELECT ast.id FROM affiliate_stores ast
      JOIN profiles p ON p.id = ast.profile_id
      WHERE p.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view active campaigns" ON promotion_campaigns
  FOR SELECT USING (status = 'active' AND start_date <= now() AND end_date >= now());

-- سياسات الأمان للعروض المجمعة
CREATE POLICY "Store owners can manage bundle offers" ON bundle_offers
  FOR ALL USING (
    campaign_id IN (
      SELECT pc.id FROM promotion_campaigns pc
      WHERE pc.store_id IN (
        SELECT s.id FROM shops s 
        JOIN profiles p ON p.id = s.owner_id 
        WHERE p.auth_user_id = auth.uid()
      ) OR pc.affiliate_store_id IN (
        SELECT ast.id FROM affiliate_stores ast
        JOIN profiles p ON p.id = ast.profile_id
        WHERE p.auth_user_id = auth.uid()
      )
    )
  );

-- سياسات الأمان لتصنيفات العملاء
CREATE POLICY "Store owners can manage customer segments" ON customer_segments
  FOR ALL USING (
    store_id IN (
      SELECT ast.id FROM affiliate_stores ast
      JOIN profiles p ON p.id = ast.profile_id
      WHERE p.auth_user_id = auth.uid()
    )
  );

-- سياسات الأمان لأعضاء التصنيفات
CREATE POLICY "Store owners can manage segment members" ON customer_segment_members
  FOR ALL USING (
    segment_id IN (
      SELECT cs.id FROM customer_segments cs
      WHERE cs.store_id IN (
        SELECT ast.id FROM affiliate_stores ast
        JOIN profiles p ON p.id = ast.profile_id
        WHERE p.auth_user_id = auth.uid()
      )
    )
  );

-- سياسات الأمان لتتبع استخدام الحملات
CREATE POLICY "Store owners can view campaign usage" ON campaign_usage
  FOR SELECT USING (
    campaign_id IN (
      SELECT pc.id FROM promotion_campaigns pc
      WHERE pc.store_id IN (
        SELECT s.id FROM shops s 
        JOIN profiles p ON p.id = s.owner_id 
        WHERE p.auth_user_id = auth.uid()
      ) OR pc.affiliate_store_id IN (
        SELECT ast.id FROM affiliate_stores ast
        JOIN profiles p ON p.id = ast.profile_id
        WHERE p.auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Anyone can track campaign usage" ON campaign_usage
  FOR INSERT WITH CHECK (true);

-- سياسات الأمان للحملات الموسمية
CREATE POLICY "Store owners can manage seasonal campaigns" ON seasonal_campaigns
  FOR ALL USING (
    store_id IN (
      SELECT ast.id FROM affiliate_stores ast
      JOIN profiles p ON p.id = ast.profile_id
      WHERE p.auth_user_id = auth.uid()
    )
  );

-- إدراج بيانات تجريبية للحملات الموسمية
INSERT INTO seasonal_campaigns (store_id, season_name, season_type, season_start, season_end, preparation_days, auto_activate, yearly_repeat) VALUES
  (NULL, 'رمضان المبارك', 'religious', '2024-03-10', '2024-04-09', 7, true, true),
  (NULL, 'عيد الفطر', 'religious', '2024-04-10', '2024-04-12', 3, true, true),
  (NULL, 'عيد الأضحى', 'religious', '2024-06-16', '2024-06-19', 3, true, true),
  (NULL, 'اليوم الوطني السعودي', 'national', '2024-09-23', '2024-09-23', 5, true, true),
  (NULL, 'الجمعة البيضاء', 'international', '2024-11-29', '2024-12-02', 10, true, true),
  (NULL, 'نهاية العام', 'international', '2024-12-25', '2025-01-02', 7, true, true)
ON CONFLICT DO NOTHING;