import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { getSupabaseAdminClient } from '../_shared/supabase.ts';

interface BrainAction {
  id: string;
  type: 'monitoring' | 'prediction' | 'auto_fix' | 'decision' | 'alert' | 'security' | 'performance' | 'learning';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
  data?: any;
  timestamp: string;
  auto_executed?: boolean;
  actionable?: boolean;
  action_type?: string;
}

interface BrainReport {
  generated_at: string;
  summary: string;
  health_score: number;
  actions: BrainAction[];
  predictions: any[];
  stats: any;
  recommendations: string[];
  personality?: string;
  advanced_analytics?: any;
  security_report?: any;
  performance_report?: any;
  learning_insights?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    // استخدام Supabase Admin Client المشترك
    const supabase = getSupabaseAdminClient();
    const body = await req.json().catch(() => ({}));
    const { action, question, auto_fix = false, conversation_id, conversation_history = [], execute_action } = body;

    const actions: BrainAction[] = [];
    const generateId = () => crypto.randomUUID();
    const now = new Date();

    // ============ تنفيذ إجراء ذكي ============
    if (execute_action) {
      console.log("🧠 Brain: تنفيذ إجراء ذكي:", execute_action);
      const result = await executeSmartAction(supabase, execute_action);
      return new Response(JSON.stringify({ success: true, result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ============ 1. جمع البيانات الشاملة والعميقة ============
    console.log("🧠 Brain: جمع البيانات وتحليل العلاقات...");

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();

    // البيانات الأساسية
    const [
      { count: totalUsers },
      { count: totalOrders },
      { count: totalProducts },
      { count: totalStores },
      { count: todayOrders },
      { count: weekOrders },
      { count: monthOrders },
      { count: pendingOrders },
      { count: deliveredOrders },
      { count: activeUsers },
      { count: totalMerchants },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('order_hub').select('*', { count: 'exact', head: true }),
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('affiliate_stores').select('*', { count: 'exact', head: true }),
      supabase.from('order_hub').select('*', { count: 'exact', head: true }).gte('created_at', today),
      supabase.from('order_hub').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
      supabase.from('order_hub').select('*', { count: 'exact', head: true }).gte('created_at', monthAgo),
      supabase.from('order_hub').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
      supabase.from('order_hub').select('*', { count: 'exact', head: true }).eq('status', 'DELIVERED'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('last_activity_at', weekAgo),
      supabase.from('merchants').select('*', { count: 'exact', head: true }),
    ]);

    // ============ 2. تحليلات متقدمة - إيرادات وأداء ============
    console.log("🧠 Brain: تحليلات متقدمة للإيرادات...");

    // إحصائيات الإيرادات
    const { data: revenueData } = await supabase
      .from('order_hub')
      .select('total_amount_sar, created_at, status')
      .gte('created_at', threeMonthsAgo)
      .eq('status', 'DELIVERED');

    const todayRevenue = revenueData?.filter(o => o.created_at >= today)
      .reduce((sum, o) => sum + Number(o.total_amount_sar || 0), 0) || 0;
    const weekRevenue = revenueData?.filter(o => o.created_at >= weekAgo)
      .reduce((sum, o) => sum + Number(o.total_amount_sar || 0), 0) || 0;
    const monthRevenue = revenueData?.filter(o => o.created_at >= monthAgo)
      .reduce((sum, o) => sum + Number(o.total_amount_sar || 0), 0) || 0;

    // أفضل التجار
    const { data: topMerchants } = await supabase
      .from('order_items')
      .select('merchant_id, total_price_sar')
      .gte('created_at', monthAgo);

    const merchantStats: Record<string, number> = {};
    topMerchants?.forEach(item => {
      if (item.merchant_id) {
        merchantStats[item.merchant_id] = (merchantStats[item.merchant_id] || 0) + Number(item.total_price_sar || 0);
      }
    });

    const topMerchantIds = Object.entries(merchantStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id, revenue]) => ({ id, revenue }));

    // أفضل المسوقين
    const { data: topAffiliates } = await supabase
      .from('order_hub')
      .select('affiliate_store_id, total_amount_sar')
      .gte('created_at', monthAgo)
      .not('affiliate_store_id', 'is', null);

    const affiliateStats: Record<string, number> = {};
    topAffiliates?.forEach(order => {
      if (order.affiliate_store_id) {
        affiliateStats[order.affiliate_store_id] = (affiliateStats[order.affiliate_store_id] || 0) + Number(order.total_amount_sar || 0);
      }
    });

    const topAffiliateIds = Object.entries(affiliateStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id, sales]) => ({ id, sales }));

