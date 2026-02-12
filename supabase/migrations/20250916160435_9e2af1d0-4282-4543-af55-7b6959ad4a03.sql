-- إضافة جداول متغيرات المنتجات للمتاجر العامة
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  variant_name TEXT NOT NULL, -- مثل "أحمر - كبير"
  variant_type TEXT NOT NULL, -- مثل "color", "size", "material"
  variant_value TEXT NOT NULL, -- مثل "أحمر", "كبير", "قطن"
  price_adjustment_sar NUMERIC DEFAULT 0, -- فرق السعر عن السعر الأساسي
  stock_quantity INTEGER DEFAULT 0,
  sku TEXT, -- رمز المنتج الفرعي
  is_available BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- إضافة فهرس للبحث السريع
CREATE INDEX idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX idx_product_variants_type ON public.product_variants(variant_type);
CREATE INDEX idx_product_variants_available ON public.product_variants(is_available);

-- إضافة جدول خيارات المتغيرات المحفوظة (للاختيار السريع)
CREATE TABLE IF NOT EXISTS public.product_variant_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  variant_type TEXT NOT NULL, -- "color", "size", etc.
  option_name TEXT NOT NULL, -- "أحمر", "كبير", etc.
  option_value TEXT NOT NULL, -- hex color code or standardized value
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- إضافة بيانات أساسية للخيارات
INSERT INTO public.product_variant_options (variant_type, option_name, option_value, display_order) 
VALUES 
  -- الألوان
  ('color', 'أحمر', '#FF0000', 1),
  ('color', 'أزرق', '#0000FF', 2),
  ('color', 'أخضر', '#008000', 3),
  ('color', 'أسود', '#000000', 4),
  ('color', 'أبيض', '#FFFFFF', 5),
  ('color', 'رمادي', '#808080', 6),
  ('color', 'بني', '#A52A2A', 7),
  ('color', 'وردي', '#FFC0CB', 8),
  ('color', 'أصفر', '#FFFF00', 9),
  ('color', 'برتقالي', '#FFA500', 10),
  
  -- الأحجام - ملابس
  ('size', 'صغير جداً', 'XS', 1),
  ('size', 'صغير', 'S', 2),
  ('size', 'متوسط', 'M', 3),
  ('size', 'كبير', 'L', 4),
  ('size', 'كبير جداً', 'XL', 5),
  ('size', 'كبير جداً جداً', 'XXL', 6),
  
  -- أحجام الأحذية
  ('shoe_size', '38', '38', 1),
  ('shoe_size', '39', '39', 2),
  ('shoe_size', '40', '40', 3),
  ('shoe_size', '41', '41', 4),
  ('shoe_size', '42', '42', 5),
  ('shoe_size', '43', '43', 6),
  ('shoe_size', '44', '44', 7),
  ('shoe_size', '45', '45', 8),
  
  -- الخامات
  ('material', 'قطن', 'cotton', 1),
  ('material', 'حرير', 'silk', 2),
  ('material', 'صوف', 'wool', 3),
  ('material', 'جلد', 'leather', 4),
  ('material', 'بوليستر', 'polyester', 5),
  ('material', 'كتان', 'linen', 6);

-- إضافة عمود للمتغيرات المختارة في السلة
ALTER TABLE public.cart_items 
ADD COLUMN IF NOT EXISTS selected_variants JSONB DEFAULT '{}';

-- تحديث جدول عناصر الطلبات لحفظ المتغيرات
ALTER TABLE public.ecommerce_order_items 
ADD COLUMN IF NOT EXISTS selected_variants JSONB DEFAULT '{}';

-- RLS Policies
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variant_options ENABLE ROW LEVEL SECURITY;

-- سياسات الوصول للمتغيرات
CREATE POLICY "Anyone can view available product variants" 
ON public.product_variants FOR SELECT 
USING (is_available = true);

CREATE POLICY "Product owners can manage variants" 
ON public.product_variants FOR ALL 
USING (
  product_id IN (
    SELECT p.id FROM products p 
    JOIN shops s ON s.id = p.shop_id 
    JOIN profiles pr ON pr.id = s.owner_id 
    WHERE pr.auth_user_id = auth.uid()
  )
);

-- سياسات خيارات المتغيرات
CREATE POLICY "Anyone can view variant options" 
ON public.product_variant_options FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage variant options" 
ON public.product_variant_options FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE auth_user_id = auth.uid() 
    AND role = 'admin'
  )
);