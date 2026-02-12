import { serve } from 'https://deno.land/std@0.185.0/http/server.ts'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { getSupabaseAdminClient } from '../_shared/supabase.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    // استخدام Supabase Admin Client المشترك
    const supabaseClient = getSupabaseAdminClient()

    const { store_id, session_id } = await req.json()

    if (!store_id || !session_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'معرف المتجر وجلسة العميل مطلوبان'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // التحقق من صحة جلسة العميل
    const { data: otpSession, error: sessionError } = await supabaseClient
      .from('customer_otp_sessions')
      .select('phone')
      .eq('id', session_id)
      .eq('store_id', store_id)
      .eq('verified', true)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (sessionError || !otpSession) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'جلسة العميل غير صالحة أو منتهية الصلاحية'
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // جلب طلبات العميل من هذا المتجر
    const { data: orders, error: ordersError } = await supabaseClient
      .from('ecommerce_orders')
      .select(`
        id,
        order_number,
        created_at,
        status,
        total_sar,
        customer_name,
        customer_phone,
        shipping_address,
        notes
      `)
      .eq('affiliate_store_id', store_id)
      .eq('customer_phone', otpSession.phone)
      .order('created_at', { ascending: false })

    if (ordersError) {
      console.error('Error fetching orders:', ordersError)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'فشل في جلب الطلبات'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // جلب تفاصيل عناصر كل طلب
    const ordersWithItems = await Promise.all(
      (orders || []).map(async (order) => {
        const { data: items, error: itemsError } = await supabaseClient
          .from('ecommerce_order_items')
          .select(`
            id,
            product_title,
            quantity,
            unit_price_sar,
            total_price_sar
          `)
          .eq('order_id', order.id)

        if (itemsError) {
          console.error('Error fetching order items:', itemsError)
        }

        return {
          order_id: order.id,
          order_number: order.order_number || `ORD-${order.id.slice(0, 8)}`,
          created_at: order.created_at,
          status: order.status,
          total_sar: order.total_sar,
          customer_name: order.customer_name,
          shipping_address: order.shipping_address,
          notes: order.notes,
          item_count: (items || []).reduce((sum, item) => sum + item.quantity, 0),
          order_items: (items || []).map(item => ({
            id: item.id,
            title: item.product_title,
            quantity: item.quantity,
            unit_price: item.unit_price_sar,
            total_price: item.total_price_sar
          }))
        }
      })
    )

    return new Response(
      JSON.stringify({
        success: true,
        orders: ordersWithItems,
        customer_phone: otpSession.phone
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in get-store-orders-for-session:', error)

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