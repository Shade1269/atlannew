import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

/**
 * 🎨 AI Image Editor - تعديل الصور بالذكاء الاصطناعي
 *
 * تعديل صور المنتجات: إزالة الخلفية، تحسين الجودة، إضافة تأثيرات
 */

interface ImageEditRequest {
  imageUrl: string;
  action: 'remove-bg' | 'enhance' | 'resize' | 'add-text' | 'style-transfer' | 'upscale' | 'retouch';
  options?: {
    // لإزالة الخلفية
    newBackground?: string; // 'white' | 'transparent' | 'gradient' | custom color

    // لإضافة نص
    text?: string;
    textPosition?: 'top' | 'bottom' | 'center';
    textColor?: string;

    // لتغيير الحجم
    width?: number;
    height?: number;

    // لنقل الستايل
    styleReference?: string; // URL لصورة الستايل

    // للتحسين
    enhanceLevel?: 'light' | 'medium' | 'heavy';
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const request: ImageEditRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { imageUrl, action, options = {} } = request;

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "الرجاء إرفاق رابط الصورة" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // بناء prompt بناءً على العملية المطلوبة
    const actionPrompts: Record<string, string> = {
      'remove-bg': `Edit this product image:
1. Remove the background completely
2. Replace with ${options.newBackground || 'clean white'} background
3. Keep the product perfectly cut out with clean edges
4. Maintain shadows for natural look
5. Professional e-commerce style`,

      'enhance': `Enhance this product image:
1. Improve lighting and exposure
2. Increase sharpness and clarity
3. Fix color balance
4. Remove any dust or imperfections
5. Make colors more vibrant
Enhancement level: ${options.enhanceLevel || 'medium'}`,

      'resize': `Resize this image:
- Target size: ${options.width || 1024}x${options.height || 1024}
- Maintain aspect ratio
- Use AI upscaling if needed
- Keep maximum quality`,

      'add-text': `Add promotional text to this image:
- Text: "${options.text || 'عرض خاص'}"
- Position: ${options.textPosition || 'bottom'}
- Color: ${options.textColor || 'white with shadow'}
- Style: Modern, clean, readable
- Arabic text support required`,

      'style-transfer': `Apply artistic style to this product image:
- Style reference: ${options.styleReference || 'modern minimalist'}
- Keep product recognizable
- Professional commercial look
- Blend style naturally`,

      'upscale': `Upscale this image:
- Increase resolution 4x
- Use AI super-resolution
- Preserve all details
- Remove artifacts
- Sharpen edges`,

      'retouch': `Professional product retouching:
1. Remove any scratches or dust
2. Fix reflections
3. Color correction
4. Shadow enhancement
5. Professional studio quality`
    };

    const editPrompt = actionPrompts[action] || actionPrompts['enhance'];

    console.log(`Processing image: ${action}`);

    // استخدام Gemini لتحليل الصورة وتوليد نسخة معدلة
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: [
              {
                type: "text",
                text: editPrompt
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        modalities: ["image", "text"]
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
    const editedImageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const description = data.choices?.[0]?.message?.content;

    console.log("Image processed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        originalImage: imageUrl,
        editedImage: editedImageUrl,
        action,
        description,
        options,
        // نصائح إضافية
        tips: getEditingTips(action)
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ai-image-editor:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "خطأ غير متوقع" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * نصائح لتحسين نتائج التعديل
 */
function getEditingTips(action: string): string[] {
  const tips: Record<string, string[]> = {
    'remove-bg': [
      'استخدم صورة عالية الجودة للحصول على قص أفضل',
      'الخلفيات البيضاء تعمل بشكل أفضل للمنتجات',
      'أضف ظل خفيف للمنتج ليبدو طبيعياً'
    ],
    'enhance': [
      'التحسين المعتدل يحافظ على الطبيعية',
      'تجنب التحسين المفرط لصور المنتجات',
      'تحقق من دقة الألوان بعد التحسين'
    ],
    'add-text': [
      'استخدم خطوط واضحة وكبيرة',
      'تجنب وضع النص على تفاصيل المنتج',
      'أضف ظل للنص لتحسين القراءة'
    ],
    'upscale': [
      'أفضل نتائج مع صور 512px أو أكبر',
      'قد تظهر بعض التفاصيل الاصطناعية',
      'مناسب للطباعة والعرض الكبير'
    ]
  };

  return tips[action] || ['استخدم صور عالية الجودة للحصول على أفضل النتائج'];
}
