-- جعل عمود warehouse_product_id اختياري
ALTER TABLE public.product_variants 
ALTER COLUMN warehouse_product_id DROP NOT NULL;

-- إنشاء دالة محسّنة لإنشاء المتغيرات
CREATE OR REPLACE FUNCTION create_variants_from_products_fixed()
RETURNS TEXT
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
    variants_created INTEGER := 0;
    result_message TEXT;
BEGIN
    -- المرور عبر المنتجات التي لها attributes_schema
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
                            COALESCE(product_record.sku, 'P-' || LEFT(product_record.id::text, 8)) || '-' || color_val || '-' || size_val,
                            color_val,
                            size_val,
                            product_record.price_sar,
                            10,
                            true
                        );
                        
                        variants_created := variants_created + 1;
                    END IF;
                END LOOP;
            END LOOP;
        END IF;
    END LOOP;
    
    result_message := 'تم إنشاء ' || variants_created || ' متغير بنجاح من المنتجات الموجودة';
    RETURN result_message;
END;
$$;

-- تشغيل الدالة المحسّنة
SELECT create_variants_from_products_fixed() as result;