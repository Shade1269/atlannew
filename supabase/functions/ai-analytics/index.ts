import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { getSupabaseAdminClient } from '../_shared/supabase.ts';

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const { type, storeId, dateRange } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // استخدام Supabase Admin Client المشترك
    const supabase = getSupabaseAdminClient();

    // Fetch relevant data based on type
    let analyticsData: any = {};

    if (storeId) {
      // Get store orders
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('affiliate_store_id', storeId)
        .order('created_at', { ascending: false })
        .limit(100);

      // Get store products
      const { data: products } = await supabase
        .from('affiliate_products')
        .select('*, products(*)')
        .eq('affiliate_store_id', storeId);

      analyticsData = { orders, products };
    }

    let systemPrompt = "";
    let userPrompt = "";

    switch (type) {
      case "sales_analysis":
        systemPrompt = `أنت محلل بيانات مبيعات خبير. قم بتحليل البيانات وتقديم:
- ملخص الأداء
- الاتجاهات الرئيسية
- نقاط القوة والضعف
- توصيات قابلة للتنفيذ
استخدم الأرقام والنسب المئوية.`;
        userPrompt = `حلل بيانات المبيعات التالية:\n${JSON.stringify(analyticsData.orders?.slice(0, 20))}`;
        break;

      case "product_performance":
        systemPrompt = `أنت محلل أداء منتجات. قم بتحليل:
- المنتجات الأكثر مبيعاً
- المنتجات التي تحتاج تحسين
- فرص النمو
- توصيات للتسعير والترويج`;
        userPrompt = `حلل أداء المنتجات التالية:\n${JSON.stringify(analyticsData.products?.slice(0, 20))}`;
        break;

      case "customer_insights":
        systemPrompt = `أنت خبير في تحليل سلوك العملاء. قدم:
- أنماط الشراء
- تفضيلات العملاء
- فرص البيع المتقاطع
- توصيات للاحتفاظ بالعملاء`;
        userPrompt = `حلل بيانات العملاء والطلبات:\n${JSON.stringify(analyticsData.orders?.slice(0, 20))}`;
        break;

      case "growth_recommendations":
        systemPrompt = `أنت مستشار نمو أعمال. قدم:
- فرص النمو المتاحة
- استراتيجيات التوسع
- تحسينات مقترحة
- خطة عمل قصيرة المدى`;
        userPrompt = `بناءً على البيانات التالية، قدم توصيات للنمو:\nالطلبات: ${analyticsData.orders?.length || 0}\nالمنتجات: ${analyticsData.products?.length || 0}`;
        break;

      case "forecast":
        systemPrompt = `أنت محلل توقعات مبيعات. قدم:
- توقعات المبيعات القادمة
- العوامل المؤثرة
- السيناريوهات المحتملة
- توصيات للتحضير`;
        userPrompt = `بناءً على البيانات التاريخية، قدم توقعات:\n${JSON.stringify(analyticsData.orders?.slice(0, 30))}`;
        break;

      default:
        systemPrompt = "أنت محلل بيانات ذكي. قدم تحليلاً شاملاً ومفيداً.";
        userPrompt = JSON.stringify(analyticsData);
    }

    console.log(`Running ${type} analysis...`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
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
    const analysis = data.choices?.[0]?.message?.content || "";

    console.log("Analysis completed successfully");

    return new Response(
      JSON.stringify({
        analysis,
        type,
        dataPoints: {
          orders: analyticsData.orders?.length || 0,
          products: analyticsData.products?.length || 0
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ai-analytics:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "خطأ غير متوقع" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
