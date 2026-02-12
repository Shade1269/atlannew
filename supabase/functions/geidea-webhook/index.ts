import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { getSupabaseAdminClient } from '../_shared/supabase.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    // استخدام Supabase Admin Client المشترك
    const supabaseClient = getSupabaseAdminClient();

    const webhookData = await req.json();

    console.log('Geidea webhook received:', JSON.stringify(webhookData, null, 2));

    // استخراج معلومات الدفع من Geidea
    const paymentStatus = webhookData.responseCode === '000' ? 'COMPLETED' : 'FAILED';
    const orderId = webhookData.merchantReferenceId?.split('_')[1]; // ORDER_{orderId}_{timestamp}
    const transactionId = webhookData.orderId; // Geidea transaction ID
    const amount = webhookData.amount;

    if (!orderId) {
      throw new Error('Order ID not found in webhook data');
    }

    console.log('Processing payment for order:', orderId, 'Status:', paymentStatus);

    if (paymentStatus === 'COMPLETED') {
      // 1. تحديث حالة الطلب إلى COMPLETED
      const { data: order, error: orderError } = await supabaseClient
        .from('ecommerce_orders')
        .update({
          payment_status: 'COMPLETED',
          payment_method: 'CREDIT_CARD',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .select()
        .single();

      if (orderError) {
        console.error('Error updating order:', orderError);
        throw orderError;
      }

      console.log('Order updated to COMPLETED:', order.id);

      // 2. إنشاء سجل معاملة الدفع
      const { error: transactionError } = await supabaseClient
        .from('ecommerce_payment_transactions')
        .insert({
          order_id: orderId,
          amount_sar: amount,
          payment_method: 'CREDIT_CARD',
          transaction_id: transactionId,
          payment_status: 'COMPLETED',
          gateway_response: webhookData,
          processed_at: new Date().toISOString(),
        });

      if (transactionError) {
        console.error('Error creating transaction:', transactionError);
      }

      // 3. Trigger `create_merchant_pending_balance` سيتم تفعيله تلقائياً عند تحديث payment_status
      // هذا سيضيف الرصيد المعلق للتاجر وينشئ سجل في platform_revenue

      console.log('Payment processed successfully for order:', orderId);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Payment processed successfully',
          orderId: orderId
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );

    } else {
      // الدفع فشل
      const { error: updateError } = await supabaseClient
        .from('ecommerce_orders')
        .update({
          payment_status: 'FAILED',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('Error updating failed payment:', updateError);
      }

      // تسجيل المعاملة الفاشلة
      await supabaseClient
        .from('ecommerce_payment_transactions')
        .insert({
          order_id: orderId,
          amount_sar: amount,
          payment_method: 'CREDIT_CARD',
          transaction_id: transactionId,
          payment_status: 'FAILED',
          gateway_response: webhookData,
          processed_at: new Date().toISOString(),
        });

      return new Response(
        JSON.stringify({
          success: false,
          message: 'Payment failed',
          orderId: orderId
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

  } catch (error) {
    console.error('Webhook processing error:', error);
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
