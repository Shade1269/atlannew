import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  Copy,
  Download,
  FileText,
  Home,
  Loader2,
  Package,
  RotateCcw,
  Share2,
  ShoppingBag,
  MapPin,
  Phone,
  Mail,
  Truck,
  CreditCard,
  RefreshCw,
  ExternalLink,
  Clock,
  BadgeCheck,
  
} from "lucide-react";
import { toast } from "sonner";

import { UnifiedButton } from "@/components/design-system";
import { Skeleton } from "@/components/ui";
import { supabase } from "@/integrations/supabase/client";
import { VisuallyHidden } from "@/components/app-shell/VisuallyHidden";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { ReturnRequestDialog } from "@/components/orders";

interface OrderItem {
  id: string;
  product_title: string;
  product_image_url?: string | null;
  quantity: number;
  unit_price_sar: number;
  total_price_sar: number | null;
}

interface OrderDetails {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  shipping_address: {
    street?: string;
    city?: string;
    district?: string;
    postal_code?: string;
    country?: string;
    notes?: string | null;
  } | null;
  subtotal_sar: number;
  shipping_sar: number;
  tax_sar: number;
  total_sar: number;
  payment_status: string;
  payment_method: string;
  status: string;
  created_at: string;
  items: OrderItem[];
  zoho_invoice_id?: string | null;
  zoho_invoice_number?: string | null;
  zoho_invoice_url?: string | null;
  tracking_number?: string | null;
}

interface OrderConfirmationProps {
  navigateOverride?: (path: string) => void;
  supabaseOverride?: typeof supabase;
  orderOverride?: OrderDetails | null;
  errorOverride?: string | null;
  loadingOverride?: boolean;
}

