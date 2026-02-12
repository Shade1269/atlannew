import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

/**
 * 🔍 AI Image Search - البحث بالصور
 *
 * ابحث عن منتجات مشابهة بمجرد رفع صورة
 */

interface ImageSearchRequest {
  imageUrl?: string;
  imageBase64?: string;
  storeId?: string;
  limit?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const request: ImageSearchRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { imageUrl, imageBase64, storeId, limit = 10 } = request;

    if (!imageUrl && !imageBase64) {
      return new Response(
        JSON.stringify({ error: "الرجاء إرفاق صورة للبحث" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // جلب جميع المنتجات (أو منتجات متجر محدد)
    let query = supabase
      .from('products')
      .select('id, title, description, category, price_sar, image_url')
      .eq('status', 'approved')
      .not('image_url', 'is', null);

    const { data: products } = await query;

    if (!products || products.length === 0) {
      return new Response(
        JSON.stringify({ results: [], message: "لا توجد منتجات للبحث" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Searching ${products.length} products by image`);

    // تحليل الصورة المرفوعة
    const imageContent = imageBase64
      ? { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
      : { type: "image_url", image_url: { url: imageUrl } };

    const analysisResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: `أنت نظام تحليل صور للتجارة الإلكترونية.
مهمتك: تحليل الصورة واستخراج معلومات البحث.

أرجع JSON فقط بالشكل التالي:
{
  "productType": "نوع المنتج",
  "category": "الفئة",
  "colors": ["اللون1", "اللون2"],
  "style": "النمط/الستايل",
  "material": "المادة إن أمكن",
  "keywords": ["كلمة1", "كلمة2", "كلمة3"],
  "description": "وصف مختصر للمنتج في الصورة",
  "priceRange": "low/medium/high/luxury"
}`
          },
          {
            role: "user",
            content: [
              { type: "text", text: "حلل هذه الصورة واستخرج معلومات المنتج للبحث عن منتجات مشابهة:" },
              imageContent as any
            ]
          }
        ],
        stream: false,
      }),
    });

    if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text();
      console.error("AI gateway error:", analysisResponse.status, errorText);

      if (analysisResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "تم تجاوز الحد المسموح من الطلبات" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI gateway error: ${analysisResponse.status}`);
    }

    const analysisData = await analysisResponse.json();
    let imageAnalysis: any = {};
    try {
      const jsonMatch = analysisData.choices?.[0]?.message?.content?.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        imageAnalysis = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error("Failed to parse image analysis:", e);
    }

    // البحث عن منتجات مشابهة بناءً على التحليل
    const searchPrompt = `
بناءً على تحليل الصورة:
- نوع المنتج: ${imageAnalysis.productType || 'غير محدد'}
- الفئة: ${imageAnalysis.category || 'غير محددة'}
- الألوان: ${imageAnalysis.colors?.join(', ') || 'غير محددة'}
- الستايل: ${imageAnalysis.style || 'غير محدد'}
- الكلمات المفتاحية: ${imageAnalysis.keywords?.join(', ') || 'غير محددة'}

قائمة المنتجات المتاحة:
${products.map((p: any, i: number) => `${i + 1}. ${p.title} - ${p.category} - ${p.price_sar} ريال`).join('\n')}

اختر أفضل ${limit} منتجات مطابقة ورتبها حسب التشابه.
أرجع JSON فقط:
{
  "matches": [
    { "index": 1, "score": 0.95, "reason": "سبب التطابق" }
  ]
}`;

    const matchResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: "أنت نظام مطابقة منتجات. أرجع JSON فقط بالمنتجات المطابقة."
          },
          {
            role: "user",
            content: searchPrompt
          }
        ],
        stream: false,
      }),
    });

    if (!matchResponse.ok) {
      throw new Error("Failed to match products");
    }

    const matchData = await matchResponse.json();
    let matches: any[] = [];
    try {
      const jsonMatch = matchData.choices?.[0]?.message?.content?.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        matches = parsed.matches || [];
      }
    } catch (e) {
      console.error("Failed to parse matches:", e);
    }

    // بناء النتائج مع بيانات المنتجات الكاملة
    const results = matches
      .map((match: any) => {
        const productIndex = (match.index || 1) - 1;
        const product = products[productIndex];
        if (!product) return null;
        return {
          product,
          similarity: match.score || 0.5,
          reason: match.reason || "منتج مشابه"
        };
      })
      .filter(Boolean)
      .slice(0, limit);

    console.log(`Found ${results.length} matching products`);

    return new Response(
      JSON.stringify({
        success: true,
        imageAnalysis,
        results,
        totalSearched: products.length,
        searchedAt: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ai-image-search:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "خطأ غير متوقع" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
