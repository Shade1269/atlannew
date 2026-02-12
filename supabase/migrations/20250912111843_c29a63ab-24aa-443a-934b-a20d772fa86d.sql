-- نظام التسويق المتكامل والولاء للعملاء
-- إنشاء جداول التسويق والتواصل الاجتماعي

-- جدول تكامل وسائل التواصل الاجتماعي
CREATE TABLE public.social_media_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID,
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'instagram', 'facebook', 'linkedin', 'tiktok', 'snapchat')),
  account_name TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  account_settings JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(shop_id, platform, account_name)
);

-- جدول منشورات وسائل التواصل الاجتماعي
CREATE TABLE public.social_media_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  social_account_id UUID REFERENCES public.social_media_accounts(id),
  shop_id UUID,
  content TEXT NOT NULL,
  media_urls JSONB DEFAULT '[]',
  post_type TEXT NOT NULL DEFAULT 'text' CHECK (post_type IN ('text', 'image', 'video', 'carousel')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  posted_at TIMESTAMP WITH TIME ZONE,
  external_post_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'posted', 'failed')),
  engagement_metrics JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول حملات البريد الإلكتروني
CREATE TABLE public.email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID,
  campaign_name TEXT NOT NULL,
  subject_line TEXT NOT NULL,
  email_template TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  target_audience JSONB DEFAULT '{}', -- معايير الاستهداف
  campaign_type TEXT NOT NULL DEFAULT 'promotional' CHECK (campaign_type IN ('promotional', 'newsletter', 'transactional', 'welcome', 'abandoned_cart')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'failed')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  total_recipients INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  unsubscribed_count INTEGER DEFAULT 0,
  bounce_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول الكوبونات والعروض
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID,
  coupon_code TEXT NOT NULL,
  coupon_name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'free_shipping')),
  discount_value NUMERIC NOT NULL,
  minimum_order_amount NUMERIC DEFAULT 0,
  maximum_discount_amount NUMERIC,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  usage_limit_per_customer INTEGER DEFAULT 1,
  applicable_products JSONB DEFAULT '[]', -- قائمة معرفات المنتجات
  applicable_categories JSONB DEFAULT '[]', -- قائمة الفئات
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(shop_id, coupon_code)
);

-- جدول استخدام الكوبونات
CREATE TABLE public.coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID REFERENCES public.coupons(id),
  order_id UUID,
  user_id UUID,
  discount_applied NUMERIC NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول برنامج الولاء - مستويات العضوية
CREATE TABLE public.loyalty_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID,
  tier_name TEXT NOT NULL,
  tier_description TEXT,
  minimum_points INTEGER NOT NULL DEFAULT 0,
  minimum_spent_amount NUMERIC DEFAULT 0,
  benefits JSONB DEFAULT '{}', -- المزايا والخصومات
  tier_color TEXT DEFAULT '#000000',
  tier_icon TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(shop_id, tier_name)
);

-- جدول نقاط الولاء للعملاء
CREATE TABLE public.customer_loyalty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  shop_id UUID,
  current_points INTEGER NOT NULL DEFAULT 0,
  total_earned_points INTEGER NOT NULL DEFAULT 0,
  total_spent_points INTEGER NOT NULL DEFAULT 0,
  current_tier_id UUID REFERENCES public.loyalty_tiers(id),
  tier_progress NUMERIC DEFAULT 0, -- النسبة المئوية للوصول للمستوى التالي
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(customer_id, shop_id)
);

-- جدول معاملات النقاط
CREATE TABLE public.loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_loyalty_id UUID REFERENCES public.customer_loyalty(id),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'redeemed', 'expired', 'adjusted')),
  points_amount INTEGER NOT NULL,
  order_id UUID,
  description TEXT,
  expiry_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول مكافآت برنامج الولاء
CREATE TABLE public.loyalty_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID,
  reward_name TEXT NOT NULL,
  reward_description TEXT,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('discount_percentage', 'discount_fixed', 'free_product', 'free_shipping', 'gift_card')),
  reward_value NUMERIC NOT NULL,
  points_required INTEGER NOT NULL,
  minimum_tier_required UUID REFERENCES public.loyalty_tiers(id),
  stock_quantity INTEGER,
  used_quantity INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول استرداد المكافآت
CREATE TABLE public.loyalty_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_loyalty_id UUID REFERENCES public.customer_loyalty(id),
  reward_id UUID REFERENCES public.loyalty_rewards(id),
  points_used INTEGER NOT NULL,
  order_id UUID,
  redemption_code TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'used', 'expired', 'cancelled')),
  expires_at TIMESTAMP WITH TIME ZONE,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل RLS على جميع الجداول
ALTER TABLE public.social_media_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_loyalty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_redemptions ENABLE ROW LEVEL SECURITY;

