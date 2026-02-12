import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { getSupabaseAdminClient } from '../_shared/supabase.ts';

// Zoho Flow Webhook URL
const ZOHO_FLOW_WEBHOOK_URL = "https://flow.zoho.com/880722712/flow/webhook/incoming?zapikey=1001.3ca1d6a7e39217c314f07eb6a5a823c1.97b66a3c6d635bce7c96acf106e4f2c7&isdebug=false";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const { order_id } = await req.json();

    if (!order_id) {
      console.error('Missing order_id');
      return new Response(
        JSON.stringify({ error: 'Missing order_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing order for Zoho Flow:', order_id);

    // استخدام Supabase Admin Client المشترك
    const supabase = getSupabaseAdminClient();

    // Fetch order from order_hub
    const { data: order, error: orderError } = await supabase
      .from('order_hub')
      .select('*')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderError);
      return new Response(
        JSON.stringify({ error: 'Order not found', details: orderError }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Order found:', order.order_number);

    // Fetch order items
    let items: any[] = [];

    if (order.source === 'ecommerce') {
      const { data: ecomItems } = await supabase
        .from('ecommerce_order_items')
        .select('*')
        .eq('order_id', order_id);
      items = ecomItems || [];
    } else {
      const { data: simpleItems } = await supabase
        .from('simple_order_items')
        .select('*')
        .eq('order_id', order_id);
      items = simpleItems || [];
    }

    console.log('Items found:', items.length);

    // Prepare data for Zoho Flow
    const zohoPayload = {
      // Order Info
      order_id: order.id,
      order_number: order.order_number,
      order_date: order.created_at,

      // Customer Info
      customer_name: order.customer_name || 'عميل',
      customer_email: order.customer_email || '',
      customer_phone: order.customer_phone || '',

      // Address
      shipping_address: order.shipping_address || '',
      shipping_city: order.shipping_city || '',
      shipping_country: order.shipping_country || 'SA',

      // Amounts
      subtotal: order.subtotal_sar || 0,
      shipping_cost: order.shipping_cost_sar || 0,
      discount_amount: order.discount_amount_sar || 0,
      tax_amount: order.tax_amount_sar || 0,
      total_amount: order.total_sar || 0,
      currency: 'SAR',

      // Payment
      payment_method: order.payment_method || '',
      payment_status: order.payment_status || '',

      // Items
      items: items.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name || item.product_title || 'منتج',
        sku: item.sku || '',
        quantity: item.quantity || 1,
        unit_price: item.unit_price_sar || item.price_sar || 0,
        total_price: (item.quantity || 1) * (item.unit_price_sar || item.price_sar || 0)
      })),

      // Store Info
      store_id: order.affiliate_store_id || order.store_id || '',

      // Source
      source: 'Atlantis Platform'
    };

    console.log('Sending to Zoho Flow:', JSON.stringify(zohoPayload, null, 2));

    // Send to Zoho Flow Webhook
    const zohoResponse = await fetch(ZOHO_FLOW_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(zohoPayload),
    });

    const zohoResult = await zohoResponse.text();
    console.log('Zoho Flow response:', zohoResponse.status, zohoResult);

    if (!zohoResponse.ok) {
      console.error('Zoho Flow error:', zohoResult);

      // Update order with error status
      await supabase
        .from('order_hub')
        .update({
          zoho_sync_status: 'FAILED',
          zoho_error_message: `Zoho Flow error: ${zohoResult}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', order_id);

      return new Response(
        JSON.stringify({ error: 'Failed to send to Zoho Flow', details: zohoResult }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update order with success status
    await supabase
      .from('order_hub')
      .update({
        zoho_sync_status: 'SENT_TO_FLOW',
        updated_at: new Date().toISOString()
      })
      .eq('id', order_id);

    console.log('Successfully sent order to Zoho Flow');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Order sent to Zoho Flow successfully',
        order_number: order.order_number
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-order-to-zoho-flow:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
