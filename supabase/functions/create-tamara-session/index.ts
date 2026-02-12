import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { getSupabaseAdminClient } from '../_shared/supabase.ts';

interface TamaraSessionRequest {
  order_id: string;
  total_amount: number;
  customer: {
    first_name: string;
    last_name: string;
    phone_number: string;
    email: string;
  };
  shipping_address: {
    first_name: string;
    last_name: string;
    phone_number: string;
    country_code: string;
    city: string;
  };
  billing_address: {
    first_name: string;
    last_name: string;
    phone_number: string;
    country_code: string;
    city: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    // الحصول على بيانات الاعتماد من المتغيرات البيئية
    const TAMARA_API_TOKEN = Deno.env.get('TAMARA_API_TOKEN');
    const TAMARA_API_URL = Deno.env.get('TAMARA_API_URL') || 'https://api-sandbox.tamara.co'; // sandbox للتطوير
    const TAMARA_NOTIFICATION_URL = Deno.env.get('TAMARA_NOTIFICATION_URL');

    if (!TAMARA_API_TOKEN) {
      throw new Error('Tamara API token not configured');
    }

    const requestData: TamaraSessionRequest = await req.json();

    console.log('Creating Tamara session for order:', requestData.order_id);

    // إنشاء رابط النجاح والفشل والإلغاء
    const origin = req.headers.get('origin') || 'https://yourdomain.com';
    const successUrl = `${origin}/order/confirmation?orderId=${requestData.order_id}&payment=tamara&status=success`;
    const failureUrl = `${origin}/checkout?orderId=${requestData.order_id}&payment=tamara&status=failure`;
    const cancelUrl = `${origin}/checkout?orderId=${requestData.order_id}&payment=tamara&status=cancel`;

    // إعداد payload لـ Tamara API
    const tamaraPayload = {
      order_reference_id: requestData.order_id,
      total_amount: {
        amount: requestData.total_amount,
        currency: 'SAR'
      },
      description: `Order #${requestData.order_id}`,
      country_code: 'SA',
      payment_type: 'PAY_BY_INSTALMENTS', // أو 'PAY_BY_LATER'
      instalments: 3, // عدد الأقساط (3 أو 4)
      locale: 'ar_SA',
      merchant_url: {
        success: successUrl,
        failure: failureUrl,
        cancel: cancelUrl,
        notification: TAMARA_NOTIFICATION_URL || `${origin}/api/tamara-webhook`
      },
      customer: {
        first_name: requestData.customer.first_name,
        last_name: requestData.customer.last_name,
        phone_number: requestData.customer.phone_number,
        email: requestData.customer.email
      },
      shipping_address: {
        first_name: requestData.shipping_address.first_name,
        last_name: requestData.shipping_address.last_name,
        line1: 'Default Address', // يمكن تمريرها من الطلب
        city: requestData.shipping_address.city,
        country_code: requestData.shipping_address.country_code,
        phone_number: requestData.shipping_address.phone_number
      },
      billing_address: {
        first_name: requestData.billing_address.first_name,
        last_name: requestData.billing_address.last_name,
        line1: 'Default Address',
        city: requestData.billing_address.city,
        country_code: requestData.billing_address.country_code,
        phone_number: requestData.billing_address.phone_number
      },
      items: [
        {
          reference_id: requestData.order_id,
          type: 'Digital', // أو 'Physical'
          name: `Order ${requestData.order_id}`,
          sku: requestData.order_id,
          quantity: 1,
          total_amount: {
            amount: requestData.total_amount,
            currency: 'SAR'
          }
        }
      ],
      discount: {
        amount: 0,
        currency: 'SAR'
      },
      tax_amount: {
        amount: 0,
        currency: 'SAR'
      },
      shipping_amount: {
        amount: 0,
        currency: 'SAR'
      }
    };

    console.log('Calling Tamara API with payload:', JSON.stringify(tamaraPayload, null, 2));

    // استدعاء Tamara API لإنشاء checkout session
    const tamaraResponse = await fetch(`${TAMARA_API_URL}/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TAMARA_API_TOKEN}`,
      },
      body: JSON.stringify(tamaraPayload),
    });

    const tamaraData = await tamaraResponse.json();

    console.log('Tamara API response status:', tamaraResponse.status);
    console.log('Tamara API response:', JSON.stringify(tamaraData, null, 2));

    if (!tamaraResponse.ok) {
      const errorMessage = tamaraData?.message || tamaraData?.error || 'Failed to create Tamara session';
      throw new Error(errorMessage);
    }

    if (!tamaraData.checkout_url && !tamaraData.checkout_id) {
      throw new Error('No checkout URL or ID returned from Tamara');
    }

    // استخدام Supabase Admin Client المشترك
    const supabase = getSupabaseAdminClient();

    // تحديث حالة الطلب
    await supabase
      .from('orders')
      .update({
        payment_status: 'PENDING',
        payment_method: 'TAMARA',
        updated_at: new Date().toISOString()
      })
      .eq('id', requestData.order_id);

    // حفظ معلومات جلسة الدفع
    await supabase
      .from('payment_transactions')
      .insert({
        order_id: requestData.order_id,
        gateway_name: 'tamara',
        transaction_id: tamaraData.checkout_id || tamaraData.order_id,
        amount_sar: requestData.total_amount,
        currency: 'SAR',
        status: 'PENDING',
        gateway_response: tamaraData,
        created_at: new Date().toISOString()
      });

    // إرجاع رابط الدفع
    return new Response(
      JSON.stringify({
        success: true,
        checkout_url: tamaraData.checkout_url,
        checkout_id: tamaraData.checkout_id,
        order_id: tamaraData.order_id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error creating Tamara session:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

