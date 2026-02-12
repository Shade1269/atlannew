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
    console.log('Starting migration of existing products to parent-variant structure');

    // Helper function to extract parent key from SKU or name
    const extractParentKey = (item: any) => {
      // First try to extract from SKU if it has the pattern "XXX-YYY/ZZZ"
      if (item.sku && item.sku.includes('-')) {
        const beforeDash = item.sku.split('-')[0];
        if (beforeDash) return beforeDash;
      }
      
      // Fallback: use title/name before any dash or special character
      if (item.title) {
        const beforeDash = item.title.split('-')[0];
        return beforeDash.trim();
      }
      
      return item.title || item.external_id || item.id;
    };

    // Helper function to extract color and size from SKU
    const extractColorSize = (item: any) => {
      let color = null;
      let size = null;
      
      // Try to parse from SKU if available
      // Expected format: "AS14-NB/M" where NB=color, M=size
      if (item.sku && item.sku.includes('-') && item.sku.includes('/')) {
        const parts = item.sku.split('-');
        if (parts.length >= 2) {
          const afterDash = parts[1]; // "NB/M"
          const colorSizeParts = afterDash.split('/');
          if (colorSizeParts.length === 2) {
            color = colorSizeParts[0]; // "NB"
            size = colorSizeParts[1];   // "M"
          }
        }
      }
      
      return { color, size };
    };

    // Get all existing products that don't have variants yet
    const { data: existingProducts, error: fetchError } = await supabase
      .from('products')
      .select(`
        id,
        external_id,
        title,
        price_sar,
        stock,
        merchant_id,
        category,
        image_urls,
        description,
        is_active,
        commission_rate,
        created_at,
        updated_at,
        product_variants(id)
      `);

    if (fetchError) {
      console.error('Error fetching existing products:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${existingProducts?.length || 0} existing products`);

    // Group products by parent key
    const productGroups = new Map();
    const productsToMigrate = [];

    for (const product of existingProducts || []) {
      // Skip products that already have variants
      if (product.product_variants && product.product_variants.length > 0) {
        continue;
      }

      const parentKey = extractParentKey(product);
      
      if (!productGroups.has(parentKey)) {
        productGroups.set(parentKey, []);
      }
      productGroups.get(parentKey).push(product);
      productsToMigrate.push(product);
    }

    console.log(`Grouped into ${productGroups.size} parent products`);

    let migratedCount = 0;
    const createdParents = new Map();

    // Process each product group
    for (const [parentKey, products] of productGroups) {
      try {
        // Build attributes schema from all products in this group
        const attributesSchema: any = {};
        const colorValues = new Set();
        const sizeValues = new Set();
        
        for (const product of products) {
          const { color, size } = extractColorSize(product);
          
          if (color) {
            colorValues.add(color);
            if (!attributesSchema['COLOR']) {
              attributesSchema['COLOR'] = new Set();
            }
            attributesSchema['COLOR'].add(color);
          }
          
          if (size) {
            sizeValues.add(size);
            if (!attributesSchema['SIZE']) {
              attributesSchema['SIZE'] = new Set();
            }
            attributesSchema['SIZE'].add(size);
          }
        }

        // Convert Sets to Arrays for JSON storage
        const finalAttributesSchema: any = {};
        for (const [key, values] of Object.entries(attributesSchema)) {
          finalAttributesSchema[key] = Array.from(values as Set<string>);
        }

        // Use first product for base info
        const baseProduct = products[0];
        
        // Calculate total stock (sum of all products in group)
        const totalStock = products.reduce((sum: number, product: any) => sum + (product.stock || 0), 0);

        let parentProduct;
        
        if (products.length === 1) {
          // Single product - just update it to have proper schema
          const { data: updatedProduct, error: updateError } = await supabase
            .from('products')
            .update({
              external_id: parentKey,
              attributes_schema: finalAttributesSchema,
              stock: totalStock,
              updated_at: new Date().toISOString()
            })
            .eq('id', baseProduct.id)
            .select('id')
            .single();
          
          if (updateError) {
            console.error('Error updating single product:', updateError);
            continue;
          }
          parentProduct = updatedProduct;
          
          // Create a default variant for this product
          const { color, size } = extractColorSize(baseProduct);
          const variantData = {
            product_id: parentProduct.id,
            external_id: baseProduct.external_id || baseProduct.id,
            stock: baseProduct.stock || 0,
            price_modifier: 0,
            sku: baseProduct.title || `${parentKey}-default`,
            option1_name: color ? 'COLOR' : null,
            option1_value: color || null,
            option2_name: size ? 'SIZE' : null,
            option2_value: size || null,
            variant_type: 'combination',
            variant_value: [color, size].filter(Boolean).join('-') || 'default',
          };

          const { error: variantError } = await supabase
            .from('product_variants')
            .insert(variantData);

          if (variantError) {
            console.error('Error creating default variant:', variantError);
          }
          
        } else {
          // Multiple products - create parent and convert all to variants
          const parentData = {
            merchant_id: baseProduct.merchant_id,
            title: parentKey,
            external_id: parentKey,
            description: baseProduct.description || `Parent product for ${parentKey}`,
            price_sar: baseProduct.price_sar,
            stock: totalStock,
            category: baseProduct.category,
            image_urls: baseProduct.image_urls,
            is_active: baseProduct.is_active,
            commission_rate: baseProduct.commission_rate,
            attributes_schema: finalAttributesSchema,
          };

          const { data: newParent, error: parentError } = await supabase
            .from('products')
            .insert(parentData)
            .select('id')
            .single();

          if (parentError) {
            console.error('Error creating parent product:', parentError);
            continue;
          }
          parentProduct = newParent;

          // Convert each product to a variant
          for (const product of products) {
            const { color, size } = extractColorSize(product);
            
            const variantData = {
              product_id: parentProduct.id,
              external_id: product.external_id || product.id,
              stock: product.stock || 0,
              price_modifier: (product.price_sar || 0) - (baseProduct.price_sar || 0),
              sku: product.title || `${parentKey}-${product.id}`,
              option1_name: color ? 'COLOR' : null,
              option1_value: color || null,
              option2_name: size ? 'SIZE' : null,
              option2_value: size || null,
              variant_type: 'combination',
              variant_value: [color, size].filter(Boolean).join('-') || 'default',
            };

            const { error: variantError } = await supabase
              .from('product_variants')
              .insert(variantData);

            if (variantError) {
              console.error('Error creating variant:', variantError);
            } else {
              // Delete the original product after successful variant creation
              const { error: deleteError } = await supabase
                .from('products')
                .delete()
                .eq('id', product.id);

              if (deleteError) {
                console.error('Error deleting original product:', deleteError);
              }
            }
          }
        }

        migratedCount += products.length;
        console.log(`Migrated product group: ${parentKey} with ${products.length} items`);

      } catch (error) {
        console.error(`Error processing product group ${parentKey}:`, error);
        continue;
      }
    }

    console.log(`Migration completed. Processed ${migratedCount} products into ${productGroups.size} parent products`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Successfully migrated ${migratedCount} products into ${productGroups.size} parent products`,
      migrated: migratedCount,
      parentProducts: productGroups.size
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in migrate-existing-products:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});