import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { getSupabaseAdminClient } from '../_shared/supabase.ts';
import { validateBody, z } from '../_shared/validation.ts';

// Zod schema للتحقق من البيانات
const AffiliateOrderSchema = z.object({
  session_id: z.string().uuid('معرف الجلسة غير صالح'),
  affiliate_store_id: z.string().uuid('معرف المتجر غير صالح'),
  order_items: z.array(z.object({
    product_id: z.string().uuid('معرف المنتج غير صالح'),
    quantity: z.number().positive('الكمية يجب أن تكون موجبة'),
    price: z.number().nonnegative('السعر يجب أن يكون صفر أو أكثر'),
  })).min(1, 'أضف منتج واحد على الأقل'),
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    // التحقق من البيانات باستخدام Zod
    const validation = await validateBody(req, AffiliateOrderSchema, corsHeaders);
    if (!validation.success) {
      return validation.errorResponse;
    }

    const { session_id, affiliate_store_id, order_items } = validation.data;

    console.log('Processing affiliate order:', {
      session_id,
      affiliate_store_id,
      order_items_count: order_items.length
    });

    // استخدام Supabase Admin Client المشترك
    const supabase = getSupabaseAdminClient();

    // استدعاء function لمعالجة الطلب
    const { data, error } = await supabase.rpc('process_affiliate_order', {
      p_session_id: session_id,
      p_affiliate_store_id: affiliate_store_id,
      p_order_items: order_items
    });

    if (error) {
      console.error('Database function error:', error);
      throw new Error(`خطأ في قاعدة البيانات: ${error.message}`);
    }

    console.log('Order processed successfully:', data);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in process-affiliate-order function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'حدث خطأ في معالجة الطلب'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});