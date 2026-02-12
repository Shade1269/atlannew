import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

/**
 * 🎥 AI Video Generator - توليد فيديو للمنتجات
 *
 * يستخدم نماذج AI لتوليد فيديوهات تسويقية احترافية
 */

interface VideoRequest {
  productName: string;
  productDescription: string;
  productImage?: string;
  style: 'showcase' | 'promotional' | 'tutorial' | 'story' | 'social';
  duration: '15s' | '30s' | '60s';
  language: 'ar' | 'en';
  includeVoiceover?: boolean;
  includeMusic?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const request: VideoRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const {
      productName,
      productDescription,
      productImage,
      style = 'showcase',
      duration = '30s',
      language = 'ar',
      includeVoiceover = true,
      includeMusic = true
    } = request;

    if (!productName) {
      return new Response(
        JSON.stringify({ error: "الرجاء إدخال اسم المنتج" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // بناء prompt لتوليد الفيديو
    const stylePrompts: Record<string, string> = {
      showcase: `Create a professional product showcase video for "${productName}".
        Show the product from multiple angles with smooth camera movements.
        Highlight key features with elegant text overlays.
        Use clean white or gradient background.
        Style: Modern, minimalist, premium feel.`,

      promotional: `Create an exciting promotional video for "${productName}".
        Start with attention-grabbing hook.
        Show product benefits with dynamic transitions.
        Include call-to-action at the end.
        Style: Energetic, bold colors, fast-paced.`,

      tutorial: `Create a how-to tutorial video for "${productName}".
        Show step-by-step usage instructions.
        Use clear demonstrations and annotations.
        Include helpful tips and tricks.
        Style: Educational, clear, user-friendly.`,

      story: `Create a storytelling video for "${productName}".
        Show the product in real-life scenarios.
        Create emotional connection with viewers.
        Tell a compelling narrative around the product.
        Style: Cinematic, emotional, lifestyle-focused.`,

      social: `Create a viral social media video for "${productName}".
        Optimized for vertical format (9:16).
        Quick, attention-grabbing content.
        Trendy effects and transitions.
        Style: Fun, engaging, shareable.`
    };

    const videoPrompt = `${stylePrompts[style]}

Product Details:
- Name: ${productName}
- Description: ${productDescription}
- Duration: ${duration}
- Language: ${language === 'ar' ? 'Arabic' : 'English'}
${includeVoiceover ? '- Include professional voiceover' : ''}
${includeMusic ? '- Include background music' : ''}
${productImage ? `- Reference image: ${productImage}` : ''}

Generate a high-quality, professional video that will boost sales and engagement.`;

    console.log(`Generating ${style} video for: ${productName}`);

    // استخدام Gemini لتوليد script الفيديو أولاً
    const scriptResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: `أنت خبير في إنتاج الفيديوهات التسويقية. قم بإنشاء script تفصيلي لفيديو المنتج يتضمن:
1. المشاهد (scenes) بالتفصيل
2. النص الصوتي (voiceover script) ${language === 'ar' ? 'بالعربية' : 'بالإنجليزية'}
3. التوجيهات البصرية
4. الموسيقى المقترحة
5. النصوص على الشاشة

اجعل المحتوى جذاباً ومقنعاً للمشتري.`
          },
          {
            role: "user",
            content: videoPrompt
          }
        ],
        stream: false,
      }),
    });

    if (!scriptResponse.ok) {
      const errorText = await scriptResponse.text();
      console.error("AI gateway error:", scriptResponse.status, errorText);

      if (scriptResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "تم تجاوز الحد المسموح من الطلبات" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI gateway error: ${scriptResponse.status}`);
    }

    const scriptData = await scriptResponse.json();
    const videoScript = scriptData.choices?.[0]?.message?.content || "";

    // توليد صور مصغرة للفيديو (storyboard)
    const thumbnailResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: `Create a professional video thumbnail for a product video:
Product: ${productName}
Style: ${style}
Make it eye-catching and click-worthy with modern design.`
          }
        ],
        modalities: ["image", "text"]
      }),
    });

    let thumbnailUrl = null;
    if (thumbnailResponse.ok) {
      const thumbnailData = await thumbnailResponse.json();
      thumbnailUrl = thumbnailData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    }

    console.log("Video script and thumbnail generated successfully");

    // إرجاع النتيجة
    return new Response(
      JSON.stringify({
        success: true,
        videoScript,
        thumbnail: thumbnailUrl,
        settings: {
          style,
          duration,
          language,
          includeVoiceover,
          includeMusic
        },
        // في المستقبل: يمكن ربطه بخدمة توليد فيديو فعلية مثل RunwayML أو Pika
        message: "تم إنشاء script الفيديو بنجاح. يمكنك استخدامه لإنتاج الفيديو.",
        nextSteps: [
          "استخدم Script لتوجيه فريق الإنتاج",
          "أو استخدم أدوات مثل RunwayML لتوليد الفيديو",
          "أو ارفعه لمحرر فيديو بقوالب جاهزة"
        ]
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ai-video-generator:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "خطأ غير متوقع" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