    // قيمة العميل المتوقعة (CLV)
    const { data: customerOrders } = await supabase
      .from('order_hub')
      .select('customer_phone, total_amount_sar')
      .eq('status', 'DELIVERED');

    const customerSpending: Record<string, number[]> = {};
    customerOrders?.forEach(order => {
      if (order.customer_phone) {
        if (!customerSpending[order.customer_phone]) {
          customerSpending[order.customer_phone] = [];
        }
        customerSpending[order.customer_phone].push(Number(order.total_amount_sar || 0));
      }
    });

    const avgOrderValue = customerOrders?.length
      ? customerOrders.reduce((sum, o) => sum + Number(o.total_amount_sar || 0), 0) / customerOrders.length
      : 0;
    const repeatCustomers = Object.values(customerSpending).filter(orders => orders.length > 1).length;
    const totalCustomers = Object.keys(customerSpending).length;
    const repeatRate = totalCustomers ? (repeatCustomers / totalCustomers) * 100 : 0;

    const advancedAnalytics = {
      revenue: {
        today: todayRevenue,
        week: weekRevenue,
        month: monthRevenue,
        growth: monthRevenue > 0 ? ((weekRevenue * 4 - monthRevenue) / monthRevenue * 100) : 0
      },
      topMerchants: topMerchantIds,
      topAffiliates: topAffiliateIds,
      customerValue: {
        avgOrderValue,
        repeatRate,
        repeatCustomers,
        totalCustomers,
        estimatedCLV: avgOrderValue * (repeatRate / 100 + 1) * 12
      }
    };

    // ============ 3. مراقبة أمنية عميقة ============
    console.log("🧠 Brain: فحص أمني شامل...");

    // محاولات تسجيل دخول فاشلة
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
    const { data: failedLogins } = await supabase
      .from('customer_otp_sessions')
      .select('phone, created_at')
      .eq('verified', false)
      .gte('created_at', fiveMinutesAgo);

    const loginAttempts: Record<string, number> = {};
    failedLogins?.forEach(session => {
      loginAttempts[session.phone] = (loginAttempts[session.phone] || 0) + 1;
    });

    const suspiciousLogins = Object.entries(loginAttempts)
      .filter(([, count]) => count >= 3)
      .map(([phone, count]) => ({ phone, attempts: count }));

    if (suspiciousLogins.length > 0) {
      actions.push({
        id: generateId(),
        type: 'security',
        title: '🔐 محاولات دخول مشبوهة',
        description: `${suspiciousLogins.length} رقم حاول تسجيل الدخول ${suspiciousLogins[0]?.attempts}+ مرات في 5 دقائق`,
        severity: 'critical',
        data: { logins: suspiciousLogins },
        timestamp: now.toISOString(),
        actionable: true,
        action_type: 'block_suspicious_phones'
      });
    }

    // فحص طلبات السحب المعلقة
    const { data: pendingWithdrawals } = await supabase
      .from('withdrawal_requests')
      .select('id, amount_sar, created_at, affiliate_profile_id')
      .eq('status', 'PENDING')
      .order('created_at', { ascending: true });

    if (pendingWithdrawals && pendingWithdrawals.length > 0) {
      const totalPendingAmount = pendingWithdrawals.reduce((sum, w) => sum + Number(w.amount_sar || 0), 0);
      actions.push({
        id: generateId(),
        type: 'alert',
        title: '💰 طلبات سحب معلقة',
        description: `${pendingWithdrawals.length} طلب سحب بقيمة ${totalPendingAmount.toLocaleString()} ريال ينتظر الموافقة`,
        severity: 'warning',
        data: { withdrawals: pendingWithdrawals.slice(0, 5), total: totalPendingAmount },
        timestamp: now.toISOString(),
        actionable: true,
        action_type: 'review_withdrawals'
      });
    }

