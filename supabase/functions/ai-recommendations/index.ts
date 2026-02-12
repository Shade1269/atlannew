import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { getSupabaseAdminClient } from '../_shared/supabase.ts';

/**
 * 🎯 AI Product Recommendations - توصيات منتجات شخصية
 *
 * يحلل سلوك العميل ويقدم توصيات مخصصة
 */

interface RecommendationRequest {
  customerId?: string;
  sessionId?: string;
  storeId: string;
  currentProductId?: string;
  cartItems?: string[];
  browsingHistory?: string[];
  type: 'similar' | 'complementary' | 'trending' | 'personalized' | 'upsell' | 'cross-sell';
  limit?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const request: RecommendationRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // استخدام Supabase Admin Client المشترك
    const supabase = getSupabaseAdminClient();

    const {
      customerId,
      storeId,
      currentProductId,
      cartItems = [],
      browsingHistory = [],
      type = 'personalized',
      limit = 6
    } = request;

    // جلب منتجات المتجر
    const { data: products } = await supabase
      .from('affiliate_products')
      .select(`
        *,
        products:product_id (
          id,
          title,
          description,
          price_sar,
          category,
          image_url,
          stock
        )
      `)
      .eq('affiliate_store_id', storeId)
      .eq('is_visible', true);

    if (!products || products.length === 0) {
      return new Response(
        JSON.stringify({ recommendations: [], message: "لا توجد منتجات متاحة" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // جلب سجل الطلبات السابقة للعميل (إن وجد)
    let customerOrders: any[] = [];
    if (customerId) {
      const { data: orders } = await supabase
        .from('orders')
        .select('items')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(10);

      customerOrders = orders || [];
    }

    // جلب المنتج الحالي (إن وجد)
    let currentProduct = null;
    if (currentProductId) {
      currentProduct = products.find((p: any) =>
        p.product_id === currentProductId || p.products?.id === currentProductId
      );
    }

    // بناء السياق للذكاء الاصطناعي
    const productsList = products.map((p: any) => ({
      id: p.products?.id,
      title: p.products?.title,
      description: p.products?.description?.substring(0, 100),
      price: p.products?.price_sar,
      category: p.products?.category,
      inStock: (p.products?.stock || 0) > 0
    })).filter((p: any) => p.inStock);

    const typePrompts: Record<string, string> = {
      'similar': `Find products similar to "${currentProduct?.products?.title || 'current product'}".
        Match by category, price range, and features.`,

      'complementary': `Find products that complement "${currentProduct?.products?.title || 'current product'}".
        Think about what a customer would buy together with this item.`,

      'trending': `Identify the most popular and trending products.
        Consider: newest arrivals, bestsellers, most viewed.`,

      'personalized': `Create personalized recommendations based on:
        - Cart items: ${cartItems.join(', ') || 'empty'}
        - Recently viewed: ${browsingHistory.join(', ') || 'none'}
        - Past orders: ${customerOrders.length} orders`,

      'upsell': `Suggest premium alternatives to "${currentProduct?.products?.title || 'current product'}".
        Find higher-priced products with better features.`,

      'cross-sell': `Suggest additional products that go well with cart items:
        ${cartItems.join(', ') || 'no items in cart'}`
    };

    console.log(`Generating ${type} recommendations for store: ${storeId}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `أنت نظام توصيات ذكي للتجارة الإلكترونية.
مهمتك: اختيار أفضل ${limit} منتجات للعميل.

قواعد التوصية:
1. ركز على احتياجات العميل الفعلية
2. تجنب التوصية بنفس المنتج الحالي
3. رتب المنتجات حسب الملاءمة
4. فضّل المنتجات المتوفرة في المخزون
5. اعتبر نطاق السعر المناسب

أرجع النتيجة بصيغة JSON فقط:
{
  "recommendations": [
    {
      "productId": "id",
      "reason": "سبب التوصية بالعربية",
      "score": 0.95
    }
  ],
  "strategy": "وصف مختصر لاستراتيجية التوصية"
}`
          },
          {
            role: "user",
            content: `${typePrompts[type]}

المنتجات المتاحة:
${JSON.stringify(productsList, null, 2)}

${currentProduct ? `المنتج الحالي: ${currentProduct.products?.title}` : ''}

اختر أفضل ${limit} منتجات وأرجع JSON فقط.`
          }
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "تم تجاوز الحد المسموح من الطلبات" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    let aiResponse = data.choices?.[0]?.message?.content || "";

    // استخراج JSON من الرد
    let recommendations = [];
    let strategy = "";
    try {
      // تنظيف الرد من أي نص إضافي
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        recommendations = parsed.recommendations || [];
        strategy = parsed.strategy || "";
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Fallback: اختيار عشوائي
      recommendations = productsList
        .sort(() => Math.random() - 0.5)
        .slice(0, limit)
        .map((p: any) => ({
          productId: p.id,
          reason: "منتج مقترح لك",
          score: 0.7
        }));
    }

    // إثراء التوصيات ببيانات المنتجات الكاملة
    const enrichedRecommendations = recommendations.map((rec: any) => {
      const product = products.find((p: any) =>
        p.products?.id === rec.productId || p.product_id === rec.productId
      );
      return {
        ...rec,
        product: product?.products || null
      };
    }).filter((rec: any) => rec.product !== null);

    console.log(`Generated ${enrichedRecommendations.length} recommendations`);

    return new Response(
      JSON.stringify({
        success: true,
        type,
        strategy,
        recommendations: enrichedRecommendations,
        totalProducts: productsList.length,
        generatedAt: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ai-recommendations:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "خطأ غير متوقع" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
