-- =============================================
-- نظام بوابة المطورين (Developer Portal System)
-- =============================================

-- 1. جدول المطورين
CREATE TABLE IF NOT EXISTS app_developers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    company_name_ar TEXT,
    company_website TEXT,
    company_logo TEXT,
    developer_type TEXT DEFAULT 'individual' CHECK (developer_type IN ('individual', 'company', 'agency')),
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    bio TEXT,
    bio_ar TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
    rejection_reason TEXT,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES profiles(id),
    api_calls_limit INTEGER DEFAULT 10000,
    api_calls_used INTEGER DEFAULT 0,
    revenue_share DECIMAL(5,2) DEFAULT 70.00, -- نسبة المطور من المبيعات
    total_earnings DECIMAL(12,2) DEFAULT 0,
    pending_payout DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id),
    UNIQUE(profile_id)
);

-- 2. جدول طلبات التطبيقات (للمراجعة)
CREATE TABLE IF NOT EXISTS app_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    developer_id UUID NOT NULL REFERENCES app_developers(id) ON DELETE CASCADE,
    app_id UUID REFERENCES marketplace_apps(id) ON DELETE SET NULL,

    -- بيانات التطبيق
    slug TEXT NOT NULL,
    name TEXT NOT NULL,
    name_ar TEXT,
    description TEXT NOT NULL,
    description_ar TEXT,
    icon_url TEXT,
    banner_url TEXT,
    screenshots JSONB DEFAULT '[]'::jsonb,
    video_url TEXT,
    category TEXT NOT NULL,

    -- التسعير
    pricing_type TEXT DEFAULT 'free',
    price DECIMAL(10,2) DEFAULT 0,
    monthly_price DECIMAL(10,2) DEFAULT 0,

    -- التقنية
    version TEXT DEFAULT '1.0.0',
    min_platform_version TEXT DEFAULT '1.0.0',
    permissions JSONB DEFAULT '[]'::jsonb,
    webhook_events JSONB DEFAULT '[]'::jsonb,
    config_schema JSONB DEFAULT '{}'::jsonb,
    oauth_redirect_urls JSONB DEFAULT '[]'::jsonb,

    -- التوثيق والدعم
    documentation_url TEXT,
    support_email TEXT,
    privacy_policy_url TEXT,
    terms_of_service_url TEXT,

    -- المراجعة
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'in_review', 'approved', 'rejected', 'changes_requested')),
    review_notes TEXT,
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. جدول إصدارات التطبيقات
CREATE TABLE IF NOT EXISTS app_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id UUID NOT NULL REFERENCES marketplace_apps(id) ON DELETE CASCADE,
    developer_id UUID NOT NULL REFERENCES app_developers(id) ON DELETE CASCADE,
    version TEXT NOT NULL,
    changelog TEXT,
    changelog_ar TEXT,
    is_published BOOLEAN DEFAULT false,
    is_current BOOLEAN DEFAULT false,
    min_platform_version TEXT,
    permissions JSONB DEFAULT '[]'::jsonb,
    config_schema JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(app_id, version)
);

-- 4. جدول OAuth Clients للتطبيقات
CREATE TABLE IF NOT EXISTS app_oauth_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id UUID NOT NULL REFERENCES marketplace_apps(id) ON DELETE CASCADE,
    developer_id UUID NOT NULL REFERENCES app_developers(id) ON DELETE CASCADE,
    client_id TEXT UNIQUE NOT NULL,
    client_secret TEXT NOT NULL,
    redirect_uris JSONB DEFAULT '[]'::jsonb,
    scopes JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. جدول OAuth Tokens
CREATE TABLE IF NOT EXISTS app_oauth_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    oauth_client_id UUID NOT NULL REFERENCES app_oauth_clients(id) ON DELETE CASCADE,
    store_id UUID NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    scopes JSONB DEFAULT '[]'::jsonb,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(oauth_client_id, store_id)
);