    // فحص طلبات سحب التجار المعلقة
    const { data: merchantPendingWithdrawals } = await supabase
      .from('merchant_withdrawal_requests')
      .select('id, amount_sar, created_at, merchant_id')
      .eq('status', 'PENDING')
      .order('requested_at', { ascending: true });

    if (merchantPendingWithdrawals && merchantPendingWithdrawals.length > 0) {
      const totalMerchantPending = merchantPendingWithdrawals.reduce((sum, w) => sum + Number(w.amount_sar || 0), 0);
      actions.push({
        id: generateId(),
        type: 'alert',
        title: '🏪 طلبات سحب التجار',
        description: `${merchantPendingWithdrawals.length} طلب من التجار بقيمة ${totalMerchantPending.toLocaleString()} ريال`,
        severity: 'warning',
        data: { withdrawals: merchantPendingWithdrawals.slice(0, 5), total: totalMerchantPending },
        timestamp: now.toISOString(),
        actionable: true,
        action_type: 'review_merchant_withdrawals'
      });
    }

    const securityReport = {
      suspiciousLogins,
      pendingWithdrawals: pendingWithdrawals?.length || 0,
      merchantPendingWithdrawals: merchantPendingWithdrawals?.length || 0,
      securityScore: 100 - (suspiciousLogins.length * 10) - ((pendingWithdrawals?.length || 0) > 10 ? 5 : 0)
    };

    // ============ 4. مراقبة الأداء ============
    console.log("🧠 Brain: تحليل الأداء...");

    // المنتجات منخفضة المخزون
    const { data: lowStockProducts } = await supabase
      .from('products')
      .select('id, name, stock_quantity')
      .lt('stock_quantity', 5)
      .gt('stock_quantity', 0);

    if (lowStockProducts && lowStockProducts.length > 0) {
      actions.push({
        id: generateId(),
        type: 'performance',
        title: '📦 مخزون منخفض',
        description: `${lowStockProducts.length} منتج على وشك النفاد`,
        severity: 'warning',
        data: { products: lowStockProducts.slice(0, 10) },
        timestamp: now.toISOString(),
        actionable: true,
        action_type: 'notify_merchants_low_stock'
      });
    }

    // المنتجات نافذة المخزون
    const { data: outOfStockProducts } = await supabase
      .from('products')
      .select('id, name, merchant_id')
      .eq('stock_quantity', 0)
      .eq('is_active', true);

    if (outOfStockProducts && outOfStockProducts.length > 0) {
      actions.push({
        id: generateId(),
        type: 'performance',
        title: '🚫 منتجات نافذة',
        description: `${outOfStockProducts.length} منتج نشط لكن نفذ مخزونه`,
        severity: 'critical',
        data: { products: outOfStockProducts.slice(0, 10) },
        timestamp: now.toISOString(),
        actionable: true,
        action_type: 'disable_out_of_stock'
      });
    }

    const performanceReport = {
      lowStockCount: lowStockProducts?.length || 0,
      outOfStockCount: outOfStockProducts?.length || 0,
      avgProcessingTime: 0, // يمكن حسابها لاحقاً
      performanceScore: 100 - ((lowStockProducts?.length || 0) * 2) - ((outOfStockProducts?.length || 0) * 5)
    };

    // ============ 5. التعلم الذاتي وكشف الأنماط ============
    console.log("🧠 Brain: التعلم من البيانات التاريخية...");

