-- إنشاء جدول البانرات الترويجية
CREATE TABLE IF NOT EXISTS public.promotional_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  banner_type TEXT NOT NULL DEFAULT 'hero', -- hero, sidebar, popup, strip
  position TEXT NOT NULL DEFAULT 'top', -- top, middle, bottom, floating
  priority INTEGER DEFAULT 1,
  
  -- محتوى البانر
  content_config JSONB DEFAULT '{}',
  image_url TEXT,
  background_color TEXT DEFAULT '#ffffff',
  text_color TEXT DEFAULT '#000000',
  button_text TEXT,
  button_text_ar TEXT,
  button_url TEXT,
  button_color TEXT DEFAULT '#0066ff',
  
  -- الاستهداف والشروط
  target_audience JSONB DEFAULT '{}', -- معايير الاستهداف
  display_conditions JSONB DEFAULT '{}', -- شروط العرض
  max_impressions INTEGER,
  current_impressions INTEGER DEFAULT 0,
  max_clicks INTEGER,
  current_clicks INTEGER DEFAULT 0,
  
  -- الجدولة
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  timezone TEXT DEFAULT 'Asia/Riyadh',
  
  -- الإعدادات
  is_active BOOLEAN DEFAULT true,
  auto_hide_after_interaction BOOLEAN DEFAULT false,
  show_close_button BOOLEAN DEFAULT true,
  animation_type TEXT DEFAULT 'fade', -- fade, slide, scale, bounce
  
  -- المتجر المرتبط
  store_id UUID,
  affiliate_store_id UUID,
  
  -- بيانات التتبع
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- إنشاء جدول حملات الترويج
CREATE TABLE IF NOT EXISTS public.promotion_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name TEXT NOT NULL,
  campaign_name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  campaign_type TEXT NOT NULL DEFAULT 'discount', -- discount, flash_sale, seasonal, bundle
  
  -- تفاصيل الحملة
  discount_type TEXT, -- percentage, fixed_amount, buy_x_get_y
  discount_value NUMERIC DEFAULT 0,
  minimum_order_amount NUMERIC DEFAULT 0,
  maximum_discount_amount NUMERIC,
  
  -- المنتجات والفئات
  applicable_products JSONB DEFAULT '[]',
  applicable_categories JSONB DEFAULT '[]',
  excluded_products JSONB DEFAULT '[]',
  
  -- قواعد الاستخدام
  usage_limit INTEGER,
  usage_limit_per_customer INTEGER DEFAULT 1,
  current_usage_count INTEGER DEFAULT 0,
  
  -- الجدولة
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  timezone TEXT DEFAULT 'Asia/Riyadh',
  
  -- الإعدادات
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  auto_apply BOOLEAN DEFAULT false, -- تطبيق تلقائي للعروض المؤهلة
  
  -- المتجر المرتبط
  store_id UUID,
  affiliate_store_id UUID,
  
  -- بيانات التتبع
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- إنشاء جدول تحليلات البانرات
CREATE TABLE IF NOT EXISTS public.banner_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  banner_id UUID NOT NULL REFERENCES public.promotional_banners(id) ON DELETE CASCADE,
  
  -- بيانات التفاعل
  event_type TEXT NOT NULL, -- impression, click, close, conversion
  user_id UUID,
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  
  -- بيانات السياق
  page_url TEXT,
  referrer_url TEXT,
  device_type TEXT, -- mobile, tablet, desktop
  browser_type TEXT,
  
  -- بيانات الموقع (اختيارية)
  country_code TEXT,
  city TEXT,
  
  -- بيانات إضافية
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- إنشاء جدول ربط البانرات بالحملات
CREATE TABLE IF NOT EXISTS public.campaign_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.promotion_campaigns(id) ON DELETE CASCADE,
  banner_id UUID NOT NULL REFERENCES public.promotional_banners(id) ON DELETE CASCADE,
  
  -- إعدادات خاصة بالربط
  display_order INTEGER DEFAULT 1,
  is_primary BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(campaign_id, banner_id)
);

