import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { getSupabaseAdminClient } from '../_shared/supabase.ts';

interface OrderData {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  shipping_address: any;
  subtotal_sar: number;
  tax_sar: number;
  shipping_sar: number;
  discount_sar: number;
  total_sar: number;
  created_at: string;
}

// الحصول على Access Token من Refresh Token
async function getAccessToken(refreshToken: string, clientId: string, clientSecret: string): Promise<string> {
  const tokenUrl = 'https://accounts.zoho.com/oauth/v2/token';

  const params = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token'
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString()
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to get access token: ${errorData}`);
  }

  const data = await response.json();
  return data.access_token;
}

// البحث عن أو إنشاء عميل في Zoho
async function getOrCreateCustomer(
  accessToken: string,
  organizationId: string,
  customerName: string,
  customerPhone: string,
  customerEmail: string | null
): Promise<string> {
  const baseUrl = `https://www.zohoapis.com/books/v3/contacts`;

  // البحث عن العميل أولاً
  const searchUrl = `${baseUrl}?organization_id=${organizationId}&phone=${encodeURIComponent(customerPhone)}`;

  const searchResponse = await fetch(searchUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Zoho-oauthtoken ${accessToken}`,
      'Content-Type': 'application/json',
    }
  });

  if (searchResponse.ok) {
    const searchData = await searchResponse.json();
    if (searchData.contacts && searchData.contacts.length > 0) {
      return searchData.contacts[0].contact_id;
    }
  }

  // إنشاء عميل جديد إذا لم يتم العثور عليه
  const createUrl = `${baseUrl}?organization_id=${organizationId}`;

  const customerData = {
    contact_name: customerName,
    contact_type: 'customer',
    phone: customerPhone,
    ...(customerEmail && { email: customerEmail }),
  };

  const createResponse = await fetch(createUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Zoho-oauthtoken ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(customerData)
  });

  if (!createResponse.ok) {
    const errorData = await createResponse.text();
    throw new Error(`Failed to create customer: ${errorData}`);
  }

  const createData = await createResponse.json();
  return createData.contact.contact_id;
}

// إنشاء فاتورة في Zoho Books
async function createInvoice(
  accessToken: string,
  organizationId: string,
  customerId: string,
  order: OrderData
): Promise<{ invoice_id: string; invoice_number: string }> {
  const invoiceUrl = `https://www.zohoapis.com/books/v3/invoices?organization_id=${organizationId}`;

  // تحضير عناصر الفاتورة
  const lineItems = [{
    name: `طلب رقم ${order.order_number}`,
    description: `إجمالي الطلب شامل المنتجات`,
    rate: order.subtotal_sar,
    quantity: 1,
    item_order: 1
  }];

  // إضافة الشحن كعنصر منفصل إذا كان موجود
  if (order.shipping_sar > 0) {
    lineItems.push({
      name: 'رسوم الشحن',
      description: 'تكلفة التوصيل',
      rate: order.shipping_sar,
      quantity: 1,
      item_order: 2
    });
  }

  // إضافة الخصم إذا كان موجود
  if (order.discount_sar > 0) {
    lineItems.push({
      name: 'خصم',
      description: 'خصم على الطلب',
      rate: -order.discount_sar, // قيمة سالبة للخصم
      quantity: 1,
      item_order: 3
    });
  }

  const invoiceData = {
    customer_id: customerId,
    invoice_number: order.order_number,
    date: new Date(order.created_at).toISOString().split('T')[0],
    line_items: lineItems,
    tax_id: '', // سيتم إضافة معرف الضريبة هنا إذا كان لديك
    notes: `طلب من منصة أتلانتس - رقم الطلب: ${order.order_number}`,
    is_inclusive_tax: true, // الضريبة شاملة (كما هو الحال في السعودية)
  };

  const response = await fetch(invoiceUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Zoho-oauthtoken ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(invoiceData)
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to create invoice: ${errorData}`);
  }

  const data = await response.json();
  return {
    invoice_id: data.invoice.invoice_id,
    invoice_number: data.invoice.invoice_number
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    // استخدام Supabase Admin Client المشترك
    const supabase = getSupabaseAdminClient();

    // قراءة البيانات
    const { order_id } = await req.json();

    if (!order_id) {
      throw new Error('order_id is required');
    }

    console.log('Processing order:', order_id);

    // جلب بيانات الطلب
    const { data: order, error: orderError } = await supabase
      .from('ecommerce_orders')
      .select('*')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      throw new Error(`Failed to fetch order: ${orderError?.message}`);
    }

    // تحديث حالة المزامنة إلى IN_PROGRESS
    await supabase
      .from('ecommerce_orders')
      .update({
        zoho_sync_status: 'IN_PROGRESS',
        zoho_last_sync_attempt: new Date().toISOString()
      })
      .eq('id', order_id);

    // جلب بيانات Zoho من Secrets
    const zohoRefreshToken = Deno.env.get('ZOHO_REFRESH_TOKEN');
    const zohoClientId = Deno.env.get('ZOHO_CLIENT_ID');
    const zohoClientSecret = Deno.env.get('ZOHO_CLIENT_SECRET');
    const zohoOrganizationId = Deno.env.get('ZOHO_ORGANIZATION_ID');

    if (!zohoRefreshToken || !zohoClientId || !zohoClientSecret || !zohoOrganizationId) {
      throw new Error('Zoho credentials not configured in secrets');
    }

    // الحصول على Access Token
    console.log('Getting Zoho access token...');
    const accessToken = await getAccessToken(zohoRefreshToken, zohoClientId, zohoClientSecret);

    // البحث عن أو إنشاء العميل
    console.log('Getting or creating customer...');
    const customerId = await getOrCreateCustomer(
      accessToken,
      zohoOrganizationId,
      order.customer_name,
      order.customer_phone,
      order.customer_email
    );

    // إنشاء الفاتورة
    console.log('Creating invoice...');
    const { invoice_id, invoice_number } = await createInvoice(
      accessToken,
      zohoOrganizationId,
      customerId,
      order
    );

    // تحديث الطلب بمعلومات Zoho
    await supabase
      .from('ecommerce_orders')
      .update({
        zoho_invoice_id: invoice_id,
        zoho_invoice_number: invoice_number,
        zoho_sync_status: 'SYNCED',
        zoho_synced_at: new Date().toISOString(),
        zoho_error_message: null
      })
      .eq('id', order_id);

    console.log('Order synced successfully:', {
      order_id,
      invoice_id,
      invoice_number
    });

    return new Response(
      JSON.stringify({
        success: true,
        invoice_id,
        invoice_number,
        message: 'تم إنشاء الفاتورة في Zoho Books بنجاح'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in sync-order-to-zoho:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const corsHeaders = getCorsHeaders(req);

    // تحديث حالة المزامنة إلى FAILED
    try {
      const { order_id } = await req.json().catch(() => ({}));
      if (order_id) {
        // استخدام Supabase Admin Client المشترك
        const supabase = getSupabaseAdminClient();

        await supabase
          .from('ecommerce_orders')
          .update({
            zoho_sync_status: 'FAILED',
            zoho_error_message: errorMessage
          })
          .eq('id', order_id);
      }
    } catch (updateError) {
      console.error('Failed to update error status:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