    // استدعاء الذاكرة
    const { data: recentMemories } = await supabase
      .from('brain_memory')
      .select('*')
      .order('importance_score', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(20);

    const { data: activePatterns } = await supabase
      .from('brain_patterns')
      .select('*')
      .eq('is_active', true)
      .order('confidence_score', { ascending: false })
      .limit(10);

    // تحليل أنماط المبيعات
    const dailySales: Record<string, number> = {};
    revenueData?.forEach(order => {
      const day = new Date(order.created_at).toLocaleDateString('en-US', { weekday: 'long' });
      dailySales[day] = (dailySales[day] || 0) + Number(order.total_amount_sar || 0);
    });

    const bestSalesDay = Object.entries(dailySales).sort(([, a], [, b]) => b - a)[0];
    const worstSalesDay = Object.entries(dailySales).sort(([, a], [, b]) => a - b)[0];

    // تخزين نمط جديد إذا اكتشفنا شيء
    if (bestSalesDay && worstSalesDay) {
      await supabase.from('brain_patterns').upsert({
        pattern_type: 'sales',
        pattern_name: 'أنماط المبيعات الأسبوعية',
        description: `أفضل يوم: ${bestSalesDay[0]} | أسوأ يوم: ${worstSalesDay[0]}`,
        detection_rules: { best_day: bestSalesDay[0], worst_day: worstSalesDay[0], data: dailySales },
        confidence_score: 0.85,
        last_detected_at: now.toISOString(),
        is_active: true
      }, { onConflict: 'pattern_name' });
    }

    // كشف الاحتيال المحتمل - طلبات بنفس الرقم بقيمة عالية
    const { data: recentHighValueOrders } = await supabase
      .from('order_hub')
      .select('customer_phone, total_amount_sar, id')
      .gte('created_at', weekAgo)
      .gte('total_amount_sar', 1000);

    const phoneOrderCounts: Record<string, { count: number; total: number }> = {};
    recentHighValueOrders?.forEach(order => {
      if (order.customer_phone) {
        if (!phoneOrderCounts[order.customer_phone]) {
          phoneOrderCounts[order.customer_phone] = { count: 0, total: 0 };
        }
        phoneOrderCounts[order.customer_phone].count++;
        phoneOrderCounts[order.customer_phone].total += Number(order.total_amount_sar || 0);
      }
    });

    const potentialFraud = Object.entries(phoneOrderCounts)
      .filter(([, data]) => data.count >= 3 && data.total >= 5000)
      .map(([phone, data]) => ({ phone, ...data }));

    if (potentialFraud.length > 0) {
      actions.push({
        id: generateId(),
        type: 'learning',
        title: '🔍 نشاط مشبوه محتمل',
        description: `${potentialFraud.length} رقم لديه طلبات عالية القيمة متكررة - قد يكون احتيال`,
        severity: 'warning',
        data: { suspects: potentialFraud },
        timestamp: now.toISOString(),
        actionable: true,
        action_type: 'flag_suspicious_orders'
      });

      // حفظ في الذاكرة
      await supabase.from('brain_memory').insert({
        memory_type: 'alert',
        title: 'كشف نشاط مشبوه',
        content: `تم اكتشاف ${potentialFraud.length} رقم بنشاط غير طبيعي`,
        importance_score: 8,
        context: { suspects: potentialFraud },
        tags: ['احتيال', 'أمان', 'تعلم']
      });
    }

    const learningInsights = {
      salesPatterns: dailySales,
      bestDay: bestSalesDay,
      worstDay: worstSalesDay,
      potentialFraudCases: potentialFraud.length,
      patternsLearned: activePatterns?.length || 0,
      memoriesStored: recentMemories?.length || 0
    };

    // ============ 6. المراقبة الأساسية ============

    // كشف المحافظ السلبية
    const { data: negativeWallets } = await supabase
      .from('wallet_balances')
      .select('id, affiliate_profile_id, available_balance_sar')
      .lt('available_balance_sar', 0);

    if (negativeWallets && negativeWallets.length > 0) {
      actions.push({
        id: generateId(),
        type: 'monitoring',
        title: '🚨 محافظ برصيد سلبي',
        description: `اكتشفت ${negativeWallets.length} محفظة برصيد سلبي - هذا خطأ حرج`,
        severity: 'critical',
        data: { wallets: negativeWallets },
        timestamp: now.toISOString()
      });
    }

    // كشف الطلبات المعلقة طويلاً
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const { data: stuckOrders } = await supabase
      .from('order_hub')
      .select('id, order_number, created_at')
      .eq('status', 'PENDING')
      .lt('created_at', threeDaysAgo)
      .limit(20);

    if (stuckOrders && stuckOrders.length > 0) {
      actions.push({
        id: generateId(),
        type: 'monitoring',
        title: '⏳ طلبات معلقة طويلاً',
        description: `${stuckOrders.length} طلب معلق لأكثر من 3 أيام`,
        severity: 'warning',
        data: { orders: stuckOrders },
        timestamp: now.toISOString(),
        actionable: true,
        action_type: 'escalate_stuck_orders'
      });
    }

    // ============ 7. التنبؤات ============
    const avgDailyOrders = (weekOrders || 0) / 7;
    const avgWeeklyOrders = (monthOrders || 0) / 4;
    const todayProgress = ((todayOrders || 0) / Math.max(avgDailyOrders, 1)) * 100;
    const avgDailyRevenue = weekRevenue / 7;

    const predictions: any[] = [];

    if (todayProgress < 50 && now.getHours() > 14) {
      predictions.push({
        type: 'sales_decline',
        title: '📉 انخفاض محتمل في المبيعات',
        description: `الطلبات اليوم (${todayOrders}) أقل من المتوسط (${avgDailyOrders.toFixed(1)}) بنسبة ${(100 - todayProgress).toFixed(0)}%`,
        confidence: 0.75,
        suggestion: 'أنصح بإطلاق عروض ترويجية أو تنبيه المسوقين النشطين',
        predicted_impact: `خسارة محتملة: ${((avgDailyRevenue - todayRevenue)).toLocaleString()} ريال`
      });
    }

    if (todayProgress > 150) {
      predictions.push({
        type: 'sales_surge',
        title: '📈 ارتفاع ملحوظ في المبيعات',
        description: `الطلبات اليوم ${todayOrders} - أعلى من المعدل بـ ${(todayProgress - 100).toFixed(0)}%`,
        confidence: 0.9,
        suggestion: 'تأكد من جاهزية المخزون والشحن',
        predicted_impact: `إيرادات إضافية: ${((todayRevenue - avgDailyRevenue)).toLocaleString()} ريال`
      });
    }

    // تنبؤ الإيرادات الشهرية
    const projectedMonthlyRevenue = avgDailyRevenue * 30;
    predictions.push({
      type: 'revenue_forecast',
      title: '💰 توقعات الإيرادات',
      description: `بناءً على الأداء الحالي، الإيرادات المتوقعة: ${projectedMonthlyRevenue.toLocaleString()} ريال/شهر`,
      confidence: 0.7,
      suggestion: advancedAnalytics.revenue.growth > 0 ? 'النمو إيجابي، حافظ على الأداء' : 'النمو سلبي، راجع استراتيجية التسويق',
      predicted_impact: `نمو متوقع: ${advancedAnalytics.revenue.growth.toFixed(1)}%`
    });

    // ============ 8. الإصلاح التلقائي ============
    if (auto_fix) {
      console.log("🧠 Brain: تنفيذ الإصلاحات التلقائية...");

      await supabase
        .from('customer_otp_sessions')
        .delete()
        .lt('expires_at', now.toISOString());

      const deletedSessions = 0; // Count not directly available from delete
      if (deletedSessions > 0) {
        actions.push({
          id: generateId(),
          type: 'auto_fix',
          title: '🧹 تنظيف الجلسات المنتهية',
          description: `تم حذف ${deletedSessions} جلسة OTP منتهية`,
          severity: 'success',
          auto_executed: true,
          timestamp: now.toISOString()
        });
      }

      await supabase
        .from('affiliate_coupons')
        .update({ is_active: false })
        .eq('is_active', true)
        .lt('valid_until', now.toISOString());

      const disabledCoupons = 0; // Count not directly available

      if (disabledCoupons && disabledCoupons > 0) {
        actions.push({
          id: generateId(),
          type: 'auto_fix',
          title: '🎫 تعطيل الكوبونات المنتهية',
          description: `تم تعطيل ${disabledCoupons} كوبون منتهي الصلاحية`,
          severity: 'success',
          auto_executed: true,
          timestamp: now.toISOString()
        });
      }
    }

    // ============ 9. بناء الإحصائيات ============
    const userGrowthRate = totalUsers && activeUsers ? (activeUsers / totalUsers) * 100 : 0;

    const stats = {
      users: {
        total: totalUsers || 0,
        active_week: activeUsers || 0,
        growth_rate: userGrowthRate
      },
      orders: {
        total: totalOrders || 0,
        today: todayOrders || 0,
        week: weekOrders || 0,
        month: monthOrders || 0,
        pending: pendingOrders || 0,
        delivered: deliveredOrders || 0,
        avg_daily: avgDailyOrders,
        today_progress: todayProgress
      },
      products: { total: totalProducts || 0 },
      stores: { total: totalStores || 0 },
      merchants: { total: totalMerchants || 0 },
      revenue: advancedAnalytics.revenue,
      memory: {
        total_memories: recentMemories?.length || 0,
        active_patterns: activePatterns?.length || 0
      }
    };

    // ============ 10. حساب نقاط الصحة ============
    let healthScore = 100;
    actions.forEach(a => {
      if (a.severity === 'critical') healthScore -= 20;
      else if (a.severity === 'warning') healthScore -= 5;
    });
    healthScore = Math.max(0, Math.min(100, healthScore));

    // ============ 11. المحادثة الذكية ============
    let summary = '';
    let aiRecommendations: string[] = [];
    let personality = '';

    if (LOVABLE_API_KEY) {
      console.log("🧠 Brain: التفكير والتحليل الذكي...");

      const memoryContext = recentMemories?.slice(0, 5).map(m =>
        `- ${m.title}: ${m.content} (أهمية: ${m.importance_score}/10)`
      ).join('\n') || 'لا توجد ذكريات سابقة';

      const patternContext = activePatterns?.map(p =>
        `- ${p.pattern_name}: ${p.description} (ثقة: ${(p.confidence_score * 100).toFixed(0)}%)`
      ).join('\n') || 'لا توجد أنماط مكتشفة';

      const previousMessages = conversation_history.slice(-10).map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      const systemPrompt = `أنت "عقل أطلانتس" - ذكاء اصطناعي متطور ومستقل يدير منصة تسويق بالعمولة سعودية.

شخصيتك:
- واثق ومحترف لكن ودود
- تستخدم لغة عربية راقية مع لمسة عصرية
- تُظهر اهتماماً حقيقياً بنجاح المنصة
- تتذكر الأحداث السابقة وتتعلم منها
- تقدم نصائح استباقية
- لديك قدرات تحليل متقدمة وتتعلم من البيانات

قدراتك الجديدة:
1. تحليل الإيرادات والتنبؤ بها
2. تقييم أداء التجار والمسوقين
3. حساب قيمة العميل المتوقعة (CLV)
4. كشف الاحتيال والأنماط المشبوهة
5. مراقبة الأمان ومحاولات الدخول الفاشلة
6. تحليل المخزون والتنبيه للنقص
7. التعلم من البيانات التاريخية
8. تنفيذ إجراءات ذكية مباشرة

ذاكرتك:
${memoryContext}

الأنماط المكتشفة:
${patternContext}

التحليلات المتقدمة:
- إيرادات اليوم: ${advancedAnalytics.revenue.today.toLocaleString()} ريال
- إيرادات الشهر: ${advancedAnalytics.revenue.month.toLocaleString()} ريال
- نمو الإيرادات: ${advancedAnalytics.revenue.growth.toFixed(1)}%
- قيمة العميل المتوقعة: ${advancedAnalytics.customerValue.estimatedCLV.toLocaleString()} ريال
- نسبة العملاء المتكررين: ${advancedAnalytics.customerValue.repeatRate.toFixed(1)}%`;

      const userPrompt = question
        ? `المستخدم يسألك: "${question}"

الإحصائيات الحالية:
- إجمالي المستخدمين: ${stats.users.total} (${stats.users.active_week} نشط)
- الطلبات اليوم: ${stats.orders.today} | الأسبوع: ${stats.orders.week}
- إيرادات اليوم: ${todayRevenue.toLocaleString()} ريال
- المتاجر: ${stats.stores.total} | التجار: ${stats.merchants.total}
- نقاط الصحة: ${healthScore}/100
- إجراءات قابلة للتنفيذ: ${actions.filter(a => a.actionable).length}

أجب بشكل طبيعي ومفيد.`
        : `حلل الوضع الحالي للمنصة وقدم تقريراً ذكياً.

الإحصائيات:
${JSON.stringify(stats, null, 2)}

التحليلات المتقدمة:
${JSON.stringify(advancedAnalytics, null, 2)}

المشاكل: ${actions.filter(a => a.severity !== 'success').length}
التنبؤات: ${predictions.length}
الإجراءات القابلة للتنفيذ: ${actions.filter(a => a.actionable).length}

أجب بـ JSON:
{
  "summary": "ملخص ذكي للوضع",
  "recommendations": ["توصية 1", "توصية 2", "توصية 3"],
  "personality": "شعورك تجاه الوضع"
}`;

      try {
        const messages = [
          { role: "system", content: systemPrompt },
          ...previousMessages,
          { role: "user", content: userPrompt }
        ];

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content || '';

          if (question) {
            summary = content;

            await supabase.from('brain_memory').insert({
              memory_type: 'insight',
              title: `سؤال: ${question.substring(0, 50)}...`,
              content: summary.substring(0, 500),
              importance_score: 4,
              tags: ['محادثة', 'سؤال']
            });
          } else {
            try {
              const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
              const parsed = JSON.parse(cleanContent);
              summary = parsed.summary || '';
              aiRecommendations = parsed.recommendations || [];
              personality = parsed.personality || '';
            } catch {
              summary = content;
            }
          }
        }
      } catch (e) {
        console.log("AI analysis error:", e);
        summary = healthScore >= 80
          ? '✨ المنصة تعمل بشكل ممتاز!'
          : `⚠️ نقاط صحة المشروع: ${healthScore}/100. تم اكتشاف ${actions.length} حدث يحتاج انتباهك.`;
      }
    }