-- إنشاء فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_promotional_banners_store_id ON public.promotional_banners(store_id);
CREATE INDEX IF NOT EXISTS idx_promotional_banners_affiliate_store_id ON public.promotional_banners(affiliate_store_id);
CREATE INDEX IF NOT EXISTS idx_promotional_banners_active ON public.promotional_banners(is_active);
CREATE INDEX IF NOT EXISTS idx_promotional_banners_dates ON public.promotional_banners(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_promotion_campaigns_store_id ON public.promotion_campaigns(store_id);
CREATE INDEX IF NOT EXISTS idx_promotion_campaigns_affiliate_store_id ON public.promotion_campaigns(affiliate_store_id);
CREATE INDEX IF NOT EXISTS idx_promotion_campaigns_active ON public.promotion_campaigns(is_active);
CREATE INDEX IF NOT EXISTS idx_promotion_campaigns_dates ON public.promotion_campaigns(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_banner_analytics_banner_id ON public.banner_analytics(banner_id);
CREATE INDEX IF NOT EXISTS idx_banner_analytics_event_type ON public.banner_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_banner_analytics_created_at ON public.banner_analytics(created_at);

-- إضافة RLS policies
ALTER TABLE public.promotional_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banner_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_banners ENABLE ROW LEVEL SECURITY;

-- سياسات البانرات الترويجية
CREATE POLICY "Public can view active banners" ON public.promotional_banners
  FOR SELECT USING (is_active = true);

CREATE POLICY "Store owners can manage their banners" ON public.promotional_banners
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

-- سياسات حملات الترويج
CREATE POLICY "Public can view active campaigns" ON public.promotion_campaigns
  FOR SELECT USING (is_active = true);

CREATE POLICY "Store owners can manage their campaigns" ON public.promotion_campaigns
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

-- سياسات التحليلات
CREATE POLICY "Store owners can view their banner analytics" ON public.banner_analytics
  FOR SELECT USING (
    banner_id IN (
      SELECT pb.id FROM promotional_banners pb
      WHERE (
        (pb.store_id IN (
          SELECT s.id FROM shops s 
          JOIN profiles p ON p.id = s.owner_id 
          WHERE p.auth_user_id = auth.uid()
        )) OR
        (pb.affiliate_store_id IN (
          SELECT ast.id FROM affiliate_stores ast 
          JOIN profiles p ON p.id = ast.profile_id 
          WHERE p.auth_user_id = auth.uid()
        )) OR
        (get_current_user_role() = 'admin')
      )
    )
  );

CREATE POLICY "Public can create analytics events" ON public.banner_analytics
  FOR INSERT WITH CHECK (true);

-- سياسات ربط البانرات بالحملات
CREATE POLICY "Store owners can manage campaign banners" ON public.campaign_banners
  FOR ALL USING (
    campaign_id IN (
      SELECT pc.id FROM promotion_campaigns pc
      WHERE (
        (pc.store_id IN (
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
    )
  );

-- إضافة triggers للتحديث التلقائي
CREATE OR REPLACE FUNCTION update_banner_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_promotional_banners_timestamp
  BEFORE UPDATE ON public.promotional_banners
  FOR EACH ROW EXECUTE FUNCTION update_banner_timestamp();

CREATE TRIGGER update_promotion_campaigns_timestamp
  BEFORE UPDATE ON public.promotion_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_banner_timestamp();

-- إدراج بيانات تجريبية للبانرات
INSERT INTO public.promotional_banners (
  title, title_ar, description, description_ar, banner_type, position,
  content_config, button_text, button_text_ar, button_url,
  start_date, end_date, is_active
) VALUES
(
  'Summer Sale 2024',
  'تخفيضات الصيف 2024',
  'Get up to 50% off on all summer products',
  'احصل على خصم يصل إلى 50% على جميع منتجات الصيف',
  'hero',
  'top',
  '{"layout": "centered", "showCountdown": true}',
  'Shop Now',
  'تسوق الآن',
  '/products?category=summer',
  now(),
  now() + interval '30 days',
  true
),
(
  'Free Shipping Weekend',
  'توصيل مجاني نهاية الأسبوع',
  'Free shipping on orders over 200 SAR',
  'توصيل مجاني للطلبات أكثر من 200 ريال',
  'strip',
  'top',
  '{"backgroundColor": "#22c55e", "textColor": "#ffffff"}',
  'Order Now',
  'اطلب الآن',
  '/checkout',
  now(),
  now() + interval '7 days',
  true
);

-- إدراج حملات ترويجية تجريبية
INSERT INTO public.promotion_campaigns (
  campaign_name, campaign_name_ar, description, description_ar,
  campaign_type, discount_type, discount_value, minimum_order_amount,
  start_date, end_date, is_active, is_featured
) VALUES
(
  'Summer Flash Sale',
  'تخفيضات الصيف السريعة',
  '48-hour flash sale with amazing discounts',
  'تخفيضات سريعة لمدة 48 ساعة بخصومات مذهلة',
  'flash_sale',
  'percentage',
  25.00,
  100.00,
  now(),
  now() + interval '2 days',
  true,
  true
),
(
  'Bundle Deal Special',
  'عرض الحزمة الخاصة',
  'Buy 2 get 1 free on selected items',
  'اشتري قطعتين واحصل على الثالثة مجاناً',
  'bundle',
  'buy_x_get_y',
  1.00,
  0.00,
  now(),
  now() + interval '14 days',
  true,
  false
);