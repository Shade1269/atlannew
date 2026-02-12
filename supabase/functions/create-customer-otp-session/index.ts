import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { store_id, phone } = await req.json()

    if (!store_id || !phone) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'معرف المتجر ورقم الجوال مطلوبان' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // تنظيف رقم الجوال
    const cleanPhone = phone.replace(/\D/g, '')
    
    if (cleanPhone.length < 10) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'رقم جوال غير صحيح' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // التحقق من وجود وحالة المتجر
    const { data: store, error: storeError } = await supabaseClient
      .from('affiliate_stores')
      .select('id, is_active')
      .eq('id', store_id)
      .eq('is_active', true)
      .single()

    if (storeError || !store) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'المتجر غير موجود أو غير نشط' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // حذف جلسات OTP منتهية الصلاحية للرقم والمتجر
    await supabaseClient
      .from('customer_otp_sessions')
      .delete()
      .eq('phone', cleanPhone)
      .eq('store_id', store_id)
      .lt('expires_at', new Date().toISOString())

    // إنشاء كود OTP (6 أرقام عشوائية)
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    
    // إنشاء جلسة OTP جديدة
    const { data: otpSession, error: otpError } = await supabaseClient
      .from('customer_otp_sessions')
      .insert({
        store_id: store_id,
        phone: cleanPhone,
        otp_code: otpCode,
        verified: false,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 دقائق
        attempts: 0,
        session_data: { created_via: 'storefront' }
      })
      .select('id')
      .single()

    if (otpError) {
      console.error('Error creating OTP session:', otpError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'فشل في إنشاء جلسة التحقق' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // في بيئة التطوير، إظهار الكود في السجلات
    console.log(`OTP Code for ${cleanPhone} at store ${store_id}: ${otpCode}`)
    
    // في الإنتاج، يمكن هنا إرسال SMS حقيقي عبر خدمة مثل Twilio

    return new Response(
      JSON.stringify({ 
        success: true,
        sessionId: otpSession.id,
        message: `تم إرسال كود التحقق إلى ${cleanPhone}`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in create-customer-otp-session:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'خطأ في الخادم' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})