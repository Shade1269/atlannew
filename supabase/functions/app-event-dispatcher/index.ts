// =============================================
// App Event Dispatcher Edge Function
// إرسال الأحداث إلى التطبيقات المثبتة
// =============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface EventPayload {
  store_id: string;
  event_type: string;
  event_data: Record<string, any>;
}

interface Webhook {
  id: string;
  installed_app_id: string;
  event_type: string;
  webhook_url: string;
  secret_key: string | null;
  retry_count: number;
  timeout_ms: number;
}

Deno.serve(async (req) => {
  // معالجة CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // قراءة البيانات
    const payload: EventPayload = await req.json();
    const { store_id, event_type, event_data } = payload;

    if (!store_id || !event_type) {
      return new Response(
        JSON.stringify({ error: 'store_id and event_type are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing event: ${event_type} for store: ${store_id}`);

    // تسجيل الحدث
    await supabase.from('app_events').insert({
      store_id,
      event_type,
      event_data,
    });

    // جلب التطبيقات المثبتة النشطة لهذا المتجر
    const { data: installedApps, error: appsError } = await supabase
      .from('installed_apps')
      .select(`
        id,
        app_id,
        status,
        app:marketplace_apps(webhook_events)
      `)
      .eq('store_id', store_id)
      .eq('status', 'active');

    if (appsError) {
      console.error('Error fetching installed apps:', appsError);
      throw appsError;
    }

    const webhooksToCall: Webhook[] = [];

    // جلب webhooks لكل تطبيق يستمع لهذا الحدث
    for (const installedApp of installedApps || []) {
      const webhookEvents = (installedApp.app as any)?.webhook_events || [];

      if (!webhookEvents.includes(event_type)) {
        continue;
      }

      // جلب webhook لهذا الحدث
      const { data: webhooks } = await supabase
        .from('app_webhooks')
        .select('*')
        .eq('installed_app_id', installedApp.id)
        .eq('event_type', event_type)
        .eq('is_active', true);

      if (webhooks && webhooks.length > 0) {
        webhooksToCall.push(...(webhooks as Webhook[]));
      }
    }

    console.log(`Found ${webhooksToCall.length} webhooks to call`);

    // إرسال الأحداث بشكل متوازي
    const results = await Promise.allSettled(
      webhooksToCall.map((webhook) => sendWebhook(supabase, webhook, event_type, event_data))
    );

    // إحصائيات النتائج
    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    // تحديث حالة الحدث
    await supabase
      .from('app_events')
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
      })
      .eq('store_id', store_id)
      .eq('event_type', event_type)
      .eq('processed', false);

    return new Response(
      JSON.stringify({
        success: true,
        event_type,
        webhooks_called: webhooksToCall.length,
        successful,
        failed,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in app-event-dispatcher:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// إرسال webhook مع retry
async function sendWebhook(
  supabase: any,
  webhook: Webhook,
  eventType: string,
  eventData: Record<string, any>
): Promise<void> {
  const payload = {
    event: eventType,
    timestamp: new Date().toISOString(),
    webhook_id: webhook.id,
    data: eventData,
  };

  let lastError: Error | null = null;
  let attempts = 0;

  // محاولات متعددة
  for (let i = 0; i < webhook.retry_count; i++) {
    attempts++;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), webhook.timeout_ms);

      const response = await fetch(webhook.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': webhook.secret_key || '',
          'X-Event-Type': eventType,
          'X-Webhook-ID': webhook.id,
          'X-Attempt': String(attempts),
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // تسجيل النتيجة
      await supabase.from('app_webhook_logs').insert({
        webhook_id: webhook.id,
        installed_app_id: webhook.installed_app_id,
        event_type: eventType,
        payload,
        response_status: response.status,
        attempts,
        delivered_at: response.ok ? new Date().toISOString() : null,
      });

      if (response.ok) {
        console.log(`Webhook ${webhook.id} delivered successfully`);
        return;
      }

      lastError = new Error(`HTTP ${response.status}`);
    } catch (error: any) {
      lastError = error;
      console.error(`Webhook ${webhook.id} attempt ${attempts} failed:`, error.message);

      // انتظار قبل المحاولة التالية (exponential backoff)
      if (i < webhook.retry_count - 1) {
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }

  // تسجيل الفشل النهائي
  await supabase.from('app_webhook_logs').insert({
    webhook_id: webhook.id,
    installed_app_id: webhook.installed_app_id,
    event_type: eventType,
    payload,
    error_message: lastError?.message,
    attempts,
  });

  throw lastError;
}
