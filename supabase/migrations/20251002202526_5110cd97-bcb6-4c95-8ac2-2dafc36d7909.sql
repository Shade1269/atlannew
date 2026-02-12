-- إنشاء جدول الكوبونات للمسوقين
CREATE TABLE IF NOT EXISTS public.affiliate_coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_store_id UUID REFERENCES public.affiliate_stores(id) ON DELETE CASCADE,
  coupon_name TEXT NOT NULL,
  coupon_code TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  minimum_order_amount NUMERIC DEFAULT 0,
  maximum_discount_amount NUMERIC,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  usage_limit INTEGER,
  usage_limit_per_customer INTEGER DEFAULT 1,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  target_type TEXT DEFAULT 'store' CHECK (target_type IN ('store', 'product', 'category')),
  target_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(affiliate_store_id, coupon_code)
);

-- جدول استخدامات الكوبونات
CREATE TABLE IF NOT EXISTS public.affiliate_coupon_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID REFERENCES public.affiliate_coupons(id) ON DELETE CASCADE,
  order_id UUID,
  customer_id UUID,
  discount_applied NUMERIC NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Enable RLS
ALTER TABLE public.affiliate_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_coupon_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies للكوبونات
CREATE POLICY "Affiliates can manage their coupons"
ON public.affiliate_coupons
FOR ALL
TO authenticated
USING (
  affiliate_store_id IN (
    SELECT ast.id 
    FROM affiliate_stores ast
    JOIN profiles p ON p.id = ast.profile_id
    WHERE p.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Public can view active coupons"
ON public.affiliate_coupons
FOR SELECT
TO public
USING (is_active = true AND (valid_until IS NULL OR valid_until > NOW()));

-- RLS Policies لاستخدامات الكوبونات
CREATE POLICY "Affiliates can view coupon usage"
ON public.affiliate_coupon_usage
FOR SELECT
TO authenticated
USING (
  coupon_id IN (
    SELECT ac.id
    FROM affiliate_coupons ac
    JOIN affiliate_stores ast ON ast.id = ac.affiliate_store_id
    JOIN profiles p ON p.id = ast.profile_id
    WHERE p.auth_user_id = auth.uid()
  )
);

CREATE POLICY "System can insert coupon usage"
ON public.affiliate_coupon_usage
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Trigger لتحديث usage_count
CREATE OR REPLACE FUNCTION update_coupon_usage_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE affiliate_coupons
  SET usage_count = usage_count + 1
  WHERE id = NEW.coupon_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_coupon_usage
AFTER INSERT ON affiliate_coupon_usage
FOR EACH ROW
EXECUTE FUNCTION update_coupon_usage_count();

-- Indexes
CREATE INDEX idx_affiliate_coupons_store ON affiliate_coupons(affiliate_store_id);
CREATE INDEX idx_affiliate_coupons_code ON affiliate_coupons(coupon_code);
CREATE INDEX idx_affiliate_coupon_usage_coupon ON affiliate_coupon_usage(coupon_id);
CREATE INDEX idx_affiliate_coupon_usage_order ON affiliate_coupon_usage(order_id);