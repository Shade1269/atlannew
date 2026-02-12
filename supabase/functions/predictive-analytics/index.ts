import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { getSupabaseAdminClient } from '../_shared/supabase.ts';

/**
 * 📊 Predictive Analytics System - التحليلات التنبؤية
 * 
 * الميزات:
 * 1. توقع المبيعات - يومي/أسبوعي/شهري
 * 2. سلوك العملاء - احتمال الرحيل، احتمال الشراء
 * 3. توقع المخزون - متى سينفد المنتج
 * 4. تحليل الاتجاهات - ما المنتجات الصاعدة
 */

interface PredictionRequest {
  type: 'sales' | 'customer' | 'inventory' | 'trends' | 'full_report';
  store_id?: string;
  time_range?: 'week' | 'month' | 'quarter';
  product_id?: string;
  customer_id?: string;
}

interface Prediction {
  id: string;
  type: string;
  title: string;
  prediction: string | number;
  confidence: number;
  factors: string[];
  recommendation?: string;
  data?: Record<string, any>;
}

const generateId = () => crypto.randomUUID().slice(0, 8);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const { type, store_id, time_range = 'week', product_id, customer_id }: PredictionRequest = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // استخدام Supabase Admin Client المشترك
    const supabase = getSupabaseAdminClient();
    const now = new Date();
    const predictions: Prediction[] = [];

    // ============ جمع البيانات التاريخية ============
    const daysBack = time_range === 'quarter' ? 90 : time_range === 'month' ? 30 : 7;
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

    // بيانات المبيعات
    let salesQuery = supabase
      .from('order_hub')
      .select('id, total_amount_sar, created_at, status, customer_phone, items_count')
      .gte('created_at', startDate.toISOString())
      .in('status', ['completed', 'delivered', 'processing']);

    if (store_id) {
      salesQuery = salesQuery.eq('affiliate_store_id', store_id);
    }

    const { data: salesData } = await salesQuery;

    // ============ SALES PREDICTIONS ============
    if (type === 'sales' || type === 'full_report') {
      console.log("📈 Calculating sales predictions...");

      // حساب متوسطات
      const dailySales: Record<string, number> = {};
      const daySalesCount: Record<string, number> = {};

      salesData?.forEach(order => {
        const date = new Date(order.created_at).toISOString().split('T')[0];
        dailySales[date] = (dailySales[date] || 0) + Number(order.total_amount_sar || 0);
        daySalesCount[date] = (daySalesCount[date] || 0) + 1;
      });

      const dates = Object.keys(dailySales).sort();
      const values = dates.map(d => dailySales[d]);

      const avgDaily = values.reduce((a, b) => a + b, 0) / Math.max(values.length, 1);
      const avgOrders = Object.values(daySalesCount).reduce((a, b) => a + b, 0) / Math.max(dates.length, 1);

      // حساب الاتجاه (Trend)
      let trend = 0;
      if (values.length >= 7) {
        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        trend = ((secondAvg - firstAvg) / Math.max(firstAvg, 1)) * 100;
      }

      // توقع الأسبوع القادم
      const weeklyPrediction = avgDaily * 7 * (1 + trend / 100);
      const monthlyPrediction = avgDaily * 30 * (1 + trend / 100);

      predictions.push({
        id: generateId(),
        type: 'sales_forecast',
        title: 'توقع المبيعات',
        prediction: weeklyPrediction,
        confidence: Math.min(0.9, 0.5 + (dates.length / 30)),
        factors: [
          `متوسط يومي: ${avgDaily.toFixed(2)} ريال`,
          `متوسط الطلبات: ${avgOrders.toFixed(1)} طلب/يوم`,
          `الاتجاه: ${trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} ${Math.abs(trend).toFixed(1)}%`
        ],
        recommendation: trend < -10
          ? 'المبيعات في انخفاض - فكر في حملات ترويجية'
          : trend > 10
            ? 'المبيعات في ارتفاع - زد المخزون'
            : 'المبيعات مستقرة',
        data: {
          daily_average: avgDaily,
          weekly_prediction: weeklyPrediction,
          monthly_prediction: monthlyPrediction,
          trend_percentage: trend,
          historical_data: dailySales
        }
      });

      // أفضل يوم للمبيعات
      const dayOfWeekSales: Record<string, number[]> = {};
      salesData?.forEach(order => {
        const day = new Date(order.created_at).toLocaleDateString('en-US', { weekday: 'long' });
        if (!dayOfWeekSales[day]) dayOfWeekSales[day] = [];
        dayOfWeekSales[day].push(Number(order.total_amount_sar || 0));
      });

      const dayAverages = Object.entries(dayOfWeekSales).map(([day, values]) => ({
        day,
        average: values.reduce((a, b) => a + b, 0) / values.length
      })).sort((a, b) => b.average - a.average);

      if (dayAverages.length > 0) {
        predictions.push({
          id: generateId(),
          type: 'best_day',
          title: 'أفضل يوم للمبيعات',
          prediction: dayAverages[0].day,
          confidence: 0.75,
          factors: dayAverages.slice(0, 3).map(d =>
            `${d.day}: ${d.average.toFixed(2)} ريال`
          ),
          recommendation: `ركز حملاتك التسويقية يوم ${dayAverages[0].day}`,
          data: { day_averages: dayAverages }
        });
      }
    }

    // ============ CUSTOMER PREDICTIONS ============
    if (type === 'customer' || type === 'full_report') {
      console.log("👥 Analyzing customer behavior...");

      // تحليل العملاء
      const customerOrders: Record<string, { orders: number; total: number; lastOrder: Date }> = {};

      salesData?.forEach(order => {
        const phone = order.customer_phone;
        if (phone) {
          if (!customerOrders[phone]) {
            customerOrders[phone] = { orders: 0, total: 0, lastOrder: new Date(0) };
          }
          customerOrders[phone].orders++;
          customerOrders[phone].total += Number(order.total_amount_sar || 0);
          const orderDate = new Date(order.created_at);
          if (orderDate > customerOrders[phone].lastOrder) {
            customerOrders[phone].lastOrder = orderDate;
          }
        }
      });

      const customers = Object.entries(customerOrders);
      const totalCustomers = customers.length;
      const returningCustomers = customers.filter(([, data]) => data.orders > 1).length;
      const retentionRate = totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;

      // العملاء المعرضين للرحيل
      const churnRiskCustomers = customers
        .filter(([, data]) => {
          const daysSinceLastOrder = (now.getTime() - data.lastOrder.getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceLastOrder > 30 && data.orders > 1;
        })
        .map(([phone, data]) => ({ phone, ...data }));

      predictions.push({
        id: generateId(),
        type: 'customer_retention',
        title: 'معدل الاحتفاظ بالعملاء',
        prediction: retentionRate,
        confidence: 0.8,
        factors: [
          `إجمالي العملاء: ${totalCustomers}`,
          `عملاء عائدون: ${returningCustomers}`,
          `معرضون للرحيل: ${churnRiskCustomers.length}`
        ],
        recommendation: retentionRate < 20
          ? 'معدل الاحتفاظ منخفض - أطلق برنامج ولاء'
          : 'معدل جيد - حافظ على التواصل',
        data: {
          total_customers: totalCustomers,
          returning_customers: returningCustomers,
          churn_risk: churnRiskCustomers.length
        }
      });

      // Customer Lifetime Value
      const avgOrderValue = salesData && salesData.length > 0
        ? salesData.reduce((sum, o) => sum + Number(o.total_amount_sar || 0), 0) / salesData.length
        : 0;
      const avgOrdersPerCustomer = totalCustomers > 0
        ? salesData?.length || 0 / totalCustomers
        : 0;
      const estimatedCLV = avgOrderValue * avgOrdersPerCustomer * 12; // سنوي

      predictions.push({
        id: generateId(),
        type: 'clv',
        title: 'قيمة العميل المتوقعة (CLV)',
        prediction: estimatedCLV,
        confidence: 0.65,
        factors: [
          `متوسط قيمة الطلب: ${avgOrderValue.toFixed(2)} ريال`,
          `متوسط الطلبات/عميل: ${avgOrdersPerCustomer.toFixed(1)}`
        ],
        recommendation: `ركز على العملاء ذوي القيمة العالية`,
        data: { avg_order_value: avgOrderValue, avg_orders_per_customer: avgOrdersPerCustomer }
      });
    }

    // ============ INVENTORY PREDICTIONS ============
    if (type === 'inventory' || type === 'full_report') {
      console.log("📦 Predicting inventory needs...");

      // جلب بيانات المنتجات
      const { data: products } = await supabase
        .from('products')
        .select('id, name, stock_quantity, price_sar')
        .eq('is_active', true)
        .lt('stock_quantity', 50);

      // تحليل سرعة البيع (من الطلبات)
      // هذا تقدير مبسط - في الواقع تحتاج بيانات order_items
      const avgDailySales = (salesData?.length || 0) / daysBack;

      products?.forEach(product => {
        const daysUntilOut = (product.stock_quantity || 0) / Math.max(avgDailySales * 0.1, 0.1);

        if (daysUntilOut < 14) {
          predictions.push({
            id: generateId(),
            type: 'stock_depletion',
            title: `توقع نفاد: ${product.name}`,
            prediction: Math.ceil(daysUntilOut),
            confidence: 0.7,
            factors: [
              `المخزون الحالي: ${product.stock_quantity}`,
              `معدل البيع اليومي المقدر: ${(avgDailySales * 0.1).toFixed(1)}`
            ],
            recommendation: daysUntilOut < 7
              ? '⚠️ أعد الطلب فوراً'
              : 'خطط لإعادة التوريد',
            data: { product_id: product.id, stock: product.stock_quantity, days_until_out: daysUntilOut }
          });
        }
      });
    }

    // ============ TRENDS PREDICTIONS ============
    if (type === 'trends' || type === 'full_report') {
      console.log("📊 Analyzing trends...");

      // استخدام AI لتحليل الاتجاهات
      const summaryData = {
        total_orders: salesData?.length || 0,
        total_revenue: salesData?.reduce((sum, o) => sum + Number(o.total_amount_sar || 0), 0) || 0,
        avg_order_value: salesData && salesData.length > 0
          ? salesData.reduce((sum, o) => sum + Number(o.total_amount_sar || 0), 0) / salesData.length
          : 0,
        period: `آخر ${daysBack} يوم`
      };

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
                content: `أنت محلل بيانات متخصص في التجارة الإلكترونية. قدم 3 توقعات استراتيجية بناءً على البيانات.
استخدم JSON بالتنسيق:
[{"title": "عنوان", "prediction": "التوقع", "confidence": 0.8, "action": "الإجراء المقترح"}]`
              },
              {
                role: "user",
                content: `حلل البيانات التالية وقدم توقعات:\n${JSON.stringify(summaryData)}`
              }
            ],
            stream: false,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content || '';

          try {
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const aiPredictions = JSON.parse(jsonMatch[0]);
              aiPredictions.forEach((p: any) => {
                predictions.push({
                  id: generateId(),
                  type: 'ai_trend',
                  title: p.title,
                  prediction: p.prediction,
                  confidence: p.confidence || 0.7,
                  factors: [],
                  recommendation: p.action
                });
              });
            }
          } catch (parseError) {
            console.warn("Failed to parse AI predictions:", parseError);
          }
        }
      } catch (aiError) {
        console.warn("AI trends analysis failed:", aiError);
      }
    }

    // حفظ التوقعات في الذاكرة
    await supabase.from('brain_memory').insert({
      memory_type: 'prediction',
      title: `تحليل تنبؤي - ${type}`,
      content: `${predictions.length} توقع تم إنشاؤه`,
      importance_score: 6,
      context: { predictions },
      tags: ['تنبؤات', 'تحليلات', type]
    });

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: now.toISOString(),
        type,
        time_range,
        predictions,
        summary: {
          total_predictions: predictions.length,
          high_confidence: predictions.filter(p => p.confidence >= 0.8).length,
          action_required: predictions.filter(p => p.recommendation?.includes('فوراً')).length
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Predictive Analytics error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
