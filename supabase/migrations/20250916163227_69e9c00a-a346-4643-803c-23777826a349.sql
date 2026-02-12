-- إنشاء جدول خيارات المتغيرات
CREATE TABLE public.product_variant_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  value TEXT NOT NULL,
  display_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(type, value)
);

-- RLS policies
ALTER TABLE public.product_variant_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active variant options"
  ON public.product_variant_options FOR SELECT
  USING (is_active = true);

-- إدراج خيارات المتغيرات الأساسية
INSERT INTO public.product_variant_options (type, value, display_name, sort_order) VALUES
('color', 'BL', 'أسود', 1),
('color', 'WH', 'أبيض', 2),
('color', 'RE', 'أحمر', 3),
('color', 'BU', 'أزرق', 4),
('color', 'GR', 'أخضر', 5),
('color', 'NB', 'كحلي', 6),
('color', 'MO', 'موف', 7),
('size', 'S', 'صغير', 1),
('size', 'M', 'متوسط', 2),
('size', 'L', 'كبير', 3),
('size', 'XL', 'كبير جداً', 4),
('size', 'XXL', 'كبير جداً جداً', 5);

-- إضافة أعمدة مهمة لجدول المتغيرات
ALTER TABLE public.product_variants 
ALTER COLUMN warehouse_product_id DROP NOT NULL;

-- تحديث أعمدة السلة والطلبات
ALTER TABLE public.cart_items 
ADD COLUMN IF NOT EXISTS selected_variants JSONB DEFAULT '{}';

ALTER TABLE public.ecommerce_order_items 
ADD COLUMN IF NOT EXISTS selected_variants JSONB DEFAULT '{}';