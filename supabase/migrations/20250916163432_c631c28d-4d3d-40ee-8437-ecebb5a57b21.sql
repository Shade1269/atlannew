-- إضافة عمود product_id إلى جدول product_variants
ALTER TABLE public.product_variants 
ADD COLUMN IF NOT EXISTS product_id UUID;

-- إنشاء فهرس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);

-- الآن تشغيل الدالة لإنشاء متغيرات بسيطة
INSERT INTO public.product_variants (product_id, variant_name, color, size, selling_price, current_stock, is_active)
SELECT 
    p.id as product_id,
    p.title || ' - ' || 
    COALESCE((SELECT pvo.display_name FROM product_variant_options pvo WHERE pvo.type = 'color' AND pvo.value = color_val), color_val) || ' - ' ||
    COALESCE((SELECT pvo.display_name FROM product_variant_options pvo WHERE pvo.type = 'size' AND pvo.value = size_val), size_val) as variant_name,
    color_val as color,
    size_val as size,
    p.price_sar as selling_price,
    10 as current_stock,
    true as is_active
FROM products p
CROSS JOIN jsonb_array_elements_text(p.attributes_schema -> 'COLOR') as color_val
CROSS JOIN jsonb_array_elements_text(p.attributes_schema -> 'SIZE') as size_val
WHERE p.attributes_schema IS NOT NULL 
    AND p.attributes_schema != '{}'::jsonb
    AND p.is_active = true
    AND p.attributes_schema ? 'COLOR' 
    AND p.attributes_schema ? 'SIZE'
ON CONFLICT DO NOTHING;