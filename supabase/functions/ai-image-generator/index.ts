import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const requestBody = await req.json();
    const { prompt, style = "professional", mode = "generate", sourceImage } = requestBody;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Processing image - Mode: ${mode}, Style: ${style}`);

    if (mode === "edit") {
      // Edit existing image
      if (!sourceImage) {
        return new Response(
          JSON.stringify({ error: "الرجاء رفع صورة للتعديل عليها" }), 
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!prompt) {
        return new Response(
          JSON.stringify({ error: "الرجاء إدخال التعديل المطلوب" }), 
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Editing image with prompt:", prompt);

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
                  text: prompt
                },
                {
                  type: "image_url",
                  image_url: {
                    url: sourceImage
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
      const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      const textResponse = data.choices?.[0]?.message?.content;

      if (!imageUrl) {
        throw new Error("لم يتم تعديل الصورة");
      }

      console.log("Image edited successfully");

      return new Response(
        JSON.stringify({ 
          imageUrl,
          description: textResponse,
          mode: "edit"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else {
      // Generate new image
      if (!prompt) {
        return new Response(
          JSON.stringify({ error: "الرجاء إدخال وصف للصورة" }), 
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Enhance prompt based on style
      let enhancedPrompt = prompt;
      switch (style) {
        case "professional":
          enhancedPrompt = `Professional product photography, clean white background, high quality, commercial style: ${prompt}`;
          break;
        case "lifestyle":
          enhancedPrompt = `Lifestyle product photography, natural setting, warm lighting, lifestyle context: ${prompt}`;
          break;
        case "minimal":
          enhancedPrompt = `Minimalist product image, simple clean design, modern aesthetic: ${prompt}`;
          break;
        case "banner":
          enhancedPrompt = `Professional marketing banner, eye-catching design, promotional style: ${prompt}`;
          break;
        case "social":
          enhancedPrompt = `Social media post design, engaging visual, modern style: ${prompt}`;
          break;
        default:
          enhancedPrompt = prompt;
      }

      console.log(`Generating image with style: ${style}`);

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
              content: enhancedPrompt
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
      const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      const textResponse = data.choices?.[0]?.message?.content;

      if (!imageUrl) {
        throw new Error("لم يتم توليد الصورة");
      }

      console.log("Image generated successfully");

      return new Response(
        JSON.stringify({ 
          imageUrl,
          description: textResponse,
          prompt: enhancedPrompt,
          mode: "generate"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error in ai-image-generator:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "خطأ غير متوقع" }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});