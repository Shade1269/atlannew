import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { getSupabaseAdminClient } from '../_shared/supabase.ts';

/**
 * ✍️ Content Automation System - أتمتة المحتوى
 * 
 * الميزات:
 * 1. توليد أوصاف المنتجات تلقائياً
 * 2. إنشاء منشورات سوشيال ميديا
 * 3. كتابة رسائل البريد التسويقية
 * 4. إنشاء إعلانات مخصصة
 * 5. توليد محتوى SEO
 */

interface ContentRequest {
  type: 'product_description' | 'social_post' | 'email_campaign' | 'ad_copy' | 'seo_content' | 'bulk_products';
  context: Record<string, any>;
  language?: 'ar' | 'en';
  tone?: 'professional' | 'friendly' | 'exciting' | 'luxury';
  platform?: 'instagram' | 'twitter' | 'facebook' | 'tiktok' | 'snapchat';
  product_ids?: string[];
  store_id?: string;
}

interface GeneratedContent {
  id: string;
  type: string;
  content: string;
  metadata?: Record<string, any>;
  hashtags?: string[];
  keywords?: string[];
  call_to_action?: string;
}

const generateId = () => crypto.randomUUID().slice(0, 8);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const {
      type,
      context,
      language = 'ar',
      tone = 'professional',
      platform,
      product_ids,
      store_id
    }: ContentRequest = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // استخدام Supabase Admin Client المشترك
    const supabase = getSupabaseAdminClient();
    const now = new Date();
    const results: GeneratedContent[] = [];

    // تحديد النبرة
    const toneDescriptions: Record<string, string> = {
      professional: 'محترفة ورسمية',
      friendly: 'ودية وقريبة من القلب',
      exciting: 'حماسية ومشوقة',
      luxury: 'فاخرة وراقية'
    };

    const toneInstruction = toneDescriptions[tone] || toneDescriptions.professional;

    // ============ PRODUCT DESCRIPTIONS ============
    if (type === 'product_description') {
      console.log("📝 Generating product description...");

      const product = context.product || context;

      const systemPrompt = `أنت كاتب محتوى محترف متخصص في أوصاف المنتجات التسويقية.
اكتب وصفاً ${toneInstruction} للمنتج يتضمن:
- مقدمة جذابة (جملة واحدة)
- 3-4 مميزات رئيسية
- فوائد للعميل
- دعوة للشراء

اجعل الوصف مختصراً (100-150 كلمة) ومقنعاً.`;

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
            { role: "user", content: `اكتب وصفاً للمنتج:\nاسم: ${product.name}\nالسعر: ${product.price} ريال\nالفئة: ${product.category || 'عام'}\nالوصف الحالي: ${product.current_description || 'لا يوجد'}` }
          ],
          stream: false,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';

        results.push({
          id: generateId(),
          type: 'product_description',
          content,
          metadata: { product_id: product.id, product_name: product.name },
          call_to_action: 'اطلب الآن!'
        });
      }
    }

    // ============ SOCIAL MEDIA POSTS ============
    if (type === 'social_post') {
      console.log("📱 Generating social media post...");

      const platformInstructions: Record<string, string> = {
        instagram: 'منشور انستقرام: استخدم إيموجي، 5-10 هاشتاقات، ودعوة للتفاعل',
        twitter: 'تغريدة قصيرة (280 حرف كحد أقصى)، 2-3 هاشتاقات',
        facebook: 'منشور فيسبوك: نص متوسط الطول مع سؤال تفاعلي',
        tiktok: 'نص قصير وحماسي مناسب لفيديو تيك توك',
        snapchat: 'نص قصير جداً وعصري للسناب'
      };

      const platformInstruction = platformInstructions[platform || 'instagram'];

      const systemPrompt = `أنت خبير سوشيال ميديا.
اكتب ${platformInstruction}.
النبرة: ${toneInstruction}
اجعل المحتوى جذاباً وقابلاً للمشاركة.`;

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
            { role: "user", content: `اكتب منشور عن:\n${context.topic || context.product?.name || 'المتجر'}\n\nالتفاصيل: ${JSON.stringify(context)}` }
          ],
          stream: false,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';

        // استخراج الهاشتاقات
        const hashtagRegex = /#[\u0600-\u06FFa-zA-Z0-9_]+/g;
        const hashtags = content.match(hashtagRegex) || [];

        results.push({
          id: generateId(),
          type: 'social_post',
          content,
          metadata: { platform },
          hashtags
        });
      }
    }

    // ============ EMAIL CAMPAIGNS ============
    if (type === 'email_campaign') {
      console.log("📧 Generating email campaign...");

      const campaignType = context.campaign_type || 'promotional';

      const systemPrompt = `أنت كاتب محتوى تسويقي محترف.
اكتب رسالة بريد إلكتروني ${toneInstruction} تتضمن:
1. عنوان جذاب (Subject Line) - سطر واحد
2. التحية
3. المحتوى الرئيسي (3-4 فقرات)
4. دعوة للإجراء (CTA) واضحة
5. التوقيع

نوع الحملة: ${campaignType}`;

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
            { role: "user", content: `اكتب رسالة تسويقية عن:\n${context.topic || 'عروض المتجر'}\n\nالهدف: ${context.goal || 'زيادة المبيعات'}\nالجمهور: ${context.audience || 'العملاء'}` }
          ],
          stream: false,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';

        // استخراج العنوان
        const lines = content.split('\n');
        const subjectLine = lines.find((l: string) => l.includes('عنوان') || l.includes('Subject'))?.replace(/.*[:]/g, '').trim() || lines[0];

        results.push({
          id: generateId(),
          type: 'email_campaign',
          content,
          metadata: {
            subject_line: subjectLine,
            campaign_type: campaignType
          },
          call_to_action: context.cta || 'تسوق الآن'
        });
      }
    }

    // ============ AD COPY ============
    if (type === 'ad_copy') {
      console.log("📢 Generating ad copy...");

      const adPlatform = context.ad_platform || 'general';

      const platformFormats: Record<string, string> = {
        google: 'إعلان Google: عنوان (30 حرف)، وصف (90 حرف)، و3 إضافات',
        facebook: 'إعلان Facebook: نص رئيسي، عنوان، ووصف الرابط',
        instagram: 'إعلان Instagram: نص قصير وجذاب مع إيموجي',
        snapchat: 'إعلان Snapchat: نص قصير جداً وعصري',
        general: 'إعلان عام: عنوان، وصف، ودعوة للإجراء'
      };

      const systemPrompt = `أنت كاتب إعلانات محترف.
اكتب ${platformFormats[adPlatform]}.
النبرة: ${toneInstruction}
اجعل الإعلان مقنعاً ويدفع للشراء.`;

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
            { role: "user", content: `اكتب إعلان لـ:\n${context.product?.name || context.topic || 'المتجر'}\n\nالعرض: ${context.offer || 'لا يوجد عرض محدد'}\nالجمهور المستهدف: ${context.target_audience || 'عام'}` }
          ],
          stream: false,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';

        results.push({
          id: generateId(),
          type: 'ad_copy',
          content,
          metadata: { platform: adPlatform },
          call_to_action: context.cta || 'اشترِ الآن'
        });
      }
    }

    // ============ SEO CONTENT ============
    if (type === 'seo_content') {
      console.log("🔍 Generating SEO content...");

      const systemPrompt = `أنت خبير SEO محترف.
قدم محتوى SEO يتضمن:
1. عنوان SEO (60 حرف كحد أقصى)
2. وصف Meta (160 حرف كحد أقصى)
3. 5-7 كلمات مفتاحية رئيسية
4. 5-7 كلمات مفتاحية طويلة الذيل (Long-tail)
5. اقتراحات للمحتوى

استخدم تنسيق JSON.`;

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
            { role: "user", content: `حلل وقدم SEO لـ:\n${context.page || context.product?.name || 'الصفحة الرئيسية'}\n\nالوصف: ${context.description || 'متجر إلكتروني'}` }
          ],
          stream: false,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';

        // محاولة استخراج الكلمات المفتاحية
        let keywords: string[] = [];
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            keywords = parsed.keywords || parsed.كلمات_مفتاحية || [];
          }
        } catch (e) {
          // استخراج الكلمات يدوياً
          const keywordMatches = content.match(/[-•]\s*([^\n]+)/g);
          keywords = keywordMatches?.map((k: string) => k.replace(/[-•]\s*/, '').trim()) || [];
        }

        results.push({
          id: generateId(),
          type: 'seo_content',
          content,
          keywords: keywords.slice(0, 10)
        });
      }
    }

    // ============ BULK PRODUCTS ============
    if (type === 'bulk_products' && product_ids && product_ids.length > 0) {
      console.log(`📦 Generating descriptions for ${product_ids.length} products...`);

      const { data: products } = await supabase
        .from('products')
        .select('id, name, price_sar, description')
        .in('id', product_ids.slice(0, 10)); // حد أقصى 10

      for (const product of products || []) {
        const systemPrompt = `اكتب وصفاً تسويقياً ${toneInstruction} للمنتج في 50-80 كلمة.
اجعله جذاباً ومقنعاً.`;

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
              { role: "user", content: `المنتج: ${product.name}\nالسعر: ${product.price_sar} ريال` }
            ],
            stream: false,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content || '';

          results.push({
            id: generateId(),
            type: 'bulk_product_description',
            content,
            metadata: { product_id: product.id, product_name: product.name }
          });
        }
      }
    }

    // حفظ المحتوى المولد
    if (results.length > 0) {
      await supabase.from('brain_memory').insert({
        memory_type: 'content_generation',
        title: `محتوى تلقائي - ${type}`,
        content: `تم توليد ${results.length} محتوى`,
        importance_score: 4,
        context: { results, type },
        tags: ['محتوى', 'أتمتة', type]
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: now.toISOString(),
        type,
        content: results,
        count: results.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Content Automation error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
