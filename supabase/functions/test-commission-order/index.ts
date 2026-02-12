import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const orderNumber = `TEST-COMMISSION-${Date.now()}`;

    // 1. إنشاء الطلب
    const { data: order, error: orderError } = await supabase
      .from('ecommerce_orders')
      .insert({
        order_number: orderNumber,
        customer_name: 'عميل اختبار العمولات',
        customer_phone: '0501234567',
        customer_email: 'test@example.com',
        subtotal_sar: 50.00,
        total_sar: 50.00,
        status: 'PENDING',
        payment_status: 'PENDING',
        payment_method: 'CASH_ON_DELIVERY',
        affiliate_store_id: '4b714f0e-1641-4761-a76a-2ff4f3522871',
        shop_id: '165821c4-f12d-4ade-a929-342b16392d9f',
        shipping_address: { city: 'الرياض', street: 'شارع الاختبار' },
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // 2. إضافة عنصر الطلب (منتج بهامش ربح)
    const { data: orderItem, error: itemError } = await supabase
      .from('ecommerce_order_items')
      .insert({
        order_id: order.id,
        product_id: '92ed09bd-efb0-4175-9866-30b9a46e43a6',
        product_title: 'نمنممننم',
        quantity: 1,
        unit_price_sar: 50.00, // سعر البيع للمسوق
        commission_sar: 38.00, // عمولة المسوق
      })
      .select()
      .single();

    if (itemError) throw itemError;

    // 3. تحديث الطلب إلى PAID لتفعيل توزيع العمولات
    const { data: updatedOrder, error: updateError } = await supabase
      .from('ecommerce_orders')
      .update({
        status: 'CONFIRMED',
        payment_status: 'PAID',
      })
      .eq('id', order.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // 4. التحقق من إنشاء العمولات
    const { data: commissions, error: commError } = await supabase
      .from('commissions')
      .select('*')
      .eq('order_item_id', orderItem.id);

    // 5. التحقق من order_hub
    const { data: hubOrder } = await supabase
      .from('order_hub')
      .select('*')
      .eq('source_order_id', order.id)
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'تم إنشاء طلب اختبار العمولات',
        order: {
          id: order.id,
          order_number: orderNumber,
          status: updatedOrder.status,
          payment_status: updatedOrder.payment_status,
        },
        order_item: {
          id: orderItem.id,
          unit_price: orderItem.unit_price_sar,
          commission: orderItem.commission_sar,
        },
        commissions_generated: commissions?.length || 0,
        commissions: commissions,
        order_hub_synced: !!hubOrder,
        hub_order: hubOrder,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