const formatCurrency = (value: number) => {
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.max(0, value));
  return `${formatted} ر.س`;
};

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  PENDING: { label: "قيد المعالجة", color: "text-amber-600", bgColor: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800", icon: <Clock className="h-4 w-4" /> },
  CONFIRMED: { label: "تم التأكيد", color: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800", icon: <BadgeCheck className="h-4 w-4" /> },
  PROCESSING: { label: "يتم تجهيز الطلب", color: "text-purple-600", bgColor: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800", icon: <Package className="h-4 w-4" /> },
  SHIPPED: { label: "تم الشحن", color: "text-indigo-600", bgColor: "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800", icon: <Truck className="h-4 w-4" /> },
  DELIVERED: { label: "تم التسليم", color: "text-green-600", bgColor: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800", icon: <CheckCircle2 className="h-4 w-4" /> },
  CANCELLED: { label: "ملغي", color: "text-red-600", bgColor: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800", icon: <RotateCcw className="h-4 w-4" /> },
};

const paymentStatusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: "بانتظار السداد", color: "text-amber-600" },
  PAID: { label: "تم الدفع", color: "text-green-600" },
  FAILED: { label: "فشل الدفع", color: "text-red-600" },
  REFUNDED: { label: "مسترجع", color: "text-gray-600" },
};

const paymentMethodLabels: Record<string, string> = {
  cod: "الدفع عند الاستلام",
  COD: "الدفع عند الاستلام",
  CREDIT_CARD: "بطاقة ائتمان",
  geidea: "جيديا",
  tamara: "تمارا",
};

const formatDate = (timestamp: string) => {
  try {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return timestamp;
  }
};

const OrderConfirmationSimple: React.FC<OrderConfirmationProps> = ({
  navigateOverride,
  supabaseOverride,
  orderOverride,
  errorOverride,
  loadingOverride,
}) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const navigateHook = useNavigate();
  const navigate = navigateOverride ?? navigateHook;
  const [searchParams] = useSearchParams();
  const params = useParams<{ orderId?: string; slug?: string }>();
  const orderId = searchParams.get("orderId") ?? params.orderId ?? "";
  const storeSlug = searchParams.get("slug") ?? params.slug ?? undefined;
  const [showReturnDialog, setShowReturnDialog] = useState(false);

  const overrideProvided = typeof orderOverride !== "undefined";
  const [order, setOrder] = useState<OrderDetails | null>(orderOverride ?? null);
  const [loading, setLoading] = useState<boolean>(
    typeof loadingOverride === "boolean" ? loadingOverride : !overrideProvided,
  );
  const [error, setError] = useState<string | null>(
    typeof errorOverride === "string" ? errorOverride : null,
  );
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const supabaseClient = supabaseOverride ?? supabase;
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://atlback-8yq4.vercel.app';

  const fetchOrder = useCallback(async (showRefreshIndicator = false) => {
    if (!orderId) return;
    
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // جلب الطلب من order_hub أولاً
      let hubData: any = null;
      const { data: hubResult, error: hubError } = await supabaseClient
        .from("order_hub")
        .select("*, tracking_number")
        .eq("id", orderId)
        .maybeSingle();

      if (!hubError && hubResult) {
        hubData = hubResult;
      } else {
        const { data: hubBySource } = await supabaseClient
          .from("order_hub")
          .select("*, tracking_number")
          .eq("source_order_id", orderId)
          .maybeSingle();
        
        if (hubBySource) {
          hubData = hubBySource;
        }
      }

      let orderDetails: any = null;
      let items: OrderItem[] = [];

      if (!hubData) {
        const { data: ecomData, error: ecomError } = await supabaseClient
          .from("ecommerce_orders")
          .select("*, ecommerce_order_items(*), zoho_invoice_id, zoho_invoice_number, zoho_invoice_url, tracking_number")
          .eq("id", orderId)
          .maybeSingle();
        
        if (ecomError || !ecomData) {
          setOrder(null);
          setError("لم يتم العثور على الطلب");
          return;
        }
        
        orderDetails = ecomData;
        items = ecomData.ecommerce_order_items || [];
        
        setOrder({
          id: ecomData.id,
          order_number: ecomData.order_number || ecomData.id,
          customer_name: ecomData.customer_name || '',
          customer_phone: ecomData.customer_phone || '',
          customer_email: ecomData.customer_email,
          shipping_address: ecomData.shipping_address as any,
          subtotal_sar: ecomData.subtotal_sar || 0,
          shipping_sar: ecomData.shipping_sar || 0,
          tax_sar: ecomData.tax_sar || 0,
          total_sar: ecomData.total_sar || 0,
          payment_status: ecomData.payment_status || 'PENDING',
          payment_method: ecomData.payment_method || 'cod',
          status: ecomData.status || 'PENDING',
          created_at: ecomData.created_at,
          items: items.map(item => ({
            id: item.id,
            product_title: item.product_title,
            product_image_url: item.product_image_url,
            quantity: item.quantity,
            unit_price_sar: item.unit_price_sar,
            total_price_sar: item.total_price_sar
          })),
          zoho_invoice_id: ecomData.zoho_invoice_id || null,
          zoho_invoice_number: ecomData.zoho_invoice_number || null,
          zoho_invoice_url: ecomData.zoho_invoice_url || null,
          tracking_number: ecomData.tracking_number || null,
        });
        setError(null);
        return;
      }

      if (hubData.source === 'ecommerce') {
        const { data: ecomData } = await supabaseClient
          .from("ecommerce_orders")
          .select("*, ecommerce_order_items(*), zoho_invoice_id, zoho_invoice_number, zoho_invoice_url, tracking_number")
          .eq("id", hubData.source_order_id)
          .maybeSingle();
        
        if (ecomData) {
          orderDetails = ecomData;
          items = ecomData.ecommerce_order_items || [];
        }
      } else if (hubData.source === 'simple') {
        const { data: simpleData } = await supabaseClient
          .from("simple_orders")
          .select("*, simple_order_items(*)")
          .eq("id", hubData.source_order_id)
          .maybeSingle();
        
        if (simpleData) {
          orderDetails = simpleData;
          items = simpleData.simple_order_items || [];
        }
      }

      // حفظ source_order_id للتوجيه
      const sourceOrderId = hubData.source_order_id || hubData.id || orderId;
      
      setOrder({
        id: sourceOrderId, // استخدام source_order_id للتوجيه
        order_number: hubData.order_number || hubData.id,
        customer_name: hubData.customer_name || '',
        customer_phone: hubData.customer_phone || '',
        customer_email: hubData.customer_email,
        shipping_address: orderDetails?.shipping_address || hubData.shipping_address as any,
        subtotal_sar: orderDetails?.subtotal_sar || hubData.total_amount_sar || 0,
        shipping_sar: orderDetails?.shipping_sar || 0,
        tax_sar: orderDetails?.tax_sar || 0,
        total_sar: hubData.total_amount_sar || 0,
        payment_status: hubData.payment_status || 'PENDING',
        payment_method: hubData.payment_method || 'cod',
        status: hubData.status || 'PENDING',
        created_at: hubData.created_at,
        items: items.map(item => ({
          id: item.id,
          product_title: item.product_title,
          product_image_url: item.product_image_url,
          quantity: item.quantity,
          unit_price_sar: item.unit_price_sar,
          total_price_sar: item.total_price_sar
        })),
        zoho_invoice_id: orderDetails?.zoho_invoice_id || null,
        zoho_invoice_number: orderDetails?.zoho_invoice_number || null,
        zoho_invoice_url: orderDetails?.zoho_invoice_url || null,
        tracking_number: orderDetails?.tracking_number || hubData.tracking_number || null,
      });
      setError(null);
    } catch (err) {
      console.error("failed to load order", err);
      setError("حدث خطأ أثناء جلب تفاصيل الطلب");
      setOrder(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderId, supabaseClient]);

  useEffect(() => {
    if (overrideProvided) {
      setLoading(typeof loadingOverride === "boolean" ? loadingOverride : false);
      if (typeof orderOverride !== "undefined") {
        setOrder(orderOverride);
      }
      setError(errorOverride ?? null);
      return;
    }

    if (!orderId) {
      setLoading(false);
      setOrder(null);
      setError("لم يتم تحديد الطلب");
      return;
    }

    void fetchOrder();
    
    // إعادة جلب البيانات بعد 4 ثواني للتأكد من التقاط الفاتورة
    const refreshTimer = setTimeout(() => {
      if (!overrideProvided && orderId) {
        void fetchOrder(true);
      }
    }, 4000);
    
    return () => clearTimeout(refreshTimer);
  }, [orderId, overrideProvided, orderOverride, errorOverride, loadingOverride, fetchOrder]);

  const statusInfo = order ? statusConfig[order.status] ?? statusConfig.PENDING : statusConfig.PENDING;
  const paymentInfo = order ? paymentStatusConfig[order.payment_status] ?? paymentStatusConfig.PENDING : paymentStatusConfig.PENDING;

  const totals = useMemo(() => {
    if (!order) return null;
    return [
      { label: "المجموع الفرعي", value: formatCurrency(order.subtotal_sar) },
      { label: "الشحن", value: order.shipping_sar > 0 ? formatCurrency(order.shipping_sar) : "مجاني" },
      { label: "الضريبة (15%)", value: formatCurrency(order.tax_sar) },
    ];
  }, [order]);

  const copyOrderNumber = () => {
    if (!order) return;
    void navigator.clipboard
      .writeText(order.order_number || order.id)
      .then(() => toast.success("تم نسخ رقم الطلب"))
      .catch(() => toast.error("تعذر نسخ رقم الطلب"));
  };

  const shareOrder = () => {
    if (!order) return;
    if (navigator.share) {
      void navigator.share({
        title: "تفاصيل الطلب",
        text: `رقم الطلب: ${order.order_number}\nالإجمالي: ${formatCurrency(order.total_sar)}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      copyOrderNumber();
    }
  };

  const downloadInvoicePdf = async () => {
    if (!order?.zoho_invoice_id) {
      toast.error("الفاتورة غير متوفرة حالياً");
      return;
    }
    
    try {
      setDownloadingPdf(true);
      toast.loading("جاري تحميل الفاتورة...", { id: "download-pdf" });
      
      const response = await fetch(
        `${BACKEND_URL}/api/zoho/invoice?id=${order.zoho_invoice_id}&format=pdf`
      );
      
      if (!response.ok) {
        throw new Error('فشل في تحميل الفاتورة');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `فاتورة-${order.zoho_invoice_number || order.order_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('تم تحميل الفاتورة بنجاح', { id: "download-pdf" });
    } catch (err) {
      console.error('Error downloading invoice:', err);
      toast.error('فشل في تحميل الفاتورة، حاول مرة أخرى', { id: "download-pdf" });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const goToStore = () => {
    // محاولة الحصول على slug المتجر من مصادر متعددة
    let targetSlug = storeSlug;
    
    // محاولة من localStorage
    if (!targetSlug) {
      const savedStoreSlug = localStorage.getItem('current_store_slug');
      if (savedStoreSlug) {
        targetSlug = savedStoreSlug;
      }
    }
    
    console.log('[GoToStore] Target slug:', targetSlug);
    
    if (targetSlug) {
      // التوجيه للمتجر - بدون /store/ لأن المتاجر على الجذر
      navigate(`/${targetSlug}`);
    } else {
      // إذا لم نجد slug، نذهب للصفحة الرئيسية
      navigate("/");
    }
  };

  const handleRefresh = () => {
    void fetchOrder(true);
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <div className="space-y-6">
            <Skeleton height={120} radius="xl" />
            <Skeleton height={300} radius="xl" />
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton height={200} radius="xl" />
              <Skeleton height={200} radius="xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-6 px-4 py-20 text-center">
          <div className="rounded-full bg-red-100 p-6 dark:bg-red-900/30">
            <Package className="h-16 w-16 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">لم يتم العثور على الطلب</h1>
          <p className="text-slate-600 dark:text-slate-400">{error ?? "تحقق من الرابط أو حاول مرة أخرى لاحقاً."}</p>
          <UnifiedButton variant="primary" size="lg" onClick={() => navigate("/")}>
            العودة للصفحة الرئيسية
          </UnifiedButton>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/5 dark:from-slate-950 dark:via-slate-900 dark:to-primary/5"
      data-reduced-motion={prefersReducedMotion ? "true" : undefined}
    >
      <VisuallyHidden aria-live="polite">
        تم إنشاء الطلب بنجاح. رقم الطلب {order.order_number}. حالة الطلب {statusInfo.label}.
      </VisuallyHidden>

      <div className="mx-auto max-w-4xl px-4 py-8 md:py-12">
        {/* Success Header */}
        <header className="mb-8 text-center">
          <div className="relative mx-auto mb-6 inline-flex">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/30" style={{ animationDuration: '2s' }} />
            <div className="relative rounded-full bg-primary p-4 shadow-lg shadow-primary/30">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-slate-900 dark:text-white">
            شكراً لطلبك! 🎉
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            تم استلام طلبك بنجاح وسنتواصل معك قريباً
          </p>
        </header>

        {/* Order Number Card */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 p-6 text-white shadow-xl dark:from-slate-800 dark:to-slate-900">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div>
              <p className="mb-1 text-sm text-slate-400">رقم الطلب</p>
              <p className="font-mono text-2xl font-bold tracking-wider">{order.order_number}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyOrderNumber}
                className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/20"
              >
                <Copy className="h-4 w-4" />
                نسخ
              </button>
              <button
                onClick={shareOrder}
                className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/20"
              >
                <Share2 className="h-4 w-4" />
                مشاركة
              </button>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className={`mb-6 flex items-center justify-center gap-3 rounded-xl border p-4 ${statusInfo.bgColor}`}>
          <span className={statusInfo.color}>{statusInfo.icon}</span>
          <span className={`font-semibold ${statusInfo.color}`}>{statusInfo.label}</span>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`mr-auto rounded-lg p-2 transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${refreshing ? 'animate-spin' : ''}`}
            title="تحديث الحالة"
          >
            <RefreshCw className={`h-4 w-4 ${statusInfo.color}`} />
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Main Content - Order Details */}
          <div className="space-y-6 lg:col-span-3">
            {/* Products List */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                  <Package className="h-5 w-5 text-slate-500" />
                  المنتجات ({order.items.length})
                </h2>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {order.items.length > 0 ? (
                  order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4">
                      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                        <img
                          src={item.product_image_url || "/placeholder.svg"}
                          alt={item.product_title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 dark:text-white truncate">{item.product_title}</p>
                        <p className="text-sm text-slate-500">الكمية: {item.quantity}</p>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {formatCurrency(item.total_price_sar ?? item.unit_price_sar * item.quantity)}
                        </p>
                        {item.quantity > 1 && (
                          <p className="text-xs text-slate-500">{formatCurrency(item.unit_price_sar)} للقطعة</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-500">
                    <Package className="mx-auto mb-2 h-8 w-8 opacity-50" />
                    <p>لا توجد منتجات</p>
                  </div>
                )}
              </div>
              
              {/* Totals */}
              <div className="border-t border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-800/50">
                <div className="space-y-2">
                  {totals?.map((row) => (
                    <div key={row.label} className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                      <span>{row.label}</span>
                      <span>{row.value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-between border-t border-slate-200 pt-4 dark:border-slate-700">
                  <span className="text-lg font-bold text-slate-900 dark:text-white">الإجمالي</span>
                  <span className="text-xl font-bold text-primary">{formatCurrency(order.total_sar)}</span>
                </div>
              </div>
            </div>

            {/* Invoice Section */}
            <div className={`overflow-hidden rounded-2xl border-2 ${
              order.zoho_invoice_id 
                ? 'border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 dark:border-primary/30 dark:from-primary/5 dark:to-primary/10' 
                : 'border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:border-amber-800 dark:from-amber-950/50 dark:to-orange-950/50'
            }`}>
              <div className="p-6">
                {order.zoho_invoice_id ? (
                  <>
                    <div className="mb-4 flex items-center gap-3">
                      <div className="rounded-full bg-primary p-2">
                        <FileText className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">الفاتورة الإلكترونية</h3>
                        <p className="text-sm text-primary dark:text-primary">
                          رقم الفاتورة: <span className="font-mono font-bold">{order.zoho_invoice_number}</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={downloadInvoicePdf}
                        disabled={downloadingPdf}
                        className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-medium text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:opacity-90 hover:shadow-primary/40 disabled:opacity-50"
                      >
                        {downloadingPdf ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        {downloadingPdf ? 'جاري التحميل...' : 'تحميل PDF'}
                      </button>
                      
                      {order.zoho_invoice_url && (
                        <button
                          onClick={() => window.open(order.zoho_invoice_url!, '_blank')}
                          className="flex items-center gap-2 rounded-xl border border-primary/30 bg-white px-5 py-2.5 font-medium text-primary transition-colors hover:bg-primary/5 dark:border-primary/30 dark:bg-transparent dark:text-primary dark:hover:bg-primary/10"
                        >
                          <ExternalLink className="h-4 w-4" />
                          عرض الفاتورة
                        </button>
                      )}
                    </div>
                    
                    <p className="mt-4 flex items-center gap-2 text-xs text-primary/80 dark:text-primary/80">
                      <BadgeCheck className="h-4 w-4" />
                      فاتورة إلكترونية متوافقة مع هيئة الزكاة والضريبة والجمارك (ZATCA)
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-amber-500 p-2">
                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">جاري إنشاء الفاتورة...</h3>
                        <p className="text-sm text-amber-600 dark:text-amber-400">
                          {order.customer_email 
                            ? `سيتم إرسال الفاتورة إلى ${order.customer_email} خلال دقائق`
                            : 'ستتوفر الفاتورة قريباً'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                      <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="flex items-center gap-2 rounded-lg bg-amber-100 px-4 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50"
                      >
                        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        {refreshing ? 'جاري التحديث...' : 'تحديث الحالة'}
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-amber-600/60 dark:text-amber-400/60">
                      💡 اضغط على "تحديث الحالة" بعد بضع ثوانٍ للتحقق من الفاتورة
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 lg:col-span-2">
            {/* Payment Info */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-200 bg-slate-50 px-5 py-3 dark:border-slate-800 dark:bg-slate-800/50">
                <h3 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                  <CreditCard className="h-4 w-4 text-slate-500" />
                  معلومات الدفع
                </h3>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">طريقة الدفع</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {paymentMethodLabels[order.payment_method] || order.payment_method}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">حالة الدفع</span>
                  <span className={`font-medium ${paymentInfo.color}`}>{paymentInfo.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">تاريخ الطلب</span>
                  <span className="text-sm text-slate-900 dark:text-white">{formatDate(order.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-200 bg-slate-50 px-5 py-3 dark:border-slate-800 dark:bg-slate-800/50">
                <h3 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                  <MapPin className="h-4 w-4 text-slate-500" />
                  عنوان الشحن
                </h3>
              </div>
              <div className="p-5 space-y-2 text-sm">
                {order.customer_name && (
                  <p className="font-medium text-slate-900 dark:text-white">{order.customer_name}</p>
                )}
                <p className="text-slate-600 dark:text-slate-400">
                  {[
                    order.shipping_address?.street,
                    order.shipping_address?.district,
                    order.shipping_address?.city,
                    order.shipping_address?.postal_code
                  ].filter(Boolean).join("، ") || "لم يتم إدخال عنوان"}
                </p>
                {order.customer_phone && (
                  <p className="flex items-center gap-2 text-slate-500">
                    <Phone className="h-3.5 w-3.5" />
                    <span dir="ltr">{order.customer_phone}</span>
                  </p>
                )}
                {order.customer_email && (
                  <p className="flex items-center gap-2 text-slate-500">
                    <Mail className="h-3.5 w-3.5" />
                    {order.customer_email}
                  </p>
                )}
                {order.shipping_address?.notes && (
                  <p className="mt-2 rounded-lg bg-slate-100 p-2 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    ملاحظات: {order.shipping_address.notes}
                  </p>
                )}
              </div>
            </div>

            {/* Next Steps */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-200 bg-slate-50 px-5 py-3 dark:border-slate-800 dark:bg-slate-800/50">
                <h3 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                  <Truck className="h-4 w-4 text-slate-500" />
                  الخطوات التالية
                </h3>
              </div>
              <div className="p-5">
                <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                    سنتواصل معك لتأكيد الطلب
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                    سيتم شحن طلبك خلال 2-5 أيام عمل
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                    ستصلك رسالة عند شحن الطلب
                  </li>
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* زر تتبع الطلب */}
              {order.tracking_number && storeSlug && order.id && (
                <button
                  onClick={() => {
                    const trackPath = `/${storeSlug}/track/${order.id}`;
                    console.log('[OrderConfirmationSimple] Navigating to track:', { 
                      storeSlug, 
                      orderId: order.id, 
                      path: trackPath 
                    });
                    navigate(trackPath);
                  }}
                  className="w-full rounded-2xl bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30 px-6 py-4 text-center transition-all duration-300 hover:bg-primary/10 dark:hover:bg-primary/15 hover:border-primary/30 dark:hover:border-primary/40"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Truck className="h-4 w-4 text-primary dark:text-primary" />
                    <p className="text-sm font-semibold text-primary dark:text-primary">
                      تتبع الطلب
                    </p>
                  </div>
                </button>
              )}
              
              {/* العودة للمتجر - الزر الرئيسي */}
              <button
                onClick={goToStore}
                className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4 font-bold text-white shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:from-emerald-600 hover:to-teal-600 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                <ShoppingBag className="h-5 w-5 transition-transform group-hover:-translate-y-0.5" />
                <span>العودة للمتجر</span>
                <span className="mr-auto rounded-full bg-white/20 px-2 py-0.5 text-xs">
                  تسوق المزيد
                </span>
              </button>
              
              {/* الصفحة الرئيسية - الزر الثانوي */}
              <button
                onClick={() => navigate("/")}
                className="group flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-slate-300 bg-white px-6 py-4 font-bold text-slate-700 shadow-sm transition-all duration-300 hover:border-slate-400 hover:bg-slate-50 hover:shadow-md dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-700"
              >
                <Home className="h-5 w-5 text-slate-500 transition-transform group-hover:-translate-y-0.5 dark:text-slate-400" />
                <span>الصفحة الرئيسية</span>
                <span className="mr-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                  أتلانتس
                </span>
              </button>
              
              {/* زر طلب الإرجاع */}
              {order.status === 'DELIVERED' && (
                <button
                  onClick={() => setShowReturnDialog(true)}
                  className="group flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-red-200 bg-red-50 px-6 py-4 font-bold text-red-600 transition-all duration-300 hover:border-red-300 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 dark:hover:border-red-700 dark:hover:bg-red-900/30"
                >
                  <RotateCcw className="h-5 w-5 transition-transform group-hover:rotate-[-30deg]" />
                  <span>طلب إرجاع</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400" role="alert">
            {error}
          </div>
        )}
      </div>

      <ReturnRequestDialog
        open={showReturnDialog}
        onOpenChange={setShowReturnDialog}
        orderId={order.id}
        orderAmount={order.total_sar}
      />
    </div>
  );
};

export default OrderConfirmationSimple;
