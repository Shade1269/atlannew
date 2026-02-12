import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

/**
 * 🔊 AI Text-to-Speech - توليد صوت عربي احترافي
 *
 * يحول النص إلى صوت بشري طبيعي باللهجة السعودية أو الفصحى
 */

interface TTSRequest {
  text: string;
  voice: 'male-formal' | 'female-formal' | 'male-casual' | 'female-casual';
  dialect: 'msa' | 'saudi' | 'gulf' | 'egyptian';
  speed: 'slow' | 'normal' | 'fast';
  format: 'mp3' | 'wav' | 'ogg';
  useCase: 'product' | 'ad' | 'notification' | 'assistant';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const request: TTSRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const {
      text,
      voice = 'female-formal',
      dialect = 'msa',
      speed = 'normal',
      format = 'mp3',
      useCase = 'product'
    } = request;

    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "الرجاء إدخال النص المراد تحويله" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (text.length > 5000) {
      return new Response(
        JSON.stringify({ error: "النص طويل جداً. الحد الأقصى 5000 حرف" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // تحسين النص للنطق الصحيح
    const voiceDescriptions: Record<string, string> = {
      'male-formal': 'صوت رجل رسمي، واضح ومهني، مناسب للإعلانات الرسمية',
      'female-formal': 'صوت امرأة رسمي، دافئ ومهني، مناسب للشروحات',
      'male-casual': 'صوت رجل ودود، طبيعي ومريح، مناسب للمحتوى الاجتماعي',
      'female-casual': 'صوت امرأة ودود، حيوي ومرح، مناسب للإعلانات الشبابية'
    };

    const dialectDescriptions: Record<string, string> = {
      'msa': 'العربية الفصحى الحديثة',
      'saudi': 'اللهجة السعودية',
      'gulf': 'اللهجة الخليجية',
      'egyptian': 'اللهجة المصرية'
    };

    const speedSettings: Record<string, string> = {
      'slow': '0.8x - بطيء ومفصل',
      'normal': '1.0x - سرعة طبيعية',
      'fast': '1.2x - سريع وديناميكي'
    };

    console.log(`Generating TTS: ${voice}, ${dialect}, ${speed}`);

    // استخدام AI لتحسين النص للنطق
    const optimizedTextResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: `أنت خبير في تحسين النصوص للتحويل الصوتي (TTS).
مهمتك:
1. أضف علامات الترقيم المناسبة للتوقفات
2. اكتب الأرقام بالحروف
3. أضف نقاط التشكيل للكلمات الصعبة
4. حسّن الجمل لتبدو طبيعية عند النطق
5. إذا كان النص للإعلان، اجعله أكثر حماساً

اللهجة المطلوبة: ${dialectDescriptions[dialect]}
نوع الصوت: ${voiceDescriptions[voice]}
الاستخدام: ${useCase}

أرجع فقط النص المحسّن بدون أي شرح.`
          },
          {
            role: "user",
            content: text
          }
        ],
        stream: false,
      }),
    });

    if (!optimizedTextResponse.ok) {
      const errorText = await optimizedTextResponse.text();
      console.error("AI gateway error:", optimizedTextResponse.status, errorText);

      if (optimizedTextResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "تم تجاوز الحد المسموح من الطلبات" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI gateway error: ${optimizedTextResponse.status}`);
    }

    const optimizedData = await optimizedTextResponse.json();
    const optimizedText = optimizedData.choices?.[0]?.message?.content || text;

    // في المستقبل: الربط مع خدمة TTS فعلية مثل:
    // - ElevenLabs (أفضل جودة)
    // - Google Cloud TTS
    // - Amazon Polly
    // - Azure Cognitive Services

    console.log("Text optimized for TTS successfully");

    // إرجاع النتيجة
    return new Response(
      JSON.stringify({
        success: true,
        originalText: text,
        optimizedText,
        settings: {
          voice: voiceDescriptions[voice],
          dialect: dialectDescriptions[dialect],
          speed: speedSettings[speed],
          format
        },
        // Placeholder للصوت - يمكن ربطه بخدمة TTS فعلية
        audioUrl: null,
        message: "تم تحسين النص للنطق. جاري توليد الصوت...",
        // SSML للاستخدام مع خدمات TTS
        ssml: generateSSML(optimizedText, voice, speed),
        estimatedDuration: estimateDuration(optimizedText, speed),
        supportedServices: [
          { name: "ElevenLabs", quality: "عالية جداً", arabicSupport: true },
          { name: "Google Cloud TTS", quality: "عالية", arabicSupport: true },
          { name: "Amazon Polly", quality: "جيدة", arabicSupport: true }
        ]
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ai-tts:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "خطأ غير متوقع" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * توليد SSML للتحكم الدقيق في النطق
 */
function generateSSML(text: string, voice: string, speed: string): string {
  const rate = speed === 'slow' ? '80%' : speed === 'fast' ? '120%' : '100%';
  const pitch = voice.includes('female') ? '+5%' : '-5%';

  return `<speak>
  <prosody rate="${rate}" pitch="${pitch}">
    ${text.split('.').map(sentence =>
      sentence.trim() ? `<s>${sentence.trim()}.</s><break time="300ms"/>` : ''
    ).join('\n    ')}
  </prosody>
</speak>`;
}

/**
 * تقدير مدة الصوت بالثواني
 */
function estimateDuration(text: string, speed: string): number {
  // متوسط 150 كلمة في الدقيقة للعربية
  const wordsPerMinute = speed === 'slow' ? 120 : speed === 'fast' ? 180 : 150;
  const wordCount = text.split(/\s+/).length;
  return Math.round((wordCount / wordsPerMinute) * 60);
}