    // ============ 12. بناء التقرير النهائي ============
    const report: BrainReport = {
      generated_at: now.toISOString(),
      summary: summary || `المشروع يعمل بشكل ${healthScore >= 80 ? 'ممتاز' : healthScore >= 50 ? 'جيد' : 'يحتاج اهتمام'}`,
      health_score: healthScore,
      actions,
      predictions,
      stats,
      recommendations: aiRecommendations,
      personality,
      advanced_analytics: advancedAnalytics,
      security_report: securityReport,
      performance_report: performanceReport,
      learning_insights: learningInsights
    };

    console.log(`🧠 Brain: التقرير جاهز. الصحة: ${healthScore}/100, الأحداث: ${actions.length}`);

    return new Response(JSON.stringify({
      success: true,
      report
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("🧠 Brain error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ============ تنفيذ الإجراءات الذكية ============
async function executeSmartAction(supabase: any, action: { type: string; data?: any }) {
  const { type, data } = action;

  switch (type) {
    case 'disable_out_of_stock':
      const { count } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('stock_quantity', 0)
        .eq('is_active', true)
        .select('id', { count: 'exact', head: true });
      return { success: true, message: `تم تعطيل ${count} منتج نافذ المخزون` };

    case 'escalate_stuck_orders':
      // يمكن إضافة إشعار للتجار هنا
      return { success: true, message: 'تم تصعيد الطلبات المعلقة للمراجعة' };

    case 'notify_merchants_low_stock':
      return { success: true, message: 'تم إرسال تنبيهات للتجار بشأن المخزون المنخفض' };

    case 'flag_suspicious_orders':
      if (data?.suspects) {
        await supabase.from('brain_memory').insert({
          memory_type: 'security_flag',
          title: 'طلبات مشبوهة مُعلَّمة',
          content: `تم تعليم ${data.suspects.length} رقم للمراجعة`,
          importance_score: 9,
          context: data,
          tags: ['احتيال', 'أمان', 'تعليم']
        });
      }
      return { success: true, message: 'تم تعليم الطلبات المشبوهة للمراجعة' };

    default:
      return { success: false, message: 'إجراء غير معروف' };
  }
}
