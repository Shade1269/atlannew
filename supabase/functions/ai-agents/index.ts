import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

/**
 * 🤖 AI Agents System - وكلاء ذكية مستقلة
 * 
 * الوكلاء المتاحين:
 * 1. order_agent - متابعة الطلبات والتأخيرات
 * 2. fraud_agent - كشف الاحتيال والمعاملات المشبوهة
 * 3. inventory_agent - إدارة المخزون والتنبيهات
 * 4. customer_agent - خدمة العملاء الآلية
 * 5. marketing_agent - تحسين التسويق والعروض
 */

interface AgentRequest {
  agent: 'order' | 'fraud' | 'inventory' | 'customer' | 'marketing' | 'all';
  action?: string;
  context?: Record<string, any>;
  store_id?: string;
}

interface AgentResponse {
  agent: string;
  status: 'success' | 'warning' | 'error';
  findings: AgentFinding[];
  recommendations: string[];
  actions_taken: AgentAction[];
  next_check?: string;
}

interface AgentFinding {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  data?: Record<string, any>;
  timestamp: string;
}

interface AgentAction {
  id: string;
  type: string;
  description: string;
  status: 'pending' | 'executed' | 'failed';
  result?: string;
}

const generateId = () => crypto.randomUUID().slice(0, 8);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const { agent, action, context, store_id }: AgentRequest = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const results: AgentResponse[] = [];

    // ============ ORDER AGENT ============
    if (agent === 'order' || agent === 'all') {
      console.log("🚚 Order Agent: Starting analysis...");
      const findings: AgentFinding[] = [];
      const actions: AgentAction[] = [];
      const recommendations: string[] = [];

      // الطلبات المتأخرة
      const { data: delayedOrders } = await supabase
        .from('order_hub')
        .select('id, order_number, customer_name, customer_phone, status, created_at, total_amount_sar')
        .in('status', ['pending', 'processing'])
        .lt('created_at', dayAgo.toISOString())
        .limit(50);

      if (delayedOrders && delayedOrders.length > 0) {
        findings.push({
          id: generateId(),
          type: 'delayed_orders',
          severity: delayedOrders.length > 10 ? 'high' : 'medium',
          title: `${delayedOrders.length} طلب متأخر`,
          description: `يوجد ${delayedOrders.length} طلب متأخر أكثر من 24 ساعة ويحتاج متابعة`,
          data: { orders: delayedOrders.slice(0, 5), total: delayedOrders.length },
          timestamp: now.toISOString()
        });
        recommendations.push(`راجع الطلبات المتأخرة وتواصل مع العملاء`);
      }

      // الطلبات قيد المعالجة لفترة طويلة
      const { data: stuckOrders } = await supabase
        .from('order_hub')
        .select('id, order_number, status, created_at')
        .eq('status', 'processing')
        .lt('created_at', new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString())
        .limit(20);

      if (stuckOrders && stuckOrders.length > 0) {
        findings.push({
          id: generateId(),
          type: 'stuck_orders',
          severity: 'high',
          title: `${stuckOrders.length} طلب عالق`,
          description: `طلبات في حالة "معالجة" منذ أكثر من 48 ساعة`,
          data: { orders: stuckOrders },
          timestamp: now.toISOString()
        });
      }

      // تحليل أنماط الإلغاء
      const { data: cancelledOrders } = await supabase
        .from('order_hub')
        .select('id, cancellation_reason, created_at')
        .eq('status', 'cancelled')
        .gte('created_at', weekAgo.toISOString());

      if (cancelledOrders && cancelledOrders.length > 5) {
        const cancellationReasons: Record<string, number> = {};
        cancelledOrders.forEach(order => {
          const reason = order.cancellation_reason || 'غير محدد';
          cancellationReasons[reason] = (cancellationReasons[reason] || 0) + 1;
        });

        findings.push({
          id: generateId(),
          type: 'cancellation_pattern',
          severity: 'medium',
          title: `نمط إلغاء مكتشف`,
          description: `${cancelledOrders.length} طلب ملغي هذا الأسبوع`,
          data: { reasons: cancellationReasons, total: cancelledOrders.length },
          timestamp: now.toISOString()
        });
        recommendations.push(`حلل أسباب الإلغاء الأكثر شيوعاً لتحسين تجربة العملاء`);
      }

      results.push({
        agent: 'order_agent',
        status: findings.some(f => f.severity === 'critical') ? 'error' : 
                findings.some(f => f.severity === 'high') ? 'warning' : 'success',
        findings,
        recommendations,
        actions_taken: actions,
        next_check: new Date(now.getTime() + 30 * 60 * 1000).toISOString()
      });
    }

    // ============ FRAUD AGENT ============
    if (agent === 'fraud' || agent === 'all') {
      console.log("🔍 Fraud Agent: Analyzing suspicious activities...");
      const findings: AgentFinding[] = [];
      const actions: AgentAction[] = [];
      const recommendations: string[] = [];

      // طلبات عالية القيمة من نفس الرقم
      const { data: highValueOrders } = await supabase
        .from('order_hub')
        .select('customer_phone, total_amount_sar, id, customer_name, created_at')
        .gte('created_at', dayAgo.toISOString())
        .gte('total_amount_sar', 500);

      const phoneCounts: Record<string, { count: number; total: number; orders: any[] }> = {};
      highValueOrders?.forEach(order => {
        if (order.customer_phone) {
          if (!phoneCounts[order.customer_phone]) {
            phoneCounts[order.customer_phone] = { count: 0, total: 0, orders: [] };
          }
          phoneCounts[order.customer_phone].count++;
          phoneCounts[order.customer_phone].total += Number(order.total_amount_sar || 0);
          phoneCounts[order.customer_phone].orders.push(order);
        }
      });

      const suspiciousPhones = Object.entries(phoneCounts)
        .filter(([, data]) => data.count >= 3 || data.total >= 3000)
        .map(([phone, data]) => ({ phone, ...data }));

      if (suspiciousPhones.length > 0) {
        findings.push({
          id: generateId(),
          type: 'suspicious_activity',
          severity: 'high',
          title: `${suspiciousPhones.length} رقم مشبوه`,
          description: `أرقام لديها طلبات متكررة عالية القيمة`,
          data: { suspects: suspiciousPhones },
          timestamp: now.toISOString()
        });
        recommendations.push(`تحقق من الأرقام المشبوهة قبل معالجة الطلبات`);

        // حفظ في الذاكرة
        await supabase.from('brain_memory').insert({
          memory_type: 'fraud_alert',
          title: 'نشاط مشبوه مكتشف',
          content: `${suspiciousPhones.length} رقم بنشاط غير طبيعي`,
          importance_score: 9,
          context: { suspects: suspiciousPhones },
          tags: ['احتيال', 'أمان', 'تنبيه']
        });
      }

      // محاولات OTP فاشلة متكررة
      const { data: failedOtps } = await supabase
        .from('customer_otp_sessions')
        .select('phone_number, attempts, created_at')
        .gte('attempts', 3)
        .gte('created_at', dayAgo.toISOString());

      if (failedOtps && failedOtps.length > 5) {
        findings.push({
          id: generateId(),
          type: 'otp_abuse',
          severity: 'medium',
          title: `محاولات OTP مشبوهة`,
          description: `${failedOtps.length} رقم لديه محاولات OTP فاشلة متكررة`,
          data: { phones: failedOtps.slice(0, 10) },
          timestamp: now.toISOString()
        });
      }

      // تحليل AI للحالات الحرجة
      if (suspiciousPhones.length > 0 && LOVABLE_API_KEY) {
        try {
          const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                {
                  role: "system",
                  content: `أنت خبير في كشف الاحتيال. حلل البيانات وقدم:
1. تقييم المخاطر (1-10)
2. أنماط مشبوهة محددة
3. إجراءات فورية مقترحة
كن موجزاً ومحدداً.`
                },
                {
                  role: "user",
                  content: `تحليل النشاط المشبوه التالي:\n${JSON.stringify(suspiciousPhones.slice(0, 5))}`
                }
              ],
              stream: false,
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const analysis = aiData.choices?.[0]?.message?.content;
            if (analysis) {
              findings.push({
                id: generateId(),
                type: 'ai_analysis',
                severity: 'high',
                title: 'تحليل AI للاحتيال',
                description: analysis,
                timestamp: now.toISOString()
              });
            }
          }
        } catch (e) {
          console.warn("AI fraud analysis failed:", e);
        }
      }

      results.push({
        agent: 'fraud_agent',
        status: findings.some(f => f.severity === 'critical' || f.severity === 'high') ? 'warning' : 'success',
        findings,
        recommendations,
        actions_taken: actions,
        next_check: new Date(now.getTime() + 15 * 60 * 1000).toISOString()
      });
    }

    // ============ INVENTORY AGENT ============
    if (agent === 'inventory' || agent === 'all') {
      console.log("📦 Inventory Agent: Checking stock levels...");
      const findings: AgentFinding[] = [];
      const actions: AgentAction[] = [];
      const recommendations: string[] = [];

      // المنتجات منخفضة المخزون
      const { data: lowStockProducts } = await supabase
        .from('products')
        .select('id, name, stock_quantity, min_stock_threshold, merchant_id')
        .lt('stock_quantity', 10)
        .eq('is_active', true);

      if (lowStockProducts && lowStockProducts.length > 0) {
        const criticalStock = lowStockProducts.filter(p => (p.stock_quantity || 0) <= 2);
        const warningStock = lowStockProducts.filter(p => (p.stock_quantity || 0) > 2 && (p.stock_quantity || 0) < 10);

        if (criticalStock.length > 0) {
          findings.push({
            id: generateId(),
            type: 'critical_stock',
            severity: 'critical',
            title: `${criticalStock.length} منتج على وشك النفاد`,
            description: `منتجات بمخزون أقل من 3 وحدات`,
            data: { products: criticalStock.slice(0, 10) },
            timestamp: now.toISOString()
          });
          recommendations.push(`أعد طلب المنتجات الحرجة فوراً`);
        }

        if (warningStock.length > 0) {
          findings.push({
            id: generateId(),
            type: 'low_stock',
            severity: 'medium',
            title: `${warningStock.length} منتج بمخزون منخفض`,
            description: `منتجات بمخزون أقل من 10 وحدات`,
            data: { products: warningStock.slice(0, 10) },
            timestamp: now.toISOString()
          });
        }
      }

      // منتجات بدون مخزون مع طلبات معلقة
      const { data: outOfStockWithOrders } = await supabase
        .from('products')
        .select('id, name, stock_quantity')
        .eq('stock_quantity', 0)
        .eq('is_active', true);

      if (outOfStockWithOrders && outOfStockWithOrders.length > 0) {
        // تحقق من وجود stock alerts
        const { data: alerts } = await supabase
          .from('stock_alerts')
          .select('product_id, customer_email')
          .in('product_id', outOfStockWithOrders.map(p => p.id))
          .eq('is_notified', false);

        if (alerts && alerts.length > 0) {
          findings.push({
            id: generateId(),
            type: 'stock_alert_pending',
            severity: 'medium',
            title: `${alerts.length} عميل ينتظر توفر المنتجات`,
            description: `عملاء سجلوا للإشعار عند توفر المنتج`,
            data: { alerts_count: alerts.length },
            timestamp: now.toISOString()
          });
          recommendations.push(`أولِ الأهمية لإعادة تخزين المنتجات المطلوبة`);
        }
      }

      results.push({
        agent: 'inventory_agent',
        status: findings.some(f => f.severity === 'critical') ? 'error' : 
                findings.some(f => f.severity === 'high') ? 'warning' : 'success',
        findings,
        recommendations,
        actions_taken: actions,
        next_check: new Date(now.getTime() + 60 * 60 * 1000).toISOString()
      });
    }

    // ============ CUSTOMER AGENT ============
    if (agent === 'customer' || agent === 'all') {
      console.log("👥 Customer Agent: Analyzing customer patterns...");
      const findings: AgentFinding[] = [];
      const recommendations: string[] = [];

      // العملاء غير النشطين
      const { data: inactiveCustomers } = await supabase
        .from('order_hub')
        .select('customer_phone, customer_name, created_at')
        .lt('created_at', new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      const uniqueInactive = new Set(inactiveCustomers?.map(c => c.customer_phone)).size;
      if (uniqueInactive > 10) {
        findings.push({
          id: generateId(),
          type: 'inactive_customers',
          severity: 'low',
          title: `عملاء غير نشطين`,
          description: `${uniqueInactive} عميل لم يشترِ منذ 30 يوم`,
          data: { count: uniqueInactive },
          timestamp: now.toISOString()
        });
        recommendations.push(`أرسل عروض حصرية للعملاء غير النشطين`);
      }

      // السلات المتروكة
      const { data: abandonedCarts } = await supabase
        .from('abandoned_carts')
        .select('id, total_amount, items_count, created_at')
        .eq('is_recovered', false)
        .gte('created_at', weekAgo.toISOString());

      if (abandonedCarts && abandonedCarts.length > 5) {
        const totalValue = abandonedCarts.reduce((sum, cart) => sum + Number(cart.total_amount || 0), 0);
        findings.push({
          id: generateId(),
          type: 'abandoned_carts',
          severity: 'medium',
          title: `${abandonedCarts.length} سلة متروكة`,
          description: `قيمة إجمالية ${totalValue.toFixed(2)} ريال`,
          data: { carts: abandonedCarts.length, value: totalValue },
          timestamp: now.toISOString()
        });
        recommendations.push(`فعّل نظام استرداد السلات المتروكة`);
      }

      results.push({
        agent: 'customer_agent',
        status: 'success',
        findings,
        recommendations,
        actions_taken: [],
        next_check: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString()
      });
    }

    // ============ MARKETING AGENT ============
    if (agent === 'marketing' || agent === 'all') {
      console.log("📢 Marketing Agent: Optimizing campaigns...");
      const findings: AgentFinding[] = [];
      const recommendations: string[] = [];

      // تحليل أداء الكوبونات
      const { data: coupons } = await supabase
        .from('affiliate_coupons')
        .select('id, coupon_code, coupon_name, usage_count, usage_limit, discount_value, is_active')
        .eq('is_active', true);

      const underperformingCoupons = coupons?.filter(c => 
        c.usage_limit && c.usage_count && (c.usage_count / c.usage_limit) < 0.1
      );

      if (underperformingCoupons && underperformingCoupons.length > 0) {
        findings.push({
          id: generateId(),
          type: 'underperforming_coupons',
          severity: 'low',
          title: `كوبونات ضعيفة الأداء`,
          description: `${underperformingCoupons.length} كوبون بنسبة استخدام أقل من 10%`,
          data: { coupons: underperformingCoupons },
          timestamp: now.toISOString()
        });
        recommendations.push(`راجع استراتيجية التسويق للكوبونات`);
      }

      // اقتراحات تسويقية ذكية
      if (LOVABLE_API_KEY) {
        const { data: recentSales } = await supabase
          .from('order_hub')
          .select('total_amount_sar, created_at')
          .gte('created_at', weekAgo.toISOString())
          .eq('status', 'completed');

        const weeklyRevenue = recentSales?.reduce((sum, o) => sum + Number(o.total_amount_sar || 0), 0) || 0;

        try {
          const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                {
                  role: "system",
                  content: `أنت خبير تسويق رقمي. قدم 3 اقتراحات تسويقية قابلة للتنفيذ فوراً.
كن موجزاً ومحدداً. استخدم نقاط مرقمة.`
                },
                {
                  role: "user",
                  content: `إيرادات الأسبوع: ${weeklyRevenue} ريال
عدد الكوبونات النشطة: ${coupons?.length || 0}
اقترح حملات تسويقية فعالة.`
                }
              ],
              stream: false,
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const suggestions = aiData.choices?.[0]?.message?.content;
            if (suggestions) {
              recommendations.push(suggestions);
            }
          }
        } catch (e) {
          console.warn("AI marketing suggestions failed:", e);
        }
      }

      results.push({
        agent: 'marketing_agent',
        status: 'success',
        findings,
        recommendations,
        actions_taken: [],
        next_check: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString()
      });
    }

    // حفظ تقرير الوكلاء في الذاكرة
    await supabase.from('brain_memory').insert({
      memory_type: 'agent_report',
      title: `تقرير الوكلاء - ${agent}`,
      content: `${results.length} وكيل نشط، ${results.reduce((sum, r) => sum + r.findings.length, 0)} اكتشاف`,
      importance_score: 5,
      context: { results },
      tags: ['وكلاء', 'تقرير', 'آلي']
    });

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: now.toISOString(),
        agents: results,
        total_findings: results.reduce((sum, r) => sum + r.findings.length, 0),
        total_recommendations: results.reduce((sum, r) => sum + r.recommendations.length, 0)
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("AI Agents error:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
