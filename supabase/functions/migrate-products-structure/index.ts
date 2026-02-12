import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const { shopId } = await req.json();
    
    console.log('Starting products structure migration for shop:', shopId);

    // Get existing products for this shop via merchant
    const { data: shop } = await supabase
      .from('shops')
      .select(`
        owner_id,
        profiles!inner(id)
      `)
      .eq('id', shopId)
      .single();

    if (!shop) {
      throw new Error('Shop not found');
    }

    const { data: merchant } = await supabase
      .from('merchants')
      .select('id')
      .eq('profile_id', (shop.profiles as any).id)
      .single();

    if (!merchant) {
      throw new Error('Merchant not found');
    }

    // Get all products for this merchant
    const { data: existingProducts } = await supabase
      .from('products')
      .select('*')
      .eq('merchant_id', merchant.id);

    if (!existingProducts || existingProducts.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No products found to migrate',
        migrated: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${existingProducts.length} products to migrate`);

    // Group products by model (extract product code before first dash)
    const productGroups = new Map();
    
    for (const product of existingProducts) {
      // Extract product model from title (e.g., "AS25-GR/XL" -> "AS25")
      const modelMatch = product.title?.match(/^([A-Z0-9]+)-/);
      const modelCode = modelMatch ? modelMatch[1] : product.title || 'UNKNOWN';
      
      if (!productGroups.has(modelCode)) {
        productGroups.set(modelCode, []);
      }
      productGroups.get(modelCode).push(product);
    }

    console.log(`Found ${productGroups.size} product models to consolidate`);

    let migratedCount = 0;
    const productsToDelete = [];
    const mappingsToUpdate = [];

    // Process each product group
    for (const [modelCode, products] of productGroups) {
      try {
        // Skip if only one product (already consolidated)
        if (products.length === 1) {
          console.log(`Model ${modelCode} already consolidated, skipping...`);
          continue;
        }

        console.log(`Consolidating model ${modelCode} from ${products.length} products`);

        // Use the first product as the base
        const baseProduct = products[0];
        
        // Calculate consolidated data
        const totalStock = products.reduce((sum: number, p: any) => sum + (p.stock || 0), 0);
        const avgPrice = products.reduce((sum: number, p: any) => sum + (p.price_sar || 0), 0) / products.length;
        
        // Collect all images from variants
        const allImages = new Set<string>();
        products.forEach((p: any) => {
          if (p.image_urls && Array.isArray(p.image_urls)) {
            p.image_urls.forEach((url: string) => allImages.add(url));
          }
        });

        // Update the first product to be the consolidated product
        const { data: consolidatedProduct, error: updateError } = await supabase
          .from('products')
          .update({
            title: modelCode,
            description: baseProduct.description || `Product model ${modelCode}`,
            price_sar: avgPrice,
            stock: totalStock,
            image_urls: Array.from(allImages),
            updated_at: new Date().toISOString()
          })
          .eq('id', baseProduct.id)
          .select('id')
          .single();

        if (updateError) {
          console.error('Error updating consolidated product:', updateError);
          continue;
        }

        console.log(`Updated consolidated product for model: ${modelCode}`);

        // Create variants from all products in this group
        const variants = [];
        
        for (const product of products) {
          // Parse color and size from product title (e.g., "AS25-GR/XL" -> color: "GR", size: "XL")
          const variantMatch = product.title?.match(/^[A-Z0-9]+-([A-Z]+)\/([A-Z0-9]+)$/);
          
          if (variantMatch) {
            const colorCode = variantMatch[1]; // e.g., "GR", "BL", "RE"
            const sizeCode = variantMatch[2];  // e.g., "XL", "M", "L"

            // Create color variant
            variants.push({
              product_id: consolidatedProduct.id,
              variant_type: 'color',
              variant_value: colorCode,
              stock: product.stock || 0,
              price_modifier: 0,
              sku: `${modelCode}-${colorCode}`
            });

            // Create size variant
            variants.push({
              product_id: consolidatedProduct.id,
              variant_type: 'size',
              variant_value: sizeCode,
              stock: product.stock || 0,
              price_modifier: 0,
              sku: `${modelCode}-${colorCode}-${sizeCode}`
            });
          }

          // Mark other products for deletion (keep the first one)
          if (product.id !== baseProduct.id) {
            productsToDelete.push(product.id);
            
            // Update mappings to point to consolidated product
            mappingsToUpdate.push({
              oldProductId: product.id,
              newProductId: consolidatedProduct.id
            });
          }
        }

        // Insert variants
        if (variants.length > 0) {
          const { error: variantsError } = await supabase
            .from('product_variants')
            .insert(variants);

          if (variantsError) {
            console.error('Error creating variants:', variantsError);
          } else {
            console.log(`Created ${variants.length} variants for model: ${modelCode}`);
          }
        }

        migratedCount++;

      } catch (error) {
        console.error(`Error migrating model ${modelCode}:`, error);
        continue;
      }
    }

    // Update product library mappings
    for (const mapping of mappingsToUpdate) {
      await supabase
        .from('product_library')
        .update({ product_id: mapping.newProductId })
        .eq('product_id', mapping.oldProductId);
    }

    // Delete old products
    if (productsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .in('id', productsToDelete);

      if (deleteError) {
        console.error('Error deleting old products:', deleteError);
      } else {
        console.log(`Deleted ${productsToDelete.length} old product variants`);
      }
    }

    console.log(`Migration completed. Models migrated: ${migratedCount}`);

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully migrated ${migratedCount} product models with variants`,
      migrated: migratedCount,
      deleted: productsToDelete.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in migrate-products-structure:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
