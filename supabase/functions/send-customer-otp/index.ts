import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { getSupabaseAdminClient } from '../_shared/supabase.ts';


// نظام موحد لمعالجة أرقام الهواتف
interface PhoneFormats {
  e164: string;
  national: string;
  sanitized: string;
}

function normalizePhone(phone: string): PhoneFormats {
  const digits = phone.replace(/\D/g, '');

  if (!digits) {
    return { e164: '', national: '', sanitized: '' };
  }

  let e164: string;
  let national: string;

  if (digits.startsWith('966')) {
    e164 = `+${digits}`;
    national = `0${digits.slice(3)}`;
  } else if (digits.startsWith('0')) {
    const core = digits.slice(1);
    e164 = `+966${core}`;
    national = digits;
  } else if (digits.startsWith('5') && digits.length === 9) {
    e164 = `+966${digits}`;
    national = `0${digits}`;
  } else if (phone.startsWith('+')) {
    e164 = phone;
    national = digits.startsWith('966') ? `0${digits.slice(3)}` : digits;
  } else {
    e164 = digits.startsWith('+') ? digits : `+${digits}`;
    national = digits;
  }

  return {
    e164,
    national,
    sanitized: e164.replace(/\D/g, ''),
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    // استخدام Supabase Admin Client المشترك
    const supabase = getSupabaseAdminClient();

    const { phone, storeId } = await req.json();

    if (!phone) {
      return new Response(
        JSON.stringify({ success: false, error: 'رقم الجوال مطلوب' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!storeId) {
      return new Response(
        JSON.stringify({ success: false, error: 'معرف المتجر مطلوب' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // توحيد تنسيق رقم الهاتف
    const phoneFormats = normalizePhone(phone);
    const normalizedPhone = phoneFormats.e164;

    console.log('Sending customer OTP to:', normalizedPhone, 'for store:', storeId);

    // التحقق من آخر محاولة إرسال (cooldown: 60 ثانية)
    const { data: recentOtp } = await supabase
      .from('customer_otp_sessions')
      .select('created_at')
      .eq('phone', normalizedPhone)
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentOtp) {
      const timeSinceLastOtp = Date.now() - new Date(recentOtp.created_at).getTime();
      if (timeSinceLastOtp < 60000) { // 60 ثانية
        const waitTime = Math.ceil((60000 - timeSinceLastOtp) / 1000);
        console.log('Cooldown active, wait time:', waitTime, 'seconds');
        // نرجع 200 مع success: false لتجنب خطأ Edge Function non-2xx
        return new Response(
          JSON.stringify({
            success: false,
            error: `الرجاء الانتظار ${waitTime} ثانية قبل طلب رمز جديد`
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // إلغاء OTPs القديمة غير المحققة لنفس الرقم والمتجر
    await supabase
      .from('customer_otp_sessions')
      .update({ verified: true })
      .eq('phone', normalizedPhone)
      .eq('store_id', storeId)
      .eq('verified', false);

    // إرسال OTP عبر Prelude - سيولد الكود تلقائياً
    const preludeApiKey = Deno.env.get('PRELUDE_API_KEY');
    const isDevelopment = Deno.env.get('DISABLE_PHONE_VERIFICATION') === 'true';

    // في بيئة التطوير، نتخطى إرسال الرسالة ونحفظ OTP وهمي
    if (isDevelopment) {
      console.log('🔓 Development mode: Phone verification disabled, creating mock OTP session');

      // حفظ جلسة OTP وهمية
      const { data: otpData, error: otpError } = await supabase
        .from('customer_otp_sessions')
        .insert({
          phone: normalizedPhone,
          store_id: storeId,
          otp_code: 'DEV_MODE_123456', // رمز وهمي للتطوير
          verified: false,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 دقائق
          attempts: 0
        })
        .select()
        .single();

      if (otpError) {
        console.error('Database error:', otpError);
        throw new Error('فشل في حفظ جلسة التحقق');
      }

      console.log('Mock OTP session created for development:', otpData.id);

      return new Response(
        JSON.stringify({
          success: true,
          message: '🔓 وضع التطوير: يمكنك استخدام أي رمز للتحقق',
          dev_mode: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // في بيئة الإنتاج، نرسل OTP حقيقي عبر Prelude
    if (!preludeApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'خدمة إرسال الرسائل غير مفعلة' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      const preludeUrl = 'https://api.prelude.dev/v2/verification';

      console.log('Sending customer OTP via Prelude to:', normalizedPhone);

      // إرسال طلب لـ Prelude - سيولد ويرسل الكود تلقائياً
      const preludeResponse = await fetch(preludeUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${preludeApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target: {
            type: "phone_number",
            value: normalizedPhone
          },
          language: 'ar'
        }),
      });

      if (!preludeResponse.ok) {
        const errorText = await preludeResponse.text();
        console.error('Prelude error response:', errorText);
        throw new Error('فشل في إرسال رمز التحقق عبر Prelude');
      }

      const preludeData = await preludeResponse.json();
      console.log('Customer OTP sent successfully via Prelude:', preludeData);

      // التحقق من حالة الحظر
      if (preludeData.status === 'blocked') {
        console.error('Prelude blocked due to:', preludeData.reason);
        throw new Error('تم حظر إرسال الرسائل لهذا الرقم مؤقتاً');
      }

      // حفظ verification_id من Prelude في قاعدة البيانات
      const { data: otpData, error: otpError } = await supabase
        .from('customer_otp_sessions')
        .insert({
          phone: normalizedPhone,
          store_id: storeId,
          otp_code: preludeData.id, // نحفظ verification_id بدلاً من الكود
          verified: false,
          expires_at: new Date(Date.now() + 2 * 60 * 1000).toISOString(), // دقيقتان للأمان
          attempts: 0
        })
        .select()
        .single();

      if (otpError) {
        console.error('Database error:', otpError);
        throw new Error('فشل في حفظ جلسة التحقق');
      }

      console.log('Customer OTP session saved to database:', otpData.id);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'تم إرسال رمز التحقق بنجاح عبر رسالة نصية'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (preludeError) {
      console.error('Error sending customer OTP via Prelude:', preludeError);
      const errorMsg = preludeError instanceof Error ? preludeError.message : 'فشل في إرسال رمز التحقق';

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMsg
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error in send-customer-otp:', error);
    const errorMessage = error instanceof Error ? error.message : 'خطأ في الخادم';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
