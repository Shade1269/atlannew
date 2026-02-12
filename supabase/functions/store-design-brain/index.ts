import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { getSupabaseAdminClient } from '../_shared/supabase.ts';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

// Design presets for quick styling
const designPresets = {
  minimal: {
    colors: { primary: '0 0% 9%', secondary: '0 0% 96%', accent: '0 0% 45%' },
    style: 'clean lines, lots of whitespace, simple typography'
  },
  luxury: {
    colors: { primary: '45 30% 20%', secondary: '40 20% 95%', accent: '45 80% 50%' },
    style: 'gold accents, elegant fonts, premium feel'
  },
  playful: {
    colors: { primary: '330 80% 60%', secondary: '200 80% 95%', accent: '45 90% 60%' },
    style: 'bright colors, rounded corners, fun typography'
  },
  modern: {
    colors: { primary: '220 90% 50%', secondary: '220 20% 97%', accent: '160 80% 45%' },
    style: 'gradients, shadows, contemporary design'
  },
  elegant: {
    colors: { primary: '340 30% 35%', secondary: '20 60% 98%', accent: '40 70% 55%' },
    style: 'soft tones, refined typography, feminine touch'
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const { message, store_id, conversation_history = [] } = await req.json();

    if (!store_id) {
      throw new Error('store_id is required');
    }

    // استخدام Supabase Admin Client المشترك
    const supabase = getSupabaseAdminClient();

    // Get current store settings
    const { data: storeData } = await supabase
      .from('affiliate_stores')
      .select('*, affiliate_store_settings(*), affiliate_store_themes(*)')
      .eq('id', store_id)
      .single();

    // Build context for AI
    const systemPrompt = `أنت مصمم متاجر ذكي. مهمتك مساعدة المسوقات في تصميم متاجرهن.

**معلومات المتجر الحالي:**
- اسم المتجر: ${storeData?.store_name || 'غير محدد'}
- الثيم الحالي: ${storeData?.theme || 'default'}

**قدراتك:**
1. تغيير الألوان (الأساسي، الثانوي، التمييز)
2. تغيير نمط العرض (minimal, luxury, playful, modern, elegant)
3. تعديل البنر الرئيسي (العنوان، الوصف، زر CTA)
4. تغيير طريقة عرض المنتجات
5. إضافة/تعديل أقسام الصفحة

**تنسيقات الألوان المتاحة:**
- minimal: أبيض وأسود، نظيف
- luxury: ذهبي وبني، فاخر
- playful: ألوان زاهية، مرح
- modern: أزرق وأخضر، عصري
- elegant: وردي وذهبي، أنثوي

**عند فهم طلب التصميم، أرجع JSON بالتنسيق التالي:**
{
  "understood": true,
  "changes": {
    "theme_style": "اسم النمط أو null",
    "colors": { "primary": "hsl value", "secondary": "hsl value", "accent": "hsl value" } أو null,
    "hero": { "title": "العنوان", "subtitle": "الوصف", "cta_text": "نص الزر", "cta_color": "اللون" } أو null,
    "layout": { "product_display": "grid/list", "columns": 3/4 } أو null
  },
  "response": "رسالة للمستخدم تشرح التغييرات"
}

إذا لم تفهم الطلب أو كان سؤالاً عاماً:
{
  "understood": false,
  "response": "ردك على السؤال أو طلب توضيح"
}

تحدث دائماً بالعربية بشكل ودود ومهني.`;

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversation_history.map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content
          })),
          { role: 'user', content: message }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      throw new Error('فشل في الاتصال بالذكاء الاصطناعي');
    }

    const aiData = await aiResponse.json();
    const aiMessage = aiData.choices[0]?.message?.content || '';

    console.log('AI Response:', aiMessage);

    // Try to parse AI response as JSON
    let parsedResponse: any = null;
    let appliedChanges: string[] = [];

    try {
      // Extract JSON from response (might be wrapped in markdown)
      const jsonMatch = aiMessage.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.log('Could not parse JSON, treating as text response');
    }

    // Apply changes if understood
    if (parsedResponse?.understood && parsedResponse?.changes) {
      const changes = parsedResponse.changes;

      // Update theme/colors
      if (changes.theme_style || changes.colors) {
        const preset = changes.theme_style ? designPresets[changes.theme_style as keyof typeof designPresets] : null;
        const colors = changes.colors || preset?.colors;

        if (colors) {
          const themeConfig = {
            custom_config: {
              colors: colors,
              style: changes.theme_style || 'custom'
            }
          };

          // Check if theme exists
          const { data: existingTheme } = await supabase
            .from('affiliate_store_themes')
            .select('id')
            .eq('store_id', store_id)
            .single();

          if (existingTheme) {
            await supabase
              .from('affiliate_store_themes')
              .update(themeConfig)
              .eq('store_id', store_id);
          } else {
            await supabase
              .from('affiliate_store_themes')
              .insert({ store_id, ...themeConfig, is_active: true });
          }

          appliedChanges.push('تم تحديث الألوان والنمط');
        }
      }

      // Update hero section
      if (changes.hero) {
        const heroUpdate: any = {};
        if (changes.hero.title) heroUpdate.hero_title = changes.hero.title;
        if (changes.hero.subtitle) heroUpdate.hero_subtitle = changes.hero.subtitle;
        if (changes.hero.description) heroUpdate.hero_description = changes.hero.description;
        if (changes.hero.cta_text) heroUpdate.hero_cta_text = changes.hero.cta_text;
        if (changes.hero.cta_color) heroUpdate.hero_cta_color = changes.hero.cta_color;

        // Check if settings exist
        const { data: existingSettings } = await supabase
          .from('affiliate_store_settings')
          .select('id')
          .eq('store_id', store_id)
          .single();

        if (existingSettings) {
          await supabase
            .from('affiliate_store_settings')
            .update(heroUpdate)
            .eq('store_id', store_id);
        } else {
          await supabase
            .from('affiliate_store_settings')
            .insert({ store_id, ...heroUpdate });
        }

        appliedChanges.push('تم تحديث البنر الرئيسي');
      }

      // Update layout settings
      if (changes.layout) {
        const { data: existingSettings } = await supabase
          .from('affiliate_store_settings')
          .select('id')
          .eq('store_id', store_id)
          .single();

        const layoutConfig = {
          category_display_style: changes.layout.product_display || 'grid'
        };

        if (existingSettings) {
          await supabase
            .from('affiliate_store_settings')
            .update(layoutConfig)
            .eq('store_id', store_id);
        } else {
          await supabase
            .from('affiliate_store_settings')
            .insert({ store_id, ...layoutConfig });
        }

        appliedChanges.push('تم تحديث طريقة العرض');
      }
    }

    const responseText = parsedResponse?.response || aiMessage;

    return new Response(JSON.stringify({
      success: true,
      message: responseText,
      changes_applied: appliedChanges,
      understood: parsedResponse?.understood || false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Store design brain error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'خطأ غير معروف'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
