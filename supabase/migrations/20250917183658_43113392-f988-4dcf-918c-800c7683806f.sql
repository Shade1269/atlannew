-- إنشاء الجداول المفقودة للمرحلة 2.2

-- جدول عروض المجموعات
CREATE TABLE IF NOT EXISTS public.bundle_offers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  bundle_products jsonb NOT NULL DEFAULT '[]'::jsonb,
  bundle_price numeric NOT NULL DEFAULT 0,
  original_price numeric NOT NULL DEFAULT 0,
  discount_percentage numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  store_id uuid,
  affiliate_store_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- جدول شرائح العملاء
CREATE TABLE IF NOT EXISTS public.customer_segments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  rules jsonb NOT NULL DEFAULT '[]'::jsonb,
  estimated_count integer DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  store_id uuid,
  affiliate_store_id uuid,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- جدول استخدام الحملات
CREATE TABLE IF NOT EXISTS public.campaign_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid REFERENCES public.promotion_campaigns(id) ON DELETE CASCADE,
  customer_id uuid,
  order_id uuid,
  discount_applied numeric NOT NULL DEFAULT 0,
  used_at timestamp with time zone DEFAULT now(),
  ip_address inet,
  user_agent text
);

-- جدول الحملات الموسمية (يمكن دمجها مع promotion_campaigns لكن نبقيها منفصلة للمرونة)
CREATE TABLE IF NOT EXISTS public.seasonal_campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid REFERENCES public.promotion_campaigns(id) ON DELETE CASCADE,
  season_type text NOT NULL, -- winter, summer, ramadan, eid, etc.
  theme_config jsonb DEFAULT '{}',
  banner_config jsonb DEFAULT '{}',
  special_features jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- إنشاء indexes للأداء
CREATE INDEX IF NOT EXISTS idx_bundle_offers_active ON public.bundle_offers(is_active);
CREATE INDEX IF NOT EXISTS idx_customer_segments_active ON public.customer_segments(is_active);
CREATE INDEX IF NOT EXISTS idx_campaign_usage_campaign ON public.campaign_usage(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_usage_customer ON public.campaign_usage(customer_id);
CREATE INDEX IF NOT EXISTS idx_seasonal_campaigns_type ON public.seasonal_campaigns(season_type);

-- RLS policies
ALTER TABLE public.bundle_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasonal_campaigns ENABLE ROW LEVEL SECURITY;

-- Bundle offers policies
CREATE POLICY "Public can view active bundle offers" ON public.bundle_offers
  FOR SELECT USING (is_active = true);

CREATE POLICY "Store owners can manage bundle offers" ON public.bundle_offers
  FOR ALL USING (
    (store_id IN (
      SELECT s.id FROM shops s 
      JOIN profiles p ON p.id = s.owner_id 
      WHERE p.auth_user_id = auth.uid()
    )) OR 
    (affiliate_store_id IN (
      SELECT ast.id FROM affiliate_stores ast 
      JOIN profiles p ON p.id = ast.profile_id 
      WHERE p.auth_user_id = auth.uid()
    )) OR 
    (get_current_user_role() = 'admin')
  );

-- Customer segments policies
CREATE POLICY "Store owners can manage customer segments" ON public.customer_segments
  FOR ALL USING (
    (store_id IN (
      SELECT s.id FROM shops s 
      JOIN profiles p ON p.id = s.owner_id 
      WHERE p.auth_user_id = auth.uid()
    )) OR 
    (affiliate_store_id IN (
      SELECT ast.id FROM affiliate_stores ast 
      JOIN profiles p ON p.id = ast.profile_id 
      WHERE p.auth_user_id = auth.uid()
    )) OR 
    (get_current_user_role() = 'admin')
  );

-- Campaign usage policies
CREATE POLICY "Users can create campaign usage" ON public.campaign_usage
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Store owners can view campaign usage" ON public.campaign_usage
  FOR SELECT USING (
    campaign_id IN (
      SELECT pc.id FROM promotion_campaigns pc
      WHERE (pc.store_id IN (
        SELECT s.id FROM shops s 
        JOIN profiles p ON p.id = s.owner_id 
        WHERE p.auth_user_id = auth.uid()
      )) OR 
      (pc.affiliate_store_id IN (
        SELECT ast.id FROM affiliate_stores ast 
        JOIN profiles p ON p.id = ast.profile_id 
        WHERE p.auth_user_id = auth.uid()
      )) OR 
      (get_current_user_role() = 'admin')
    )
  );

-- Seasonal campaigns policies
CREATE POLICY "Store owners can manage seasonal campaigns" ON public.seasonal_campaigns
  FOR ALL USING (
    campaign_id IN (
      SELECT pc.id FROM promotion_campaigns pc
      WHERE (pc.store_id IN (
        SELECT s.id FROM shops s 
        JOIN profiles p ON p.id = s.owner_id 
        WHERE p.auth_user_id = auth.uid()
      )) OR 
      (pc.affiliate_store_id IN (
        SELECT ast.id FROM affiliate_stores ast 
        JOIN profiles p ON p.id = ast.profile_id 
        WHERE p.auth_user_id = auth.uid()
      )) OR 
      (get_current_user_role() = 'admin')
    )
  );

-- إضافة triggers للتحديث التلقائي
CREATE OR REPLACE FUNCTION update_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path TO 'public';

CREATE TRIGGER update_bundle_offers_updated_at
    BEFORE UPDATE ON public.bundle_offers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_timestamp();

CREATE TRIGGER update_customer_segments_updated_at
    BEFORE UPDATE ON public.customer_segments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_timestamp();

CREATE TRIGGER update_seasonal_campaigns_updated_at
    BEFORE UPDATE ON public.seasonal_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_timestamp();