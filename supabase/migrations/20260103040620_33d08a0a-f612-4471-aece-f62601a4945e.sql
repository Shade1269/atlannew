-- =============================================
-- نظام متجر التطبيقات (App Marketplace)
-- =============================================

-- جدول التطبيقات المتاحة في الكتالوج
CREATE TABLE public.marketplace_apps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  icon_url TEXT,
  banner_url TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  developer_name TEXT,
  developer_url TEXT,
  developer_id UUID REFERENCES auth.users(id),
  version TEXT NOT NULL DEFAULT '1.0.0',
  min_platform_version TEXT NOT NULL DEFAULT '1.0.0',
  pricing_type TEXT NOT NULL DEFAULT 'free',
  price NUMERIC NOT NULL DEFAULT 0,
  monthly_price NUMERIC NOT NULL DEFAULT 0,
  features JSONB NOT NULL DEFAULT '[]',
  permissions JSONB NOT NULL DEFAULT '[]',
  webhook_events JSONB NOT NULL DEFAULT '[]',
  config_schema JSONB NOT NULL DEFAULT '{"fields": []}',
  documentation_url TEXT,
  support_email TEXT,
  is_official BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  install_count INTEGER NOT NULL DEFAULT 0,
  rating NUMERIC NOT NULL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول التطبيقات المثبتة
CREATE TABLE public.installed_apps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.affiliate_stores(id) ON DELETE CASCADE,
  app_id UUID NOT NULL REFERENCES public.marketplace_apps(id) ON DELETE CASCADE,
  installed_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'active',
  configuration JSONB NOT NULL DEFAULT '{}',
  granted_permissions JSONB NOT NULL DEFAULT '[]',
  subscription_status TEXT NOT NULL DEFAULT 'none',
  subscription_ends_at TIMESTAMP WITH TIME ZONE,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  installed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(store_id, app_id)
);

-- جدول مفاتيح API للتطبيقات
CREATE TABLE public.app_api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  installed_app_id UUID NOT NULL REFERENCES public.installed_apps(id) ON DELETE CASCADE,
  key_name TEXT NOT NULL,
  api_key TEXT NOT NULL UNIQUE,
  api_secret TEXT,
  permissions JSONB NOT NULL DEFAULT '[]',
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول Webhooks للتطبيقات
CREATE TABLE public.app_webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  installed_app_id UUID NOT NULL REFERENCES public.installed_apps(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  secret_key TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  retry_count INTEGER NOT NULL DEFAULT 3,
  timeout_ms INTEGER NOT NULL DEFAULT 30000,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول سجلات Webhook
CREATE TABLE public.app_webhook_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id UUID REFERENCES public.app_webhooks(id) ON DELETE SET NULL,
  installed_app_id UUID REFERENCES public.installed_apps(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  response_status INTEGER,
  response_body TEXT,
  error_message TEXT,
  attempts INTEGER NOT NULL DEFAULT 1,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول تقييمات التطبيقات
CREATE TABLE public.app_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  app_id UUID NOT NULL REFERENCES public.marketplace_apps(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.affiliate_stores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  is_verified_purchase BOOLEAN NOT NULL DEFAULT false,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(app_id, store_id)
);

-- جدول الأحداث
CREATE TABLE public.app_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.affiliate_stores(id) ON DELETE CASCADE,
  installed_app_id UUID REFERENCES public.installed_apps(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}',
  processed BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- الفهارس
-- =============================================
CREATE INDEX idx_marketplace_apps_category ON public.marketplace_apps(category);
CREATE INDEX idx_marketplace_apps_pricing ON public.marketplace_apps(pricing_type);
CREATE INDEX idx_marketplace_apps_featured ON public.marketplace_apps(is_featured) WHERE is_featured = true;
CREATE INDEX idx_marketplace_apps_active ON public.marketplace_apps(is_active) WHERE is_active = true;

CREATE INDEX idx_installed_apps_store ON public.installed_apps(store_id);
CREATE INDEX idx_installed_apps_app ON public.installed_apps(app_id);
CREATE INDEX idx_installed_apps_status ON public.installed_apps(status);

CREATE INDEX idx_app_api_keys_installed ON public.app_api_keys(installed_app_id);
CREATE INDEX idx_app_api_keys_key ON public.app_api_keys(api_key);

CREATE INDEX idx_app_webhooks_installed ON public.app_webhooks(installed_app_id);
CREATE INDEX idx_app_webhooks_event ON public.app_webhooks(event_type);

CREATE INDEX idx_app_events_store ON public.app_events(store_id);
CREATE INDEX idx_app_events_type ON public.app_events(event_type);
CREATE INDEX idx_app_events_processed ON public.app_events(processed) WHERE processed = false;

-- =============================================
-- RLS Policies
-- =============================================

-- Enable RLS
ALTER TABLE public.marketplace_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installed_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_events ENABLE ROW LEVEL SECURITY;

-- Marketplace Apps - عامة للقراءة
CREATE POLICY "Anyone can view active marketplace apps"
ON public.marketplace_apps FOR SELECT
USING (is_active = true);

CREATE POLICY "Developers can manage their own apps"
ON public.marketplace_apps FOR ALL
USING (auth.uid() = developer_id);

-- Installed Apps - أصحاب المتاجر فقط
CREATE POLICY "Store owners can view their installed apps"
ON public.installed_apps FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.affiliate_stores
    WHERE id = installed_apps.store_id
    AND profile_id = auth.uid()
  )
);