-- 6. جدول إحصائيات التطبيقات للمطورين
CREATE TABLE IF NOT EXISTS app_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id UUID NOT NULL REFERENCES marketplace_apps(id) ON DELETE CASCADE,
    developer_id UUID NOT NULL REFERENCES app_developers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    installs INTEGER DEFAULT 0,
    uninstalls INTEGER DEFAULT 0,
    active_installs INTEGER DEFAULT 0,
    api_calls INTEGER DEFAULT 0,
    webhook_deliveries INTEGER DEFAULT 0,
    webhook_failures INTEGER DEFAULT 0,
    revenue DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(app_id, date)
);

-- 7. جدول المدفوعات للمطورين
CREATE TABLE IF NOT EXISTS developer_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    developer_id UUID NOT NULL REFERENCES app_developers(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    currency TEXT DEFAULT 'SAR',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    payout_method TEXT, -- bank_transfer, paypal, etc.
    payout_details JSONB,
    transaction_id TEXT,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. جدول سجل API للمطورين
CREATE TABLE IF NOT EXISTS developer_api_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    developer_id UUID REFERENCES app_developers(id) ON DELETE SET NULL,
    app_id UUID REFERENCES marketplace_apps(id) ON DELETE SET NULL,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER,
    response_time_ms INTEGER,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- الفهارس
-- =============================================

CREATE INDEX IF NOT EXISTS idx_app_developers_user_id ON app_developers(user_id);
CREATE INDEX IF NOT EXISTS idx_app_developers_status ON app_developers(status);

CREATE INDEX IF NOT EXISTS idx_app_submissions_developer_id ON app_submissions(developer_id);
CREATE INDEX IF NOT EXISTS idx_app_submissions_status ON app_submissions(status);

CREATE INDEX IF NOT EXISTS idx_app_versions_app_id ON app_versions(app_id);
CREATE INDEX IF NOT EXISTS idx_app_versions_is_current ON app_versions(is_current);

CREATE INDEX IF NOT EXISTS idx_app_oauth_clients_app_id ON app_oauth_clients(app_id);
CREATE INDEX IF NOT EXISTS idx_app_oauth_clients_client_id ON app_oauth_clients(client_id);

CREATE INDEX IF NOT EXISTS idx_app_oauth_tokens_store_id ON app_oauth_tokens(store_id);
CREATE INDEX IF NOT EXISTS idx_app_oauth_tokens_expires_at ON app_oauth_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_app_analytics_app_id_date ON app_analytics(app_id, date);
CREATE INDEX IF NOT EXISTS idx_app_analytics_developer_id ON app_analytics(developer_id);

CREATE INDEX IF NOT EXISTS idx_developer_payouts_developer_id ON developer_payouts(developer_id);
CREATE INDEX IF NOT EXISTS idx_developer_payouts_status ON developer_payouts(status);

CREATE INDEX IF NOT EXISTS idx_developer_api_logs_developer_id ON developer_api_logs(developer_id);
CREATE INDEX IF NOT EXISTS idx_developer_api_logs_created_at ON developer_api_logs(created_at);

-- =============================================
-- RLS Policies
-- =============================================

ALTER TABLE app_developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_oauth_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE developer_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE developer_api_logs ENABLE ROW LEVEL SECURITY;

-- سياسات app_developers
CREATE POLICY "Developers can view their own profile" ON app_developers
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Developers can update their own profile" ON app_developers
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Anyone can register as developer" ON app_developers
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all developers" ON app_developers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- سياسات app_submissions
CREATE POLICY "Developers can manage their submissions" ON app_submissions
    FOR ALL USING (
        developer_id IN (
            SELECT id FROM app_developers WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all submissions" ON app_submissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- سياسات app_oauth_clients
CREATE POLICY "Developers can manage their OAuth clients" ON app_oauth_clients
    FOR ALL USING (
        developer_id IN (
            SELECT id FROM app_developers WHERE user_id = auth.uid()
        )
    );

-- سياسات app_analytics
CREATE POLICY "Developers can view their app analytics" ON app_analytics
    FOR SELECT USING (
        developer_id IN (
            SELECT id FROM app_developers WHERE user_id = auth.uid()
        )
    );

-- سياسات developer_payouts
CREATE POLICY "Developers can view their payouts" ON developer_payouts
    FOR SELECT USING (
        developer_id IN (
            SELECT id FROM app_developers WHERE user_id = auth.uid()
        )
    );

-- =============================================
-- تحديث جدول marketplace_apps
-- =============================================

-- إضافة عمود developer_id إذا لم يكن موجوداً
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'marketplace_apps' AND column_name = 'developer_id'
    ) THEN
        ALTER TABLE marketplace_apps ADD COLUMN developer_id UUID REFERENCES app_developers(id);
    END IF;
END $$;

-- =============================================
-- Functions & Triggers
-- =============================================

-- دالة تحديث updated_at
CREATE OR REPLACE FUNCTION update_developer_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_app_developers_updated_at
    BEFORE UPDATE ON app_developers
    FOR EACH ROW
    EXECUTE FUNCTION update_developer_updated_at();

CREATE TRIGGER update_app_submissions_updated_at
    BEFORE UPDATE ON app_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_developer_updated_at();

-- دالة نشر التطبيق بعد الموافقة
CREATE OR REPLACE FUNCTION publish_approved_app()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        -- إنشاء أو تحديث التطبيق في marketplace_apps
        INSERT INTO marketplace_apps (
            id, slug, name, name_ar, description, description_ar,
            icon_url, banner_url, category, developer_id,
            version, min_platform_version, pricing_type, price, monthly_price,
            permissions, webhook_events, config_schema,
            documentation_url, support_email,
            is_official, is_active, created_at
        ) VALUES (
            COALESCE(NEW.app_id, gen_random_uuid()),
            NEW.slug, NEW.name, NEW.name_ar, NEW.description, NEW.description_ar,
            NEW.icon_url, NEW.banner_url, NEW.category, NEW.developer_id,
            NEW.version, NEW.min_platform_version, NEW.pricing_type, NEW.price, NEW.monthly_price,
            NEW.permissions, NEW.webhook_events, NEW.config_schema,
            NEW.documentation_url, NEW.support_email,
            false, true, NOW()
        )
        ON CONFLICT (slug) DO UPDATE SET
            name = EXCLUDED.name,
            name_ar = EXCLUDED.name_ar,
            description = EXCLUDED.description,
            description_ar = EXCLUDED.description_ar,
            icon_url = EXCLUDED.icon_url,
            banner_url = EXCLUDED.banner_url,
            version = EXCLUDED.version,
            permissions = EXCLUDED.permissions,
            webhook_events = EXCLUDED.webhook_events,
            config_schema = EXCLUDED.config_schema,
            updated_at = NOW();

        -- تحديث حالة النشر
        NEW.published_at = NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER publish_app_on_approval
    BEFORE UPDATE ON app_submissions
    FOR EACH ROW
    EXECUTE FUNCTION publish_approved_app();

-- =============================================
-- Comments
-- =============================================

COMMENT ON TABLE app_developers IS 'المطورين المسجلين في بوابة المطورين';
COMMENT ON TABLE app_submissions IS 'طلبات التطبيقات المقدمة للمراجعة';
COMMENT ON TABLE app_versions IS 'إصدارات التطبيقات';
COMMENT ON TABLE app_oauth_clients IS 'OAuth clients للتطبيقات';
COMMENT ON TABLE app_oauth_tokens IS 'OAuth tokens للمتاجر المتصلة';
COMMENT ON TABLE app_analytics IS 'إحصائيات التطبيقات اليومية';
COMMENT ON TABLE developer_payouts IS 'مدفوعات المطورين';
