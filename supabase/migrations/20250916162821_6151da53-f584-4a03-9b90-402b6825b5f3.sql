-- إنشاء جدول خيارات المتغيرات أولاً
CREATE TABLE IF NOT EXISTS public.product_variant_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL, -- 'color', 'size', 'material', etc.
  value TEXT NOT NULL,
  display_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء فهرس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_variant_options_type ON public.product_variant_options(type);
CREATE INDEX IF NOT EXISTS idx_variant_options_active ON public.product_variant_options(is_active);

-- إنشاء trigger للتحديث التلقائي للوقت
DROP TRIGGER IF EXISTS update_variant_options_updated_at ON public.product_variant_options;
CREATE TRIGGER update_variant_options_updated_at
  BEFORE UPDATE ON public.product_variant_options
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS policies لجدول خيارات المتغيرات
ALTER TABLE public.product_variant_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active variant options" ON public.product_variant_options;
CREATE POLICY "Anyone can view active variant options"
  ON public.product_variant_options
  FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Merchants can manage variant options" ON public.product_variant_options;
CREATE POLICY "Merchants can manage variant options"
  ON public.product_variant_options
  FOR ALL
  USING (get_current_user_role() = ANY(ARRAY['admin', 'merchant']::text[]))
  WITH CHECK (get_current_user_role() = ANY(ARRAY['admin', 'merchant']::text[]));

-- إدراج خيارات المتغيرات الأساسية
INSERT INTO public.product_variant_options (type, value, display_name, sort_order) VALUES
-- الألوان
('color', 'BL', 'أسود', 1),
('color', 'WH', 'أبيض', 2),
('color', 'RE', 'أحمر', 3),
('color', 'BU', 'أزرق', 4),
('color', 'GR', 'أخضر', 5),
('color', 'YE', 'أصفر', 6),
('color', 'PI', 'وردي', 7),
('color', 'PU', 'بنفسجي', 8),
('color', 'BR', 'بني', 9),
('color', 'GY', 'رمادي', 10),
('color', 'OR', 'برتقالي', 11),
('color', 'NB', 'كحلي', 12),
('color', 'MO', 'موف', 13),

-- المقاسات
('size', 'XS', 'صغير جداً', 1),
('size', 'S', 'صغير', 2),
('size', 'M', 'متوسط', 3),
('size', 'L', 'كبير', 4),
('size', 'XL', 'كبير جداً', 5),
('size', 'XXL', 'كبير جداً جداً', 6),
('size', 'XXXL', 'كبير جداً جداً جداً', 7),

-- مقاسات أرقام
('size', '36', '36', 10),
('size', '38', '38', 11),
('size', '40', '40', 12),
('size', '42', '42', 13),
('size', '44', '44', 14),
('size', '46', '46', 15),
('size', '48', '48', 16),
('size', '50', '50', 17),

-- الخامات
('material', 'cotton', 'قطن', 1),
('material', 'polyester', 'بوليستر', 2),
('material', 'silk', 'حرير', 3),
('material', 'wool', 'صوف', 4),
('material', 'linen', 'كتان', 5),
('material', 'denim', 'جينز', 6),
('material', 'leather', 'جلد', 7),
('material', 'synthetic', 'صناعي', 8)

ON CONFLICT (type, value) DO NOTHING;

-- إضافة عمود product_id إلى جدول product_variants للربط مع جدول products
ALTER TABLE public.product_variants 
ADD COLUMN IF NOT EXISTS product_id UUID;

-- إنشاء فهرس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);

-- تحديث العمود selected_variants في cart_items
ALTER TABLE public.cart_items 
ADD COLUMN IF NOT EXISTS selected_variants JSONB DEFAULT '{}';

-- تحديث العمود selected_variants في ecommerce_order_items
ALTER TABLE public.ecommerce_order_items 
ADD COLUMN IF NOT EXISTS selected_variants JSONB DEFAULT '{}';

-- إنشاء دالة لإنشاء متغيرات تلقائية من attributes_schema الموجودة
CREATE OR REPLACE FUNCTION create_variants_from_attributes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    product_record RECORD;
    color_val TEXT;
    size_val TEXT;
    variant_name_text TEXT;
    color_display TEXT;
    size_display TEXT;
    is_first_variant BOOLEAN;
BEGIN
    -- المرور عبر جميع المنتجات التي لها attributes_schema
    FOR product_record IN 
        SELECT id, title, price_sar, attributes_schema, sku
        FROM products 
        WHERE attributes_schema IS NOT NULL 
        AND attributes_schema != '{}'::jsonb
        AND is_active = true
    LOOP
        is_first_variant := true;
        
        -- إنشاء متغيرات لكل مجموعة من اللون والمقاس
        IF product_record.attributes_schema ? 'COLOR' AND product_record.attributes_schema ? 'SIZE' THEN
            FOR color_val IN SELECT jsonb_array_elements_text(product_record.attributes_schema->'COLOR')
            LOOP
                FOR size_val IN SELECT jsonb_array_elements_text(product_record.attributes_schema->'SIZE')
                LOOP
                    -- الحصول على الأسماء المعروضة
                    SELECT display_name INTO color_display 
                    FROM product_variant_options 
                    WHERE type = 'color' AND value = color_val 
                    LIMIT 1;
                    
                    SELECT display_name INTO size_display 
                    FROM product_variant_options 
                    WHERE type = 'size' AND value = size_val 
                    LIMIT 1;
                    
                    -- إنشاء اسم المتغير
                    variant_name_text := product_record.title || ' - ' || 
                                        COALESCE(color_display, color_val) || ' - ' || 
                                        COALESCE(size_display, size_val);
                    
                    -- التحقق من عدم وجود متغير مماثل
                    IF NOT EXISTS (
                        SELECT 1 FROM product_variants 
                        WHERE product_id = product_record.id 
                        AND color = color_val 
                        AND size = size_val
                    ) THEN
                        INSERT INTO product_variants (
                            product_id,
                            variant_name,
                            variant_sku,
                            color,
                            size,
                            selling_price,
                            current_stock,
                            is_active
                        ) VALUES (
                            product_record.id,
                            variant_name_text,
                            COALESCE(product_record.sku, '') || '-' || color_val || '-' || size_val,
                            color_val,
                            size_val,
                            product_record.price_sar,
                            CASE WHEN is_first_variant THEN 10 ELSE 5 END,
                            true
                        );
                        
                        is_first_variant := false;
                    END IF;
                END LOOP;
            END LOOP;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'تم إنشاء المتغيرات بنجاح من attributes_schema الموجودة';
END;
$$;

-- تشغيل الدالة لإنشاء المتغيرات
SELECT create_variants_from_attributes();