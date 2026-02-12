-- إنشاء جدول خيارات المتغيرات
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
CREATE TRIGGER update_variant_options_updated_at
  BEFORE UPDATE ON public.product_variant_options
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS policies لجدول خيارات المتغيرات
ALTER TABLE public.product_variant_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active variant options"
  ON public.product_variant_options
  FOR SELECT
  USING (is_active = true);

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

ON CONFLICT DO NOTHING;

-- تحديث جدول المتغيرات ليكون أكثر شمولاً
ALTER TABLE public.product_variants 
ADD COLUMN IF NOT EXISTS variant_name TEXT,
ADD COLUMN IF NOT EXISTS color_option TEXT,
ADD COLUMN IF NOT EXISTS size_option TEXT,
ADD COLUMN IF NOT EXISTS material_option TEXT,
ADD COLUMN IF NOT EXISTS custom_attributes JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS images TEXT[],
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;

-- إنشاء فهارس إضافية
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_active ON public.product_variants(is_active);
CREATE INDEX IF NOT EXISTS idx_product_variants_default ON public.product_variants(is_default);

-- تحديث العمود selected_variants في cart_items ليكون أكثر وضوحاً
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
    variant_sku TEXT;
    variant_price NUMERIC;
BEGIN
    -- المرور عبر جميع المنتجات التي لها attributes_schema
    FOR product_record IN 
        SELECT id, title, price_sar, attributes_schema, sku
        FROM products 
        WHERE attributes_schema IS NOT NULL 
        AND attributes_schema != '{}'::jsonb
        AND is_active = true
    LOOP
        -- إنشاء متغيرات لكل مجموعة من اللون والمقاس
        IF product_record.attributes_schema ? 'COLOR' AND product_record.attributes_schema ? 'SIZE' THEN
            FOR color_val IN SELECT jsonb_array_elements_text(product_record.attributes_schema->'COLOR')
            LOOP
                FOR size_val IN SELECT jsonb_array_elements_text(product_record.attributes_schema->'SIZE')
                LOOP
                    -- إنشاء SKU فريد للمتغير
                    variant_sku := COALESCE(product_record.sku, '') || '-' || color_val || '-' || size_val;
                    variant_price := product_record.price_sar;
                    
                    -- التحقق من عدم وجود متغير مماثل
                    IF NOT EXISTS (
                        SELECT 1 FROM product_variants 
                        WHERE product_id = product_record.id 
                        AND color_option = color_val 
                        AND size_option = size_val
                    ) THEN
                        INSERT INTO product_variants (
                            product_id,
                            variant_name,
                            sku,
                            price_sar,
                            color_option,
                            size_option,
                            stock_quantity,
                            is_active,
                            is_default
                        ) VALUES (
                            product_record.id,
                            product_record.title || ' - ' || 
                            (SELECT display_name FROM product_variant_options WHERE type = 'color' AND value = color_val LIMIT 1) || 
                            ' - ' || 
                            (SELECT display_name FROM product_variant_options WHERE type = 'size' AND value = size_val LIMIT 1),
                            variant_sku,
                            variant_price,
                            color_val,
                            size_val,
                            CASE 
                                WHEN color_val = (SELECT jsonb_array_elements_text(product_record.attributes_schema->'COLOR') LIMIT 1)
                                AND size_val = (SELECT jsonb_array_elements_text(product_record.attributes_schema->'SIZE') LIMIT 1)
                                THEN 10 -- كمية افتراضية للمتغير الأول
                                ELSE 5  -- كمية أقل للمتغيرات الأخرى
                            END,
                            true,
                            color_val = (SELECT jsonb_array_elements_text(product_record.attributes_schema->'COLOR') LIMIT 1)
                            AND size_val = (SELECT jsonb_array_elements_text(product_record.attributes_schema->'SIZE') LIMIT 1)
                        );
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