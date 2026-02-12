import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const requestBody = await req.json();
    const { type, context, language = "ar" } = requestBody;
    
    console.log("Received request:", JSON.stringify({ type, contextKeys: Object.keys(context || {}) }));
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";
    const topic = context?.prompt || context?.topic || context?.productName || "منتج";

    switch (type) {
      case "product_description":
        systemPrompt = `أنت كاتب محتوى محترف متخصص في كتابة أوصاف المنتجات الجذابة والمقنعة.
اكتب وصفاً احترافياً للمنتج يتضمن:
- مقدمة جذابة
- المميزات الرئيسية
- الفوائد للعميل
- دعوة للشراء
استخدم لغة تسويقية مقنعة ومختصرة.`;
        userPrompt = `اكتب وصفاً احترافياً للمنتج التالي:\n${JSON.stringify(context)}`;
        break;

      case "social_media":
        systemPrompt = `أنت خبير في التسويق عبر وسائل التواصل الاجتماعي.
اكتب منشورات جذابة ومؤثرة تتضمن:
- نص جذاب ومختصر
- هاشتاقات مناسبة
- دعوة للتفاعل
اجعل المحتوى مناسباً للمنصة المحددة.`;
        userPrompt = `اكتب منشور ${context?.platform || "عام"} عن:\n${topic}`;
        break;

      case "marketing_email":
        systemPrompt = `أنت كاتب محتوى تسويقي متخصص في رسائل البريد الإلكتروني.
اكتب رسالة بريد إلكتروني تسويقية تتضمن:
- عنوان جذاب
- مقدمة مشوقة
- محتوى مقنع
- دعوة للإجراء (CTA)`;
        userPrompt = `اكتب رسالة تسويقية عن:\n${topic}\n\nالهدف: ${context?.goal || "زيادة المبيعات"}`;
        break;

      case "seo_keywords":
        systemPrompt = `أنت خبير SEO متخصص في تحسين محركات البحث للمتاجر الإلكترونية.
قدم قائمة مرتبة تتضمن:
1. كلمات مفتاحية رئيسية (5-7 كلمات)
2. كلمات مفتاحية طويلة الذيل (5-7 عبارات)
3. وصف ميتا مقترح (160 حرف)
4. عنوان SEO مقترح`;
        userPrompt = `حلل الموضوع التالي واقترح كلمات مفتاحية SEO:\n${topic}`;
        break;

      case "ad_copy":
        systemPrompt = `أنت كاتب إعلانات محترف متخصص في الإعلانات الرقمية.
اكتب نص إعلاني مؤثر يتضمن:
- عنوان لافت للانتباه
- نص مقنع ومختصر
- ميزات فريدة
- دعوة قوية للشراء (CTA)`;
        userPrompt = `اكتب نص إعلان لـ:\n${topic}\n\nالمنصة: ${context?.platform || "عامة"}`;
        break;

      default:
        systemPrompt = "أنت مساعد كتابة محترف. ساعد في إنشاء محتوى عالي الجودة.";
        userPrompt = context.prompt || JSON.stringify(context);
    }

    console.log(`Generating ${type} content...`);

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
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "الرجاء إضافة رصيد إلى حسابك" }), 
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices?.[0]?.message?.content || "";

    console.log("Content generated successfully");

    return new Response(
      JSON.stringify({ content: generatedContent, type }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ai-content-generator:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "خطأ غير متوقع" }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
