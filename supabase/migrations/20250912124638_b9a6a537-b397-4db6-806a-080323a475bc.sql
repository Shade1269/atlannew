-- إنشاء جدول الفئات
CREATE TABLE public.product_categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    name_ar TEXT,
    name_en TEXT,
    description TEXT,
    parent_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
    slug TEXT NOT NULL UNIQUE,
    image_url TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    seo_title TEXT,
    seo_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول العلامات التجارية
CREATE TABLE public.product_brands (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    logo_url TEXT,
    website_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول الصور المنفصل
CREATE TABLE public.product_images (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    sort_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إضافة أعمدة جديدة لجدول المنتجات
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.product_brands(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS sku TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS weight_kg NUMERIC,
ADD COLUMN IF NOT EXISTS dimensions_cm TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS seo_title TEXT,
ADD COLUMN IF NOT EXISTS seo_description TEXT,
ADD COLUMN IF NOT EXISTS meta_keywords TEXT[],
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS min_order_quantity INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_order_quantity INTEGER;

-- إنشاء جدول لخصائص المنتج المرنة
CREATE TABLE public.product_attributes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    attribute_name TEXT NOT NULL,
    attribute_value TEXT NOT NULL,
    attribute_type TEXT DEFAULT 'text', -- text, number, boolean, color, etc.
    is_variant BOOLEAN DEFAULT false, -- هل هذه خاصية تؤثر على المتغيرات
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON public.products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku) WHERE sku IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_product_categories_parent_id ON public.product_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_slug ON public.product_categories(slug);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_attributes_product_id ON public.product_attributes(product_id);

-- إنشاء trigger لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_categories_updated_at
    BEFORE UPDATE ON public.product_categories
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_brands_updated_at
    BEFORE UPDATE ON public.product_brands
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at_existing
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- إضافة RLS policies
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_attributes ENABLE ROW LEVEL SECURITY;

-- سياسات الفئات
CREATE POLICY "Everyone can view active categories" ON public.product_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins and merchants can manage categories" ON public.product_categories
    FOR ALL USING (get_current_user_role() = ANY(ARRAY['admin'::text, 'merchant'::text]));

-- سياسات العلامات التجارية
CREATE POLICY "Everyone can view active brands" ON public.product_brands
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage brands" ON public.product_brands
    FOR ALL USING (get_current_user_role() = 'admin'::text);

-- سياسات صور المنتجات
CREATE POLICY "Everyone can view product images" ON public.product_images
    FOR SELECT USING (
        product_id IN (
            SELECT id FROM public.products WHERE is_active = true
        )
    );

CREATE POLICY "Product owners can manage product images" ON public.product_images
    FOR ALL USING (
        product_id IN (
            SELECT p.id FROM public.products p
            JOIN public.merchants m ON m.id = p.merchant_id
            JOIN public.profiles pr ON pr.id = m.profile_id
            WHERE pr.auth_user_id = auth.uid()
        )
        OR get_current_user_role() = 'admin'::text
    );

-- سياسات خصائص المنتجات
CREATE POLICY "Everyone can view product attributes" ON public.product_attributes
    FOR SELECT USING (
        product_id IN (
            SELECT id FROM public.products WHERE is_active = true
        )
    );

CREATE POLICY "Product owners can manage product attributes" ON public.product_attributes
    FOR ALL USING (
        product_id IN (
            SELECT p.id FROM public.products p
            JOIN public.merchants m ON m.id = p.merchant_id
            JOIN public.profiles pr ON pr.id = m.profile_id
            WHERE pr.auth_user_id = auth.uid()
        )
        OR get_current_user_role() = 'admin'::text
    );

-- إدراج فئات افتراضية
INSERT INTO public.product_categories (name, name_ar, name_en, slug) VALUES
('ملابس نسائية', 'ملابس نسائية', 'Women''s Clothing', 'womens-clothing'),
('ملابس رجالية', 'ملابس رجالية', 'Men''s Clothing', 'mens-clothing'),
('إكسسوارات', 'إكسسوارات', 'Accessories', 'accessories'),
('أحذية', 'أحذية', 'Shoes', 'shoes'),
('حقائب', 'حقائب', 'Bags', 'bags'),
('عطور', 'عطور', 'Perfumes', 'perfumes'),
('إلكترونيات', 'إلكترونيات', 'Electronics', 'electronics'),
('المنزل والحديقة', 'المنزل والحديقة', 'Home & Garden', 'home-garden'),
('رياضة ولياقة', 'رياضة ولياقة', 'Sports & Fitness', 'sports-fitness'),
('صحة وجمال', 'صحة وجمال', 'Health & Beauty', 'health-beauty');

-- إدراج علامات تجارية افتراضية  
INSERT INTO public.product_brands (name, description) VALUES
('أتلانتس', 'العلامة التجارية الرئيسية للمنصة'),
('برند محلي', 'علامة تجارية محلية سعودية'),
('برند عالمي', 'علامة تجارية عالمية');

-- تحديث المنتجات الموجودة بربطها مع الفئات
UPDATE public.products 
SET category_id = (SELECT id FROM public.product_categories WHERE slug = 'womens-clothing' LIMIT 1)
WHERE category = 'abaya' OR category = 'dress';

UPDATE public.products 
SET category_id = (SELECT id FROM public.product_categories WHERE slug = 'womens-clothing' LIMIT 1)
WHERE category = 'General' OR category IS NULL;