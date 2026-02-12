import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { getSupabaseAdminClient } from '../_shared/supabase.ts';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const requestBody = await req.json();

    // Handle both direct object and nested invoice object from Zoho
    const invoice_number = requestBody.invoice_number || requestBody.invoice?.invoice_number;
    const invoice_id = requestBody.invoice_id || requestBody.invoice?.invoice_id;
    const invoice_url = requestBody.invoice_url ||
      (invoice_id ? `https://books.zoho.com/app#/invoices/${invoice_id}` : null);
    const order_id = requestBody.order_id;
    const order_number = requestBody.order_number;

    console.log('Received invoice update:', {
      order_id,
      order_number,
      invoice_number,
      invoice_id,
      hasOrderIdentifier: !!(order_id || order_number),
      rawBody: JSON.stringify(requestBody).substring(0, 500)
    });

    // استخدام Supabase Admin Client المشترك
    const supabase = getSupabaseAdminClient();

    // Build update data
    const updateData: Record<string, any> = {
      zoho_sync_status: 'SYNCED',
      updated_at: new Date().toISOString()
    };

    if (invoice_number) updateData.zoho_invoice_number = invoice_number;
    if (invoice_id) updateData.zoho_invoice_id = invoice_id;
    if (invoice_url) updateData.zoho_invoice_url = invoice_url;

    let existingOrder: any = null;

    // Strategy 1: Find by order_id or order_number if provided
    if (order_id || order_number) {
      let findQuery = supabase.from('order_hub').select('id, order_number');

      if (order_id) {
        findQuery = findQuery.eq('id', order_id);
      } else if (order_number) {
        findQuery = findQuery.eq('order_number', order_number);
      }

      const { data, error } = await findQuery.maybeSingle();
      if (!error && data) {
        existingOrder = data;
        console.log('Found order by id/number:', existingOrder);
      }
    }

    // Strategy 2: If no order found, find the most recent IN_PROGRESS order
    if (!existingOrder) {
      console.log('No order identifier provided, looking for IN_PROGRESS orders...');

      const { data: pendingOrders, error: pendingError } = await supabase
        .from('order_hub')
        .select('id, order_number, created_at')
        .eq('zoho_sync_status', 'IN_PROGRESS')
        .order('created_at', { ascending: false })
        .limit(1);

      if (pendingError) {
        console.error('Error finding pending orders:', pendingError);
      } else if (pendingOrders && pendingOrders.length > 0) {
        existingOrder = pendingOrders[0];
        console.log('Found IN_PROGRESS order:', existingOrder);
      }
    }

    // If still no order found, return error
    if (!existingOrder) {
      console.log('No order found to update');
      return new Response(
        JSON.stringify({
          error: 'No order found',
          message: 'No matching order or pending order found to update',
          received: { order_id, order_number, invoice_number, invoice_id }
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update the order
    const { data, error } = await supabase
      .from('order_hub')
      .update(updateData)
      .eq('id', existingOrder.id)
      .select('id, order_number, zoho_invoice_number, zoho_invoice_url')
      .single();

    if (error) {
      console.error('Error updating order:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to update order', details: error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Order updated with invoice:', data);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Invoice data saved successfully',
        order: data
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in update-order-invoice:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