-- سياسات الحماية لأصحاب المتاجر والمشرفين
CREATE POLICY "Shop owners can manage social media accounts" ON public.social_media_accounts
FOR ALL USING (
  shop_id IN (
    SELECT s.id FROM shops s 
    JOIN profiles p ON p.id = s.owner_id 
    WHERE p.auth_user_id = auth.uid()
  ) OR get_current_user_role() = 'admin'
);

CREATE POLICY "Shop owners can manage social media posts" ON public.social_media_posts
FOR ALL USING (
  shop_id IN (
    SELECT s.id FROM shops s 
    JOIN profiles p ON p.id = s.owner_id 
    WHERE p.auth_user_id = auth.uid()
  ) OR get_current_user_role() = 'admin'
);

CREATE POLICY "Shop owners can manage email campaigns" ON public.email_campaigns
FOR ALL USING (
  shop_id IN (
    SELECT s.id FROM shops s 
    JOIN profiles p ON p.id = s.owner_id 
    WHERE p.auth_user_id = auth.uid()
  ) OR get_current_user_role() = 'admin'
);

CREATE POLICY "Shop owners can manage coupons" ON public.coupons
FOR ALL USING (
  shop_id IN (
    SELECT s.id FROM shops s 
    JOIN profiles p ON p.id = s.owner_id 
    WHERE p.auth_user_id = auth.uid()
  ) OR get_current_user_role() = 'admin'
);

-- سياسة خاصة لاستخدام الكوبونات - العملاء يمكنهم إنشاء سجلات الاستخدام
CREATE POLICY "Customers can use coupons" ON public.coupon_usage
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Shop owners can view coupon usage" ON public.coupon_usage
FOR SELECT USING (
  coupon_id IN (
    SELECT c.id FROM coupons c 
    JOIN shops s ON s.id = c.shop_id
    JOIN profiles p ON p.id = s.owner_id 
    WHERE p.auth_user_id = auth.uid()
  ) OR get_current_user_role() = 'admin'
);

CREATE POLICY "Shop owners can manage loyalty tiers" ON public.loyalty_tiers
FOR ALL USING (
  shop_id IN (
    SELECT s.id FROM shops s 
    JOIN profiles p ON p.id = s.owner_id 
    WHERE p.auth_user_id = auth.uid()
  ) OR get_current_user_role() = 'admin'
);

