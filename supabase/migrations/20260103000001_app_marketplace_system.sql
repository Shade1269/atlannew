-- =============================================
-- نظام متجر التطبيقات (App Marketplace System)
-- =============================================

-- 1. جدول التطبيقات المتاحة (كتالوج التطبيقات)
CREATE TABLE IF NOT EXISTS marketplace_apps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    name_ar TEXT,
    description TEXT,
    description_ar TEXT,
    icon_url TEXT,
    banner_url TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    developer_name TEXT,
    developer_url TEXT,
    version TEXT DEFAULT '1.0.0',
    min_platform_version TEXT DEFAULT '1.0.0',
    pricing_type TEXT DEFAULT 'free' CHECK (pricing_type IN ('free', 'paid', 'subscription', 'freemium')),
    price DECIMAL(10,2) DEFAULT 0,
    monthly_price DECIMAL(10,2) DEFAULT 0,
    features JSONB DEFAULT '[]'::jsonb,
    permissions JSONB DEFAULT '[]'::jsonb,
    webhook_events JSONB DEFAULT '[]'::jsonb,
    config_schema JSONB DEFAULT '{}'::jsonb,
    documentation_url TEXT,
    support_email TEXT,
    is_official BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    install_count INTEGER DEFAULT 0,
    rating DECIMAL(2,1) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. جدول التطبيقات المثبتة لكل متجر
CREATE TABLE IF NOT EXISTS installed_apps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL,
    app_id UUID NOT NULL REFERENCES marketplace_apps(id) ON DELETE CASCADE,
    installed_by UUID REFERENCES profiles(id),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
    configuration JSONB DEFAULT '{}'::jsonb,
    granted_permissions JSONB DEFAULT '[]'::jsonb,
    subscription_status TEXT DEFAULT 'none' CHECK (subscription_status IN ('none', 'trial', 'active', 'cancelled', 'expired')),
    subscription_ends_at TIMESTAMPTZ,
    trial_ends_at TIMESTAMPTZ,
    installed_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(store_id, app_id)
);

-- 3. جدول مفاتيح API للتطبيقات
CREATE TABLE IF NOT EXISTS app_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    installed_app_id UUID NOT NULL REFERENCES installed_apps(id) ON DELETE CASCADE,
    key_name TEXT NOT NULL,
    api_key TEXT UNIQUE NOT NULL,
    api_secret TEXT NOT NULL,
    permissions JSONB DEFAULT '[]'::jsonb,
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. جدول Webhooks للتطبيقات
CREATE TABLE IF NOT EXISTS app_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    installed_app_id UUID NOT NULL REFERENCES installed_apps(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    webhook_url TEXT NOT NULL,
    secret_key TEXT,
    is_active BOOLEAN DEFAULT true,
    retry_count INTEGER DEFAULT 3,
    timeout_ms INTEGER DEFAULT 30000,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(installed_app_id, event_type)
);