CREATE POLICY "Store owners can install apps"
ON public.installed_apps FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.affiliate_stores
    WHERE id = store_id
    AND profile_id = auth.uid()
  )
);

CREATE POLICY "Store owners can update their installed apps"
ON public.installed_apps FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.affiliate_stores
    WHERE id = installed_apps.store_id
    AND profile_id = auth.uid()
  )
);

CREATE POLICY "Store owners can uninstall apps"
ON public.installed_apps FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.affiliate_stores
    WHERE id = installed_apps.store_id
    AND profile_id = auth.uid()
  )
);

-- API Keys - أصحاب المتاجر فقط
CREATE POLICY "Store owners can manage their API keys"
ON public.app_api_keys FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.installed_apps ia
    JOIN public.affiliate_stores s ON ia.store_id = s.id
    WHERE ia.id = app_api_keys.installed_app_id
    AND s.profile_id = auth.uid()
  )
);

-- Webhooks - أصحاب المتاجر فقط
CREATE POLICY "Store owners can manage their webhooks"
ON public.app_webhooks FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.installed_apps ia
    JOIN public.affiliate_stores s ON ia.store_id = s.id
    WHERE ia.id = app_webhooks.installed_app_id
    AND s.profile_id = auth.uid()
  )
);

-- Webhook Logs - أصحاب المتاجر فقط
CREATE POLICY "Store owners can view their webhook logs"
ON public.app_webhook_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.installed_apps ia
    JOIN public.affiliate_stores s ON ia.store_id = s.id
    WHERE ia.id = app_webhook_logs.installed_app_id
    AND s.profile_id = auth.uid()
  )
);

-- Reviews - يمكن للجميع القراءة
CREATE POLICY "Anyone can view visible reviews"
ON public.app_reviews FOR SELECT
USING (is_visible = true);

CREATE POLICY "Store owners can create reviews"
ON public.app_reviews FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.affiliate_stores
    WHERE id = store_id
    AND profile_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own reviews"
ON public.app_reviews FOR UPDATE
USING (user_id = auth.uid());

-- Events - أصحاب المتاجر فقط
CREATE POLICY "Store owners can manage their events"
ON public.app_events FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.affiliate_stores
    WHERE id = app_events.store_id
    AND profile_id = auth.uid()
  )
);

-- =============================================
-- Trigger لتحديث updated_at
-- =============================================
CREATE OR REPLACE FUNCTION public.update_marketplace_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_marketplace_apps_updated_at
BEFORE UPDATE ON public.marketplace_apps
FOR EACH ROW EXECUTE FUNCTION public.update_marketplace_updated_at();