-- سياسات برنامج الولاء - العملاء يمكنهم رؤية نقاطهم
CREATE POLICY "Customers can view their loyalty points" ON public.customer_loyalty
FOR SELECT USING (
  customer_id IN (
    SELECT profiles.id FROM profiles WHERE profiles.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Shop owners can manage customer loyalty" ON public.customer_loyalty
FOR ALL USING (
  shop_id IN (
    SELECT s.id FROM shops s 
    JOIN profiles p ON p.id = s.owner_id 
    WHERE p.auth_user_id = auth.uid()
  ) OR get_current_user_role() = 'admin'
);

CREATE POLICY "Customers can view their loyalty transactions" ON public.loyalty_transactions
FOR SELECT USING (
  customer_loyalty_id IN (
    SELECT cl.id FROM customer_loyalty cl 
    JOIN profiles p ON p.id = cl.customer_id 
    WHERE p.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Shop system can manage loyalty transactions" ON public.loyalty_transactions
FOR ALL USING (
  customer_loyalty_id IN (
    SELECT cl.id FROM customer_loyalty cl 
    JOIN shops s ON s.id = cl.shop_id
    JOIN profiles p ON p.id = s.owner_id 
    WHERE p.auth_user_id = auth.uid()
  ) OR get_current_user_role() = 'admin'
);

CREATE POLICY "Shop owners can manage loyalty rewards" ON public.loyalty_rewards
FOR ALL USING (
  shop_id IN (
    SELECT s.id FROM shops s 
    JOIN profiles p ON p.id = s.owner_id 
    WHERE p.auth_user_id = auth.uid()
  ) OR get_current_user_role() = 'admin'
);

CREATE POLICY "Customers can view and redeem rewards" ON public.loyalty_redemptions
FOR ALL USING (
  customer_loyalty_id IN (
    SELECT cl.id FROM customer_loyalty cl 
    JOIN profiles p ON p.id = cl.customer_id 
    WHERE p.auth_user_id = auth.uid()
  ) OR customer_loyalty_id IN (
    SELECT cl.id FROM customer_loyalty cl 
    JOIN shops s ON s.id = cl.shop_id
    JOIN profiles p ON p.id = s.owner_id 
    WHERE p.auth_user_id = auth.uid()
  ) OR get_current_user_role() = 'admin'
);

-- فهارس للأداء
CREATE INDEX idx_social_media_accounts_shop_id ON public.social_media_accounts(shop_id);
CREATE INDEX idx_social_media_posts_account_id ON public.social_media_posts(social_account_id);
CREATE INDEX idx_social_media_posts_scheduled_at ON public.social_media_posts(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_email_campaigns_shop_id ON public.email_campaigns(shop_id);
CREATE INDEX idx_email_campaigns_status ON public.email_campaigns(status);
CREATE INDEX idx_coupons_shop_id ON public.coupons(shop_id);
CREATE INDEX idx_coupons_code ON public.coupons(coupon_code);
CREATE INDEX idx_coupons_active ON public.coupons(is_active) WHERE is_active = true;
CREATE INDEX idx_coupon_usage_coupon_id ON public.coupon_usage(coupon_id);
CREATE INDEX idx_loyalty_tiers_shop_id ON public.loyalty_tiers(shop_id);
CREATE INDEX idx_customer_loyalty_customer_id ON public.customer_loyalty(customer_id);
CREATE INDEX idx_customer_loyalty_shop_id ON public.customer_loyalty(shop_id);
CREATE INDEX idx_loyalty_transactions_customer_loyalty_id ON public.loyalty_transactions(customer_loyalty_id);
CREATE INDEX idx_loyalty_rewards_shop_id ON public.loyalty_rewards(shop_id);
CREATE INDEX idx_loyalty_redemptions_customer_loyalty_id ON public.loyalty_redemptions(customer_loyalty_id);

-- دوال مساعدة لبرنامج الولاء
CREATE OR REPLACE FUNCTION public.calculate_loyalty_points(
  order_amount NUMERIC,
  points_per_riyal NUMERIC DEFAULT 1
) RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- حساب النقاط بناءً على مبلغ الطلب
  RETURN FLOOR(order_amount * points_per_riyal)::INTEGER;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_loyalty_points(
  customer_user_id UUID,
  shop_uuid UUID,
  points_to_add INTEGER,
  transaction_description TEXT DEFAULT 'نقاط من عملية شراء'
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  customer_profile_id UUID;
  loyalty_record_id UUID;
  transaction_id UUID;
BEGIN
  -- الحصول على معرف الملف الشخصي للعميل
  SELECT id INTO customer_profile_id 
  FROM profiles 
  WHERE auth_user_id = customer_user_id;
  
  IF customer_profile_id IS NULL THEN
    RAISE EXCEPTION 'Customer profile not found';
  END IF;
  
  -- البحث عن سجل الولاء أو إنشاءه
  SELECT id INTO loyalty_record_id 
  FROM customer_loyalty 
  WHERE customer_id = customer_profile_id AND shop_id = shop_uuid;
  
  IF loyalty_record_id IS NULL THEN
    -- إنشاء سجل ولاء جديد
    INSERT INTO customer_loyalty (customer_id, shop_id, current_points, total_earned_points)
    VALUES (customer_profile_id, shop_uuid, points_to_add, points_to_add)
    RETURNING id INTO loyalty_record_id;
  ELSE
    -- تحديث النقاط الحالية
    UPDATE customer_loyalty 
    SET 
      current_points = current_points + points_to_add,
      total_earned_points = total_earned_points + points_to_add,
      last_activity_at = now(),
      updated_at = now()
    WHERE id = loyalty_record_id;
  END IF;
  
  -- إضافة معاملة النقاط
  INSERT INTO loyalty_transactions (
    customer_loyalty_id, 
    transaction_type, 
    points_amount, 
    description
  ) VALUES (
    loyalty_record_id, 
    'earned', 
    points_to_add, 
    transaction_description
  ) RETURNING id INTO transaction_id;
  
  -- تحديث مستوى العضوية
  PERFORM update_customer_tier(loyalty_record_id);
  
  RETURN transaction_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_customer_tier(
  loyalty_record_id UUID
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  customer_points INTEGER;
  customer_shop_id UUID;
  new_tier_id UUID;
BEGIN
  -- الحصول على النقاط الحالية ومعرف المتجر
  SELECT current_points, shop_id 
  INTO customer_points, customer_shop_id 
  FROM customer_loyalty 
  WHERE id = loyalty_record_id;
  
  -- البحث عن أعلى مستوى مؤهل
  SELECT id INTO new_tier_id 
  FROM loyalty_tiers 
  WHERE shop_id = customer_shop_id 
    AND minimum_points <= customer_points 
    AND is_active = true
  ORDER BY minimum_points DESC 
  LIMIT 1;
  
  -- تحديث مستوى العضوية
  IF new_tier_id IS NOT NULL THEN
    UPDATE customer_loyalty 
    SET 
      current_tier_id = new_tier_id,
      updated_at = now()
    WHERE id = loyalty_record_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_coupon(
  coupon_code_input TEXT,
  shop_uuid UUID,
  customer_user_id UUID DEFAULT NULL,
  order_amount NUMERIC DEFAULT 0
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  coupon_record RECORD;
  customer_profile_id UUID;
  usage_count_by_customer INTEGER := 0;
  result JSONB;
BEGIN
  -- البحث عن الكوبون
  SELECT * INTO coupon_record 
  FROM coupons 
  WHERE coupon_code = coupon_code_input 
    AND shop_id = shop_uuid 
    AND is_active = true;
  
  -- فحص وجود الكوبون
  IF coupon_record IS NULL THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'الكوبون غير موجود أو غير فعال'
    );
  END IF;
  
  -- فحص تاريخ الصلاحية
  IF coupon_record.valid_until IS NOT NULL AND coupon_record.valid_until < now() THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'انتهت صلاحية الكوبون'
    );
  END IF;
  
  -- فحص حد الاستخدام العام
  IF coupon_record.usage_limit IS NOT NULL AND coupon_record.usage_count >= coupon_record.usage_limit THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'تم استنفاد عدد مرات استخدام الكوبون'
    );
  END IF;
  
  -- فحص الحد الأدنى لمبلغ الطلب
  IF order_amount < coupon_record.minimum_order_amount THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'مبلغ الطلب أقل من الحد الأدنى المطلوب'
    );
  END IF;
  
  -- فحص حد الاستخدام للعميل الواحد
  IF customer_user_id IS NOT NULL THEN
    SELECT id INTO customer_profile_id 
    FROM profiles 
    WHERE auth_user_id = customer_user_id;
    
    IF customer_profile_id IS NOT NULL THEN
      SELECT COUNT(*) INTO usage_count_by_customer 
      FROM coupon_usage 
      WHERE coupon_id = coupon_record.id 
        AND user_id = customer_profile_id;
      
      IF usage_count_by_customer >= coupon_record.usage_limit_per_customer THEN
        RETURN jsonb_build_object(
          'valid', false,
          'error', 'تجاوزت الحد الأقصى لاستخدام هذا الكوبون'
        );
      END IF;
    END IF;
  END IF;
  
  -- الكوبون صالح
  RETURN jsonb_build_object(
    'valid', true,
    'coupon_id', coupon_record.id,
    'discount_type', coupon_record.discount_type,
    'discount_value', coupon_record.discount_value,
    'maximum_discount_amount', coupon_record.maximum_discount_amount
  );
END;
$$;

-- إدراج بيانات تجريبية لمستويات الولاء
INSERT INTO public.loyalty_tiers (tier_name, tier_description, minimum_points, benefits, tier_color) VALUES
('عضو جديد', 'مرحباً بك في برنامج الولاء!', 0, '{"discount_percentage": 0, "free_shipping_threshold": 500}', '#9CA3AF'),
('عضو فضي', 'خصم 5% على جميع المشتريات', 500, '{"discount_percentage": 5, "free_shipping_threshold": 300, "birthday_bonus": 50}', '#C0C0C0'),
('عضو ذهبي', 'خصم 10% وشحن مجاني', 1500, '{"discount_percentage": 10, "free_shipping_threshold": 0, "birthday_bonus": 100, "early_access": true}', '#FFD700'),
('عضو ماسي', 'خصم 15% ومزايا حصرية', 5000, '{"discount_percentage": 15, "free_shipping_threshold": 0, "birthday_bonus": 200, "early_access": true, "personal_shopper": true}', '#B9F2FF');

-- إدراج كوبونات تجريبية
INSERT INTO public.coupons (coupon_code, coupon_name, description, discount_type, discount_value, minimum_order_amount, valid_until) VALUES
('WELCOME10', 'ترحيب بالعملاء الجدد', 'خصم 10% للعملاء الجدد', 'percentage', 10, 100, now() + interval '30 days'),
('FREESHIP', 'شحن مجاني', 'شحن مجاني على الطلبات', 'free_shipping', 0, 200, now() + interval '60 days'),
('SAVE50', 'وفر 50 ريال', 'خصم ثابت 50 ريال', 'fixed_amount', 50, 300, now() + interval '15 days');

-- تريجر لتحديث التوقيت
CREATE OR REPLACE FUNCTION public.update_marketing_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_social_media_accounts_timestamp
  BEFORE UPDATE ON public.social_media_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_marketing_timestamp();

CREATE TRIGGER update_email_campaigns_timestamp
  BEFORE UPDATE ON public.email_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_marketing_timestamp();

CREATE TRIGGER update_coupons_timestamp
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.update_marketing_timestamp();

CREATE TRIGGER update_loyalty_tiers_timestamp
  BEFORE UPDATE ON public.loyalty_tiers
  FOR EACH ROW EXECUTE FUNCTION public.update_marketing_timestamp();

CREATE TRIGGER update_customer_loyalty_timestamp
  BEFORE UPDATE ON public.customer_loyalty
  FOR EACH ROW EXECUTE FUNCTION public.update_marketing_timestamp();