-- 5. جدول سجل Webhook
CREATE TABLE IF NOT EXISTS app_webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID REFERENCES app_webhooks(id) ON DELETE SET NULL,
    installed_app_id UUID REFERENCES installed_apps(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    payload JSONB,
    response_status INTEGER,
    response_body TEXT,
    error_message TEXT,
    attempts INTEGER DEFAULT 1,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. جدول تقييمات التطبيقات
CREATE TABLE IF NOT EXISTS app_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id UUID NOT NULL REFERENCES marketplace_apps(id) ON DELETE CASCADE,
    store_id UUID NOT NULL,
    user_id UUID REFERENCES profiles(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    is_verified_purchase BOOLEAN DEFAULT false,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(app_id, store_id)
);

-- 7. جدول أحداث التطبيقات (Event Log)
CREATE TABLE IF NOT EXISTS app_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL,
    installed_app_id UUID REFERENCES installed_apps(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    event_data JSONB,
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- الفهارس (Indexes)
-- =============================================

CREATE INDEX IF NOT EXISTS idx_marketplace_apps_category ON marketplace_apps(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_apps_is_active ON marketplace_apps(is_active);
CREATE INDEX IF NOT EXISTS idx_marketplace_apps_is_featured ON marketplace_apps(is_featured);
CREATE INDEX IF NOT EXISTS idx_marketplace_apps_slug ON marketplace_apps(slug);

CREATE INDEX IF NOT EXISTS idx_installed_apps_store_id ON installed_apps(store_id);
CREATE INDEX IF NOT EXISTS idx_installed_apps_app_id ON installed_apps(app_id);
CREATE INDEX IF NOT EXISTS idx_installed_apps_status ON installed_apps(status);

CREATE INDEX IF NOT EXISTS idx_app_webhooks_installed_app_id ON app_webhooks(installed_app_id);
CREATE INDEX IF NOT EXISTS idx_app_webhooks_event_type ON app_webhooks(event_type);

CREATE INDEX IF NOT EXISTS idx_app_webhook_logs_webhook_id ON app_webhook_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_app_webhook_logs_created_at ON app_webhook_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_app_events_store_id ON app_events(store_id);
CREATE INDEX IF NOT EXISTS idx_app_events_event_type ON app_events(event_type);
CREATE INDEX IF NOT EXISTS idx_app_events_processed ON app_events(processed);

-- =============================================
-- RLS Policies
-- =============================================

ALTER TABLE marketplace_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE installed_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_events ENABLE ROW LEVEL SECURITY;

-- سياسات marketplace_apps (الجميع يمكنه القراءة)
CREATE POLICY "Anyone can view active apps" ON marketplace_apps
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage apps" ON marketplace_apps
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- سياسات installed_apps
CREATE POLICY "Store owners can view their installed apps" ON installed_apps
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM affiliate_stores
            WHERE affiliate_stores.id = store_id
            AND affiliate_stores.affiliate_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'merchant')
        )
    );

CREATE POLICY "Store owners can manage their apps" ON installed_apps
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM affiliate_stores
            WHERE affiliate_stores.id = store_id
            AND affiliate_stores.affiliate_id = auth.uid()
        )
    );

-- سياسات app_api_keys
CREATE POLICY "App owners can manage their API keys" ON app_api_keys
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM installed_apps ia
            JOIN affiliate_stores ast ON ast.id = ia.store_id
            WHERE ia.id = installed_app_id
            AND ast.affiliate_id = auth.uid()
        )
    );

-- سياسات app_webhooks
CREATE POLICY "App owners can manage their webhooks" ON app_webhooks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM installed_apps ia
            JOIN affiliate_stores ast ON ast.id = ia.store_id
            WHERE ia.id = installed_app_id
            AND ast.affiliate_id = auth.uid()
        )
    );

-- سياسات app_reviews
CREATE POLICY "Anyone can view visible reviews" ON app_reviews
    FOR SELECT USING (is_visible = true);

CREATE POLICY "Users can manage their own reviews" ON app_reviews
    FOR ALL USING (user_id = auth.uid());

-- =============================================
-- Functions & Triggers
-- =============================================

-- دالة تحديث updated_at
CREATE OR REPLACE FUNCTION update_app_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers للتحديث التلقائي
CREATE TRIGGER update_marketplace_apps_updated_at
    BEFORE UPDATE ON marketplace_apps
    FOR EACH ROW
    EXECUTE FUNCTION update_app_updated_at();

CREATE TRIGGER update_installed_apps_updated_at
    BEFORE UPDATE ON installed_apps
    FOR EACH ROW
    EXECUTE FUNCTION update_app_updated_at();

-- دالة تحديث إحصائيات التطبيق
CREATE OR REPLACE FUNCTION update_app_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE marketplace_apps
        SET install_count = install_count + 1
        WHERE id = NEW.app_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE marketplace_apps
        SET install_count = install_count - 1
        WHERE id = OLD.app_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_app_install_count
    AFTER INSERT OR DELETE ON installed_apps
    FOR EACH ROW
    EXECUTE FUNCTION update_app_stats();

