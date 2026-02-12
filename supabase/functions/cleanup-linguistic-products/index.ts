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

    console.log('Starting cleanup of linguistic products for shop:', shopId);

    // Helper function to check if product name is a coded product
    const isCodedProduct = (name: string) => {
      // Pattern 1: Simple codes like AS25, ABT1, AS19 (letters+numbers)
      const simpleCodePattern = /^[A-Z]+[0-9]+$/;
      // Pattern 2: Complex codes like AS25-GR/XL (with variants)
      const complexCodePattern = /^[A-Z0-9]+-[A-Z]+\/[A-Z0-9]+$/;
      
      return simpleCodePattern.test(name || '') || complexCodePattern.test(name || '');
    };

    // Get merchant for this shop
    const { data: shop } = await supabase
      .from('shops')
      .select(`
        owner_id,
        profiles!inner(id)
      `)
      .eq('id', shopId)
      .single();

    if (!shop || !shop.profiles) {
      throw new Error('Shop not found');
    }

    // Get merchant for the shop owner
    const { data: merchant } = await supabase
      .from('merchants')
      .select('id')
      .eq('profile_id', (shop.profiles as any).id)
      .single();

    if (!merchant) {
      throw new Error('Merchant not found for this shop');
    }

    // Get all products for this merchant
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, title, merchant_id')
      .eq('merchant_id', merchant.id);

    if (productsError) {
      console.error('Error fetching products:', productsError);
      throw new Error('Failed to fetch products');
    }

    if (!products || products.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No products found for this merchant',
        deletedCount: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Filter products that are NOT coded (linguistic products)
    const linguisticProducts = products.filter(product => {
      const isCoded = isCodedProduct(product.title);
      if (!isCoded) {
        console.log(`Found linguistic product to delete: ${product.title}`);
      }
      return !isCoded;
    });

    console.log(`Found ${linguisticProducts.length} linguistic products to delete out of ${products.length} total products`);

    if (linguisticProducts.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No linguistic products found to delete',
        deletedCount: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get product IDs to delete
    const productIdsToDelete = linguisticProducts.map(p => p.id);

    // Delete product variants first (due to foreign key constraints)
    const { error: variantsDeleteError } = await supabase
      .from('product_variants')
      .delete()
      .in('product_id', productIdsToDelete);

    if (variantsDeleteError) {
      console.error('Error deleting product variants:', variantsDeleteError);
      throw new Error('Failed to delete product variants');
    }

    // Delete product library entries
    const { error: libraryDeleteError } = await supabase
      .from('product_library')
      .delete()
      .in('product_id', productIdsToDelete);

    if (libraryDeleteError) {
      console.error('Error deleting product library entries:', libraryDeleteError);
      // Continue anyway as this might not exist for all products
    }

    // Finally, delete the products themselves
    const { error: productsDeleteError } = await supabase
      .from('products')
      .delete()
      .in('id', productIdsToDelete);

    if (productsDeleteError) {
      console.error('Error deleting products:', productsDeleteError);
      throw new Error('Failed to delete products');
    }

    console.log(`Successfully deleted ${linguisticProducts.length} linguistic products and their associated data`);

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully deleted ${linguisticProducts.length} linguistic products`,
      deletedCount: linguisticProducts.length,
      deletedProducts: linguisticProducts.map(p => p.title)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in cleanup-linguistic-products:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});