import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { getSupabaseAdminClient } from '../_shared/supabase.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const { message, storeId, profileId } = await req.json();

    if (!message || !storeId || !profileId) {
      throw new Error('Missing required fields: message, storeId, profileId');
    }

    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    // استخدام Supabase Admin Client المشترك
    const supabase = getSupabaseAdminClient();

    // Fetch store data
    const { data: store } = await supabase
      .from('affiliate_stores')
      .select('*')
      .eq('id', storeId)
      .single();

    // Fetch recent orders for this store
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('id, order_number, status, total_amount_sar, created_at, customer_name')
      .eq('affiliate_store_id', storeId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Fetch order statistics
    const { data: orderStats } = await supabase
      .from('orders')
      .select('status, total_amount_sar')
      .eq('affiliate_store_id', storeId);

    const totalOrders = orderStats?.length || 0;
    const totalSales = orderStats?.reduce((sum, o) => sum + (o.total_amount_sar || 0), 0) || 0;
    const pendingOrders = orderStats?.filter(o => o.status === 'pending').length || 0;
    const completedOrders = orderStats?.filter(o => o.status === 'completed' || o.status === 'delivered').length || 0;

    // Fetch commissions
    const { data: commissions } = await supabase
      .from('commissions')
      .select('amount_sar, status, created_at')
      .eq('affiliate_id', profileId)
      .order('created_at', { ascending: false })
      .limit(20);

    const totalCommissions = commissions?.reduce((sum, c) => sum + (c.amount_sar || 0), 0) || 0;
    const pendingCommissions = commissions?.filter(c => c.status === 'pending').reduce((sum, c) => sum + (c.amount_sar || 0), 0) || 0;

    // Fetch products count
    const { count: productsCount } = await supabase
      .from('affiliate_products')
      .select('id', { count: 'exact', head: true })
      .eq('affiliate_store_id', storeId);

    // Build context for AI
    const storeContext = `
أنت مساعد ذكي لمتجر "${store?.store_name || 'المتجر'}" على منصة أطلانتس للتسويق بالعمولة.

معلومات المتجر:
- اسم المتجر: ${store?.store_name}
- رابط المتجر: ${store?.store_slug}
- حالة المتجر: ${store?.is_active ? 'نشط' : 'غير نشط'}

إحصائيات المتجر:
- إجمالي الطلبات: ${totalOrders}
- الطلبات المعلقة: ${pendingOrders}
- الطلبات المكتملة: ${completedOrders}
- إجمالي المبيعات: ${totalSales.toFixed(2)} ر.س
- عدد المنتجات: ${productsCount || 0}

العمولات:
- إجمالي العمولات: ${totalCommissions.toFixed(2)} ر.س
- العمولات المعلقة: ${pendingCommissions.toFixed(2)} ر.س

آخر الطلبات:
${recentOrders?.map(o => `- طلب #${o.order_number}: ${o.status} - ${o.total_amount_sar} ر.س - ${o.customer_name || 'عميل'} - ${new Date(o.created_at).toLocaleDateString('ar-SA')}`).join('\n') || 'لا توجد طلبات'}

مهمتك:
1. أجب على أسئلة المسوقة حول متجرها فقط
2. أخبرها بآخر الطلبات والمبيعات والعمولات
3. قدم نصائح لتحسين أداء متجرها
4. ساعدها في فهم إحصائياتها
5. لا تتحدث عن أمور خارج نطاق متجرها

أجب بشكل مختصر ومفيد باللغة العربية.
`;

    // Call OpenAI
    if (!openaiKey) {
      // Fallback response without AI
      const fallbackResponse = generateFallbackResponse(message, {
        storeName: store?.store_name,
        totalOrders,
        pendingOrders,
        completedOrders,
        totalSales,
        totalCommissions,
        pendingCommissions,
        productsCount: productsCount || 0,
        recentOrders
      });

      return new Response(JSON.stringify({
        response: fallbackResponse,
        storeStats: {
          totalOrders,
          pendingOrders,
          completedOrders,
          totalSales,
          totalCommissions,
          pendingCommissions,
          productsCount: productsCount || 0
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: storeContext },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    const aiData = await openaiResponse.json();
    const aiResponse = aiData.choices?.[0]?.message?.content || 'عذراً، لم أتمكن من معالجة طلبك.';

    return new Response(JSON.stringify({
      response: aiResponse,
      storeStats: {
        totalOrders,
        pendingOrders,
        completedOrders,
        totalSales,
        totalCommissions,
        pendingCommissions,
        productsCount: productsCount || 0
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Marketer Brain error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
      response: 'عذراً، حدث خطأ. حاولي مرة أخرى.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function generateFallbackResponse(message: string, stats: any) {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('طلب') || lowerMessage.includes('order')) {
    if (stats.recentOrders?.length > 0) {
      const lastOrder = stats.recentOrders[0];
      return `آخر طلب: #${lastOrder.order_number} بقيمة ${lastOrder.total_amount_sar} ر.س - الحالة: ${lastOrder.status}\n\nلديك ${stats.totalOrders} طلب إجمالي، منها ${stats.pendingOrders} معلق.`;
    }
    return `لديك ${stats.totalOrders} طلب إجمالي، منها ${stats.pendingOrders} معلق و ${stats.completedOrders} مكتمل.`;
  }

  if (lowerMessage.includes('مبيع') || lowerMessage.includes('sale')) {
    return `إجمالي مبيعاتك: ${stats.totalSales.toFixed(2)} ر.س من ${stats.totalOrders} طلب.`;
  }

  if (lowerMessage.includes('عمول') || lowerMessage.includes('commission')) {
    return `إجمالي عمولاتك: ${stats.totalCommissions.toFixed(2)} ر.س\nالعمولات المعلقة: ${stats.pendingCommissions.toFixed(2)} ر.س`;
  }

  if (lowerMessage.includes('منتج') || lowerMessage.includes('product')) {
    return `لديك ${stats.productsCount} منتج في متجرك "${stats.storeName}".`;
  }

  // Default summary
  return `مرحباً! إليك ملخص متجرك "${stats.storeName}":\n\n📦 الطلبات: ${stats.totalOrders} (${stats.pendingOrders} معلق)\n💰 المبيعات: ${stats.totalSales.toFixed(2)} ر.س\n🎯 العمولات: ${stats.totalCommissions.toFixed(2)} ر.س\n🛍️ المنتجات: ${stats.productsCount}\n\nكيف يمكنني مساعدتك؟`;
}
