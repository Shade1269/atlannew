import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { getSupabaseAdminClient } from '../_shared/supabase.ts';

interface CallbackData {
  orderId: string;
  sessionId: string;
  status: string;
  amount: number;
  currency: string;
  paymentId?: string;
  signature?: string;
  detailedResponseCode?: string;
  detailedResponseMessage?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    // استخدام Supabase Admin Client المشترك
    const supabase = getSupabaseAdminClient();

    const callbackData: CallbackData = await req.json();

    console.log('Processing Geidea callback:', callbackData);

    const { orderId, status, sessionId, paymentId, detailedResponseCode, detailedResponseMessage } = callbackData;

    if (!orderId) {
      throw new Error('Order ID is required');
    }

    // تحديد حالة الطلب بناءً على نتيجة الدفع
    let paymentStatus: string;
    let orderStatus: string;

    if (status === 'SUCCESS' || status === 'success') {
      paymentStatus = 'COMPLETED';
      orderStatus = 'CONFIRMED';
    } else if (status === 'FAILED' || status === 'failed') {
      paymentStatus = 'FAILED';
      orderStatus = 'CANCELED';
    } else {
      paymentStatus = 'PENDING';
      orderStatus = 'PENDING';
    }

    // البحث عن الطلب في ecommerce_orders باستخدام ID مباشرة
    const { data: order, error: orderError } = await supabase
      .from('ecommerce_orders')
      .select('id, order_number, total_amount_sar, payment_status, status')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderId, orderError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Order not found',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      );
    }

    // تحديث حالة الطلب في ecommerce_orders
    const { error: updateOrderError } = await supabase
      .from('ecommerce_orders')
      .update({
        payment_status: paymentStatus,
        status: orderStatus,
        payment_method: 'CREDIT_CARD',
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    if (updateOrderError) {
      console.error('Error updating order:', updateOrderError);
      throw updateOrderError;
    }

    // تحديث order_hub إذا كان موجود
    const { data: hubOrder, error: updateHubError } = await supabase
      .from('order_hub')
      .update({
        status: orderStatus === 'CONFIRMED' ? 'CONFIRMED' : orderStatus,
        payment_status: paymentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('source_order_id', order.id)
      .eq('source', 'ecommerce')
      .select('id')
      .single();

    if (updateHubError) {
      console.log('Note: order_hub update failed (may not exist):', updateHubError);
    }

    // تسجيل معلومات الدفع
    const paymentRecord = {
      order_id: order.id,
      session_id: sessionId,
      payment_id: paymentId,
      status: paymentStatus,
      amount_sar: order.total_amount_sar,
      response_code: detailedResponseCode,
      response_message: detailedResponseMessage,
      payment_gateway: 'geidea',
      created_at: new Date().toISOString(),
    };

    console.log('Payment processed successfully:', paymentRecord);

    // ✅ إرسال الطلب إلى Zoho Flow لإنشاء الفاتورة بعد الدفع الناجح
    if (paymentStatus === 'COMPLETED' && hubOrder?.id) {
      console.log('Sending order to Zoho Flow for invoice creation:', hubOrder.id);

      try {
        const zohoResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-order-to-zoho-flow`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({ order_id: hubOrder.id }),
        });

        const zohoResult = await zohoResponse.json();
        console.log('Zoho Flow response:', zohoResult);

        if (!zohoResponse.ok) {
          console.error('Failed to send to Zoho Flow:', zohoResult);
        } else {
          console.log('✅ Order sent to Zoho Flow successfully');
        }
      } catch (zohoError) {
        console.error('Error calling Zoho Flow function:', zohoError);
        // لا نوقف العملية إذا فشل إرسال الفاتورة
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderId: order.order_number,
        status: paymentStatus,
        orderStatus: orderStatus,
        message: paymentStatus === 'COMPLETED' ? 'تم الدفع بنجاح' : 'فشل الدفع',
        invoiceSent: paymentStatus === 'COMPLETED',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error processing Geidea callback:', error);
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
