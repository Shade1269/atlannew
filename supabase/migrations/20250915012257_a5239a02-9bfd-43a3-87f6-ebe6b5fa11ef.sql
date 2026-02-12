-- Create demo store and products for testing

-- Insert demo affiliate store
INSERT INTO affiliate_stores (store_name, store_slug, bio, is_active, profile_id, logo_url) 
VALUES (
  'متجر تقني',
  'demo-store', 
  'متجر تقني متخصص في أحدث الأجهزة الإلكترونية والإكسسوارات التكنولوجية',
  true,
  (SELECT id FROM profiles WHERE role = 'affiliate' LIMIT 1),
  'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d'
) ON CONFLICT (store_slug) DO NOTHING;

-- Get the demo store ID
DO $$
DECLARE
    demo_store_id UUID;
    product_ids UUID[];
BEGIN
    -- Get demo store ID
    SELECT id INTO demo_store_id FROM affiliate_stores WHERE store_slug = 'demo-store';
    
    -- Get some existing product IDs
    SELECT ARRAY(SELECT id FROM products LIMIT 3) INTO product_ids;
    
    -- Insert demo affiliate products if we have products and store
    IF demo_store_id IS NOT NULL AND array_length(product_ids, 1) > 0 THEN
        -- Add first product
        INSERT INTO affiliate_products (affiliate_store_id, product_id, is_visible, sort_order, commission_rate)
        VALUES (demo_store_id, product_ids[1], true, 1, 15.00)
        ON CONFLICT (affiliate_store_id, product_id) DO NOTHING;
        
        -- Add second product if exists
        IF array_length(product_ids, 1) > 1 THEN
            INSERT INTO affiliate_products (affiliate_store_id, product_id, is_visible, sort_order, commission_rate)
            VALUES (demo_store_id, product_ids[2], true, 2, 12.00)
            ON CONFLICT (affiliate_store_id, product_id) DO NOTHING;
        END IF;
        
        -- Add third product if exists  
        IF array_length(product_ids, 1) > 2 THEN
            INSERT INTO affiliate_products (affiliate_store_id, product_id, is_visible, sort_order, commission_rate)
            VALUES (demo_store_id, product_ids[3], true, 3, 10.00)
            ON CONFLICT (affiliate_store_id, product_id) DO NOTHING;
        END IF;
    END IF;
END $$;