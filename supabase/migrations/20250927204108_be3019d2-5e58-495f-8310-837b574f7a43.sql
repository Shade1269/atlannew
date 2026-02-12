-- إنشاء جداول نظام إدارة المنتجات المتقدم

-- جدول أساسي محدث للمنتجات
CREATE TYPE product_status AS ENUM ('draft', 'active', 'inactive', 'archived');
CREATE TYPE discount_type AS ENUM ('percent', 'amount');

-- جدول الوسائط
CREATE TABLE IF NOT EXISTS product_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('cover_image', 'gallery', 'video')),
  media_url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0,
  file_size BIGINT,
  dimensions JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول الخصومات
CREATE TABLE IF NOT EXISTS product_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  discount_type discount_type NOT NULL,
  discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_date_range CHECK (start_date IS NULL OR end_date IS NULL OR end_date > start_date)
);

-- جدول المتغيرات المتقدمة
CREATE TABLE IF NOT EXISTS product_variants_advanced (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku VARCHAR(100) UNIQUE NOT NULL,
  size VARCHAR(50),
  color VARCHAR(50),
  color_code VARCHAR(7), -- hex color
  color_swatch_url TEXT,
  barcode VARCHAR(100),
  price_override NUMERIC(10,2),
  quantity INTEGER NOT NULL DEFAULT 0,
  min_stock_alert INTEGER DEFAULT 0,
  variant_image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول معلومات SEO
CREATE TABLE IF NOT EXISTS product_seo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  seo_title VARCHAR(60),
  seo_description VARCHAR(160),
  meta_keywords TEXT[],
  slug VARCHAR(255) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول معلومات الشحن
CREATE TABLE IF NOT EXISTS product_shipping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  weight_grams INTEGER,
  length_cm NUMERIC(8,2),
  width_cm NUMERIC(8,2),
  height_cm NUMERIC(8,2),
  warehouse_id UUID,
  handling_time_days INTEGER DEFAULT 1 CHECK (handling_time_days >= 1 AND handling_time_days <= 30),
  origin_country VARCHAR(2),
  return_policy TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول الصلاحيات
CREATE TABLE IF NOT EXISTS product_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE
);

-- جدول سجل العمليات
CREATE TABLE IF NOT EXISTS product_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action_type VARCHAR(50) NOT NULL,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_product_media_product_id ON product_media(product_id);
CREATE INDEX IF NOT EXISTS idx_product_media_type ON product_media(media_type);
CREATE INDEX IF NOT EXISTS idx_product_discounts_product_id ON product_discounts(product_id);
CREATE INDEX IF NOT EXISTS idx_product_discounts_active ON product_discounts(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants_advanced(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants_advanced(sku);
CREATE INDEX IF NOT EXISTS idx_product_seo_product_id ON product_seo(product_id);
CREATE INDEX IF NOT EXISTS idx_product_seo_slug ON product_seo(slug);
CREATE INDEX IF NOT EXISTS idx_product_shipping_product_id ON product_shipping(product_id);
CREATE INDEX IF NOT EXISTS idx_product_permissions_user_id ON product_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_product_activity_log_product_id ON product_activity_log(product_id);
CREATE INDEX IF NOT EXISTS idx_product_activity_log_user_id ON product_activity_log(user_id);

-- تفعيل RLS
ALTER TABLE product_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants_advanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_seo ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_shipping ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_activity_log ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "Users can manage their product media" ON product_media
  FOR ALL USING (
    product_id IN (
      SELECT id FROM products 
      WHERE merchant_id IN (
        SELECT id FROM profiles WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage their product discounts" ON product_discounts
  FOR ALL USING (
    product_id IN (
      SELECT id FROM products 
      WHERE merchant_id IN (
        SELECT id FROM profiles WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage their product variants" ON product_variants_advanced
  FOR ALL USING (
    product_id IN (
      SELECT id FROM products 
      WHERE merchant_id IN (
        SELECT id FROM profiles WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage their product SEO" ON product_seo
  FOR ALL USING (
    product_id IN (
      SELECT id FROM products 
      WHERE merchant_id IN (
        SELECT id FROM profiles WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage their product shipping" ON product_shipping
  FOR ALL USING (
    product_id IN (
      SELECT id FROM products 
      WHERE merchant_id IN (
        SELECT id FROM profiles WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can view their permissions" ON product_permissions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage permissions" ON product_permissions
  FOR ALL USING (get_current_user_role() = 'admin');

CREATE POLICY "Users can view their activity log" ON product_activity_log
  FOR SELECT USING (
    user_id = auth.uid() OR 
    product_id IN (
      SELECT id FROM products 
      WHERE merchant_id IN (
        SELECT id FROM profiles WHERE auth_user_id = auth.uid()
      )
    )
  );

-- دوال مساعدة
CREATE OR REPLACE FUNCTION calculate_final_price(
  base_price NUMERIC,
  discount_type discount_type,
  discount_value NUMERIC,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE
) RETURNS NUMERIC AS $$
DECLARE
  discount_amount NUMERIC := 0;
BEGIN
  -- التحقق من صحة تواريخ الخصم
  IF (start_date IS NOT NULL AND NOW() < start_date) OR 
     (end_date IS NOT NULL AND NOW() > end_date) THEN
    RETURN base_price;
  END IF;
  
  -- حساب قيمة الخصم
  IF discount_type = 'percent' THEN
    discount_amount := base_price * (discount_value / 100);
  ELSE
    discount_amount := discount_value;
  END IF;
  
  -- التأكد من عدم كون السعر النهائي سالباً
  RETURN GREATEST(base_price - discount_amount, 0);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- دالة لتسجيل النشاط
CREATE OR REPLACE FUNCTION log_product_activity(
  p_product_id UUID,
  p_action_type TEXT,
  p_old_data JSONB DEFAULT NULL,
  p_new_data JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO product_activity_log (
    product_id,
    user_id,
    action_type,
    old_data,
    new_data,
    ip_address
  ) VALUES (
    p_product_id,
    auth.uid(),
    p_action_type,
    p_old_data,
    p_new_data,
    inet_client_addr()
  ) RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- تريجر لتسجيل النشاط تلقائياً
CREATE OR REPLACE FUNCTION trigger_log_product_activity()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM log_product_activity(
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- تفعيل التريجر
DROP TRIGGER IF EXISTS log_product_changes ON products;
CREATE TRIGGER log_product_changes
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH ROW EXECUTE FUNCTION trigger_log_product_activity();

-- دوال التحديث للطوابع الزمنية
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تفعيل تحديث الطوابع الزمنية
CREATE TRIGGER update_product_media_updated_at BEFORE UPDATE ON product_media FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_discounts_updated_at BEFORE UPDATE ON product_discounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON product_variants_advanced FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_seo_updated_at BEFORE UPDATE ON product_seo FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_shipping_updated_at BEFORE UPDATE ON product_shipping FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();