-- دالة تحديث تقييم التطبيق
CREATE OR REPLACE FUNCTION update_app_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE marketplace_apps
    SET
        rating = (SELECT COALESCE(AVG(rating), 0) FROM app_reviews WHERE app_id = COALESCE(NEW.app_id, OLD.app_id)),
        rating_count = (SELECT COUNT(*) FROM app_reviews WHERE app_id = COALESCE(NEW.app_id, OLD.app_id))
    WHERE id = COALESCE(NEW.app_id, OLD.app_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_app_rating_trigger
    AFTER INSERT OR UPDATE OR DELETE ON app_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_app_rating();

-- =============================================
-- إضافة بيانات أولية (تطبيقات افتراضية)
-- =============================================

INSERT INTO marketplace_apps (slug, name, name_ar, description, description_ar, category, icon_url, is_official, is_featured, pricing_type, permissions, webhook_events) VALUES
('whatsapp-notifications', 'WhatsApp Notifications', 'إشعارات واتساب', 'Send order notifications via WhatsApp', 'إرسال إشعارات الطلبات عبر واتساب', 'notifications', '/apps/whatsapp.png', true, true, 'freemium', '["orders:read", "customers:read"]', '["order.created", "order.paid", "order.shipped"]'),
('google-analytics', 'Google Analytics 4', 'تحليلات جوجل', 'Track your store performance with GA4', 'تتبع أداء متجرك مع GA4', 'analytics', '/apps/ga4.png', true, true, 'free', '["analytics:write"]', '["page.view", "order.completed"]'),
('live-chat', 'Live Chat', 'الدردشة المباشرة', 'Chat with your customers in real-time', 'تحدث مع عملائك في الوقت الفعلي', 'support', '/apps/chat.png', true, false, 'subscription', '["customers:read", "orders:read"]', '["customer.online"]'),
('email-marketing', 'Email Marketing', 'التسويق بالبريد', 'Automated email campaigns for your customers', 'حملات بريد إلكتروني آلية لعملائك', 'marketing', '/apps/email.png', true, false, 'freemium', '["customers:read", "orders:read"]', '["customer.signup", "order.completed", "cart.abandoned"]'),
('reviews-system', 'Product Reviews', 'نظام التقييمات', 'Let customers review your products', 'اسمح للعملاء بتقييم منتجاتك', 'social', '/apps/reviews.png', true, true, 'free', '["products:read", "customers:read"]', '["order.delivered"]'),
('sms-notifications', 'SMS Notifications', 'إشعارات SMS', 'Send SMS notifications to customers', 'إرسال رسائل SMS للعملاء', 'notifications', '/apps/sms.png', true, false, 'paid', '["orders:read", "customers:read"]', '["order.created", "order.shipped"]'),
('inventory-alerts', 'Inventory Alerts', 'تنبيهات المخزون', 'Get notified when stock is low', 'احصل على إشعارات عند انخفاض المخزون', 'inventory', '/apps/inventory.png', true, false, 'free', '["products:read", "inventory:read"]', '["inventory.low"]'),
('zapier-integration', 'Zapier', 'زابير', 'Connect with 5000+ apps via Zapier', 'اربط مع أكثر من 5000 تطبيق', 'automation', '/apps/zapier.png', false, true, 'free', '["all:read"]', '["order.created", "customer.signup", "product.created"]')
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- Comments
-- =============================================

COMMENT ON TABLE marketplace_apps IS 'كتالوج التطبيقات المتاحة في المتجر';
COMMENT ON TABLE installed_apps IS 'التطبيقات المثبتة لكل متجر';
COMMENT ON TABLE app_api_keys IS 'مفاتيح API للتطبيقات المثبتة';
COMMENT ON TABLE app_webhooks IS 'إعدادات Webhooks للتطبيقات';
COMMENT ON TABLE app_webhook_logs IS 'سجل طلبات Webhook';
COMMENT ON TABLE app_reviews IS 'تقييمات ومراجعات التطبيقات';
COMMENT ON TABLE app_events IS 'سجل أحداث التطبيقات';