CREATE TRIGGER update_installed_apps_updated_at
BEFORE UPDATE ON public.installed_apps
FOR EACH ROW EXECUTE FUNCTION public.update_marketplace_updated_at();

CREATE TRIGGER update_app_reviews_updated_at
BEFORE UPDATE ON public.app_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_marketplace_updated_at();

-- =============================================
-- Trigger لتحديث install_count
-- =============================================
CREATE OR REPLACE FUNCTION public.update_app_install_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.marketplace_apps
    SET install_count = install_count + 1
    WHERE id = NEW.app_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.marketplace_apps
    SET install_count = GREATEST(0, install_count - 1)
    WHERE id = OLD.app_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_install_count_trigger
AFTER INSERT OR DELETE ON public.installed_apps
FOR EACH ROW EXECUTE FUNCTION public.update_app_install_count();

-- =============================================
-- Trigger لتحديث rating
-- =============================================
CREATE OR REPLACE FUNCTION public.update_app_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.marketplace_apps
  SET 
    rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM public.app_reviews
      WHERE app_id = COALESCE(NEW.app_id, OLD.app_id)
      AND is_visible = true
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM public.app_reviews
      WHERE app_id = COALESCE(NEW.app_id, OLD.app_id)
      AND is_visible = true
    )
  WHERE id = COALESCE(NEW.app_id, OLD.app_id);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.app_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_app_rating();

-- =============================================
-- إدخال بعض التطبيقات التجريبية
-- =============================================
INSERT INTO public.marketplace_apps (slug, name, name_ar, description, description_ar, category, pricing_type, price, monthly_price, features, permissions, webhook_events, is_official, is_featured) VALUES
('whatsapp-notifications', 'WhatsApp Notifications', 'إشعارات واتساب', 'Send order notifications via WhatsApp', 'إرسال إشعارات الطلبات عبر واتساب', 'notifications', 'subscription', 0, 49, '["Order notifications", "Customer updates", "Abandoned cart alerts"]', '["orders:read", "customers:read"]', '["order.created", "order.paid", "order.shipped", "cart.abandoned"]', true, true),
('google-analytics', 'Google Analytics', 'تحليلات جوجل', 'Integrate with Google Analytics 4', 'الربط مع تحليلات جوجل 4', 'analytics', 'free', 0, 0, '["Page views tracking", "E-commerce events", "Custom dimensions"]', '["analytics:read", "analytics:write"]', '["page.view", "order.created"]', true, true),
('facebook-pixel', 'Facebook Pixel', 'بكسل فيسبوك', 'Facebook Pixel integration for ads tracking', 'ربط بكسل فيسبوك لتتبع الإعلانات', 'marketing', 'free', 0, 0, '["Conversion tracking", "Audience building", "Dynamic ads"]', '["analytics:write"]', '["order.created", "page.view"]', true, false),
('inventory-manager', 'Inventory Manager', 'مدير المخزون', 'Advanced inventory management', 'إدارة متقدمة للمخزون', 'inventory', 'subscription', 0, 99, '["Low stock alerts", "Auto reorder", "Multi-warehouse"]', '["inventory:read", "inventory:write", "products:read"]', '["inventory.low", "inventory.updated"]', true, true),
('livechat-support', 'LiveChat Support', 'دعم الدردشة الحية', 'Real-time customer chat support', 'دعم العملاء بالدردشة الحية', 'support', 'freemium', 0, 29, '["Live chat widget", "Chatbot", "Ticket system"]', '["customers:read", "customers:write"]', '["customer.signup", "customer.online"]', false, false),
('shipping-calculator', 'Shipping Calculator', 'حاسبة الشحن', 'Calculate shipping rates automatically', 'حساب تكاليف الشحن تلقائياً', 'shipping', 'paid', 99, 0, '["Multiple carriers", "Rate comparison", "Tracking"]', '["orders:read", "orders:write"]', '["order.created", "order.shipped"]', true, true);