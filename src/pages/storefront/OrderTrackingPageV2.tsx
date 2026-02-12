import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { 
  Truck, 
  Package, 
  Clock, 
  CheckCircle, 
  MapPin,
  ChevronLeft,
  RefreshCw,
  Phone,
  Calendar,
  AlertCircle,
  ArrowDown,
  Star,
  User,
  Box,
  CheckCircle2,
  XCircle,
  Timer,
  PackageCheck,
  PackageX,
  Copy,
  Hash
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabasePublic } from '@/integrations/supabase/publicClient';
// Removed unused import

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://atlback-8yq4.vercel.app';

interface StoreContextType {
  store: {
    id: string;
    store_name: string;
    store_slug: string;
  };
}

interface TrackingStatus {
  awb: string;
  time: string;
  code: string;
  status: string;
  description: string;
  ar_description?: string;
  location?: string;
  comment?: string;
}

interface Shipment {
  success: boolean;
  vendor_id?: string;
  tracking_number?: string;
  carrier_name?: string;
  local_status?: string;
  trackingStatuses?: TrackingStatus[];
  is_delivered?: boolean;
}

interface TrackingResponse {
  success: boolean;
  order_id?: number;
  order_number?: string;
  shipments?: Shipment[];
  error?: string;
  message?: string;
}

interface OrderItem {
  id: string;
  product_id: string;
  product_title: string;
  product_image_url?: string | null;
  quantity: number;
  unit_price_sar: number;
}

interface OrderInfo {
  id: string;
  order_number: string | null;
  status: string | null;
  total_amount_sar: number | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email?: string | null;
  tracking_number?: string | null;
  created_at: string;
  source_order_id?: string | null;
  payment_status?: string | null;
  shipping_address?: any;
  shipping_provider?: string | null;
}

interface EcommerceOrder {
  id: string;
  order_number: string | null;
  status: string | null;
  total_sar: number | null;
  subtotal_sar: number | null;
  shipping_sar: number | null;
  tax_sar: number | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email?: string | null;
  shipping_address?: any;
  payment_method?: string | null;
  payment_status?: string | null;
  tracking_number?: string | null;
  created_at: string;
}

const OrderTrackingPageV2 = () => {
  const { storeSlug, orderId } = useParams<{ storeSlug: string; orderId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isDarkMode = document.documentElement.classList.contains('dark');
  const context = useOutletContext<StoreContextType>();
  const store = context?.store;
  
  // Track if tracking fetch is in progress to prevent duplicate calls
  const trackingFetchInProgress = useRef(false);
  const lastTrackingError = useRef<string | null>(null);
  
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);
  const [ecommerceOrder, setEcommerceOrder] = useState<EcommerceOrder | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [trackingData, setTrackingData] = useState<TrackingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [ratings, setRatings] = useState<{ [productId: string]: number }>({});
  const [ratingSubmitting, setRatingSubmitting] = useState<string | null>(null);

  // الألوان الرئيسية - من CSS variables المعرّفة بالثيم
  const rootStyles = getComputedStyle(document.documentElement);
  const getCssVar = (name: string, fallback: string) => {
    const val = rootStyles.getPropertyValue(name).trim();
    return val ? `hsl(${val})` : fallback;
  };
  const primaryColor = getCssVar('--primary', isDarkMode ? '#FFD700' : '#C9A961');
  const bgColor = isDarkMode ? '#000000' : '#FFFFFF';
  const cardBg = isDarkMode ? '#111111' : '#FFFFFF';
  const textColor = isDarkMode ? '#FFFFFF' : '#1F2937';
  const mutedColor = isDarkMode ? '#9CA3AF' : '#6B7280';
  const borderColor = primaryColor;

  // تطبيق التصميم المخصص (بدون إزالة النمط الليلي العام)
  useEffect(() => {
    document.body.setAttribute("data-page", "tracking");
    
    return () => {
      document.body.removeAttribute("data-page");
    };
  }, []);

  // جلب معلومات الطلب
  useEffect(() => {
    if (orderId) {
      fetchOrderInfo();
    }
  }, [orderId]);

  const fetchOrderInfo = async () => {
    if (!orderId) return;
    
    setLoading(true);
    try {
      // جلب من order_hub
      const { data: hubData, error: hubError } = await supabasePublic
        .from('order_hub')
        .select('*')
        .or(`source_order_id.eq.${orderId},id.eq.${orderId}`)
        .maybeSingle();

      if (hubError) throw hubError;

      if (hubData) {
        setOrderInfo(hubData);
        
        // جلب تفاصيل الطلب من ecommerce_orders
        const { data: ecomOrder, error: ecomError } = await supabasePublic
          .from('ecommerce_orders')
          .select('*')
          .eq('id', hubData.source_order_id || orderId)
          .maybeSingle();

        if (!ecomError && ecomOrder) {
          setEcommerceOrder(ecomOrder);
        }

        // جلب عناصر الطلب
        const { data: items, error: itemsError } = await supabasePublic
          .from('ecommerce_order_items')
          .select('*')
          .eq('order_id', hubData.source_order_id || orderId);

        if (!itemsError && items) {
          setOrderItems(items);
        }
        
        // جلب معلومات التتبع
        // Priority: ecommerce_orders.tracking_number > order_hub.tracking_number
        let trackingNumber = ecomOrder?.tracking_number || hubData.tracking_number;
        
        // Handle 'null' string case (common database issue where null is stored as string)
        if (trackingNumber === 'null' || trackingNumber === 'NULL' || trackingNumber === 'undefined' || trackingNumber === '') {
          console.warn('[OrderTracking] ⚠️ Tracking number is invalid string:', trackingNumber);
          trackingNumber = null;
        }
        
        // Only fetch tracking if not already in progress
        if (!trackingFetchInProgress.current) {
          if (trackingNumber && typeof trackingNumber === 'string' && trackingNumber.trim().length > 0) {
            console.log('[OrderTracking] Found tracking number:', {
              from_ecommerce: !!ecomOrder?.tracking_number,
              from_hub: !!hubData.tracking_number,
              tracking_number: trackingNumber,
            });
            
            await fetchTrackingInfo(
              hubData.source_order_id || hubData.id, 
              hubData.order_number || '', 
              trackingNumber
            );
          } else {
            console.log('[OrderTracking] ℹ️ No valid tracking number found for this order');
            // Don't try to fetch using order_id as tracking number - this causes API errors
            // The tracking section will show "No tracking information available yet"
            setTrackingData({
              success: false,
              error: 'No tracking number available',
              message: 'لم يتم العثور على رقم تتبع لهذا الطلب'
            });
          }
        } else {
          console.log('[OrderTracking] ⚠️ Tracking fetch already in progress, skipping duplicate call');
        }
      } else {
        toast({
          title: "الطلب غير موجود",
          description: "لم يتم العثور على هذا الطلب",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Error fetching order:', error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في جلب معلومات الطلب",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTrackingInfo = async (sourceOrderId: string, orderNumber: string, trackingNumber: string) => {
    // Prevent duplicate calls
    if (trackingFetchInProgress.current) {
      console.log('[OrderTracking] ⚠️ Tracking fetch already in progress, skipping');
      return;
    }
    
    trackingFetchInProgress.current = true;
    setTrackingLoading(true);
    lastTrackingError.current = null;
    
    try {
      // Clean tracking number (remove shipLink: prefix if exists)
      let cleanTrackingNumber = trackingNumber.replace(/^shipLink:/i, '').trim();
      
      // Handle 'null' string case (common database issue)
      if (cleanTrackingNumber === 'null' || cleanTrackingNumber === 'NULL' || cleanTrackingNumber === 'undefined') {
        console.warn('[OrderTracking] ⚠️ Tracking number is string "null", treating as invalid');
        cleanTrackingNumber = '';
      }
      
      // Validate tracking number
      // Don't accept UUIDs (order_ids) as tracking numbers - they're 36 characters with dashes
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanTrackingNumber);
      
      if (!cleanTrackingNumber || cleanTrackingNumber.length < 3 || isUUID) {
        console.warn('[OrderTracking] ⚠️ Invalid tracking number:', {
          original: trackingNumber,
          cleaned: cleanTrackingNumber,
          length: cleanTrackingNumber?.length || 0,
          isUUID: isUUID
        });
        
        // Don't show toast for invalid tracking number - just skip silently
        console.log('[OrderTracking] ℹ️ No valid tracking number available, skipping API call');
        trackingFetchInProgress.current = false;
        setTrackingLoading(false);
        return;
      }
      
      console.log('[OrderTracking] Fetching tracking info:', {
        sourceOrderId,
        orderNumber,
        originalTrackingNumber: trackingNumber,
        cleanTrackingNumber,
      });
      
      const response = await fetch(`${BACKEND_URL}/api/bolesa/track-shipments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: sourceOrderId,
          order_number: orderNumber,
          tracking_number: cleanTrackingNumber,
        }),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          // If response is not JSON, try to get text
          const text = await response.text().catch(() => '');
          errorData = { 
            error: text || `خطأ HTTP ${response.status}: ${response.statusText || 'خطأ غير معروف'}` 
          };
        }
        
        console.error('[OrderTracking] ❌ API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData.error,
          message: errorData.message,
          details: errorData,
        });
        
        // Handle specific error cases
        let errorMessage: string;
        if (response.status === 500) {
          // Server error - don't show technical details to user
          errorMessage = 'خدمة التتبع غير متاحة حالياً. يرجى المحاولة لاحقاً.';
        } else if (response.status === 404) {
          errorMessage = 'لم يتم العثور على معلومات التتبع لهذا الطلب.';
        } else if (response.status === 400) {
          errorMessage = errorData.error || errorData.message || 'بيانات غير صحيحة';
        } else {
          errorMessage = errorData.error || errorData.message || `خطأ في الاتصال (${response.status})`;
        }
        
        // Check if this is a duplicate error
        if (lastTrackingError.current === errorMessage) {
          // Silent fail for duplicate errors
          console.warn('[OrderTracking] ⚠️ Suppressing duplicate error toast');
          trackingFetchInProgress.current = false;
          setTrackingLoading(false);
          return;
        }
        
        // Store error and throw
        lastTrackingError.current = errorMessage;
        throw new Error(errorMessage);
      }

      const data: TrackingResponse = await response.json();
      
      console.log('[OrderTracking] Tracking response:', {
        success: data.success,
        shipments_count: data.shipments?.length || 0,
        error: data.error,
        message: data.message,
      });
      
      if (data.success) {
        setTrackingData(data);
        
        // Update tracking number from Bolesa response if available
        // Bolesa may return the actual tracking number which might be different
        if (data.shipments && data.shipments.length > 0) {
          const firstShipment = data.shipments[0];
          const bolesaTrackingNumber = firstShipment.tracking_number;
          
          if (bolesaTrackingNumber && bolesaTrackingNumber !== cleanTrackingNumber) {
            console.log('[OrderTracking] ✅ Bolesa returned different tracking number:', {
              original: cleanTrackingNumber,
              bolesa: bolesaTrackingNumber,
            });
            
            // Update order info with Bolesa tracking number
            if (orderInfo) {
              setOrderInfo({
                ...orderInfo,
                tracking_number: bolesaTrackingNumber,
              });
            }
          }
          
          console.log('[OrderTracking] ✅ Tracking data loaded successfully:', {
            shipments_count: data.shipments.length,
            tracking_number: firstShipment.tracking_number,
            carrier_name: firstShipment.carrier_name,
            local_status: firstShipment.local_status,
          });
        } else if (data.shipments && data.shipments.length === 0) {
          // This is normal for newly created shipments that haven't started moving yet
          console.log('[OrderTracking] ℹ️ No tracking updates yet (normal for new shipments):', {
            order_id: data.order_id,
            order_number: data.order_number,
            message: data.message,
          });
          
          // Don't show toast for this case - it's expected behavior
          // The tracking section will show "No tracking information available yet"
        }
        
        // Update order_id and order_number from Bolesa response if available
        if (data.order_id || data.order_number) {
          console.log('[OrderTracking] Bolesa order info:', {
            order_id: data.order_id,
            order_number: data.order_number,
          });
        }
      } else {
        console.error('[OrderTracking] ❌ Tracking failed:', data.error);
        
        // Show user-friendly error message
        const errorMessage = data.error || data.message || "فشل في جلب معلومات التتبع من Bolesa";
        
        toast({
          title: "خطأ في التتبع",
          description: errorMessage,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('[OrderTracking] Error fetching tracking:', error);
      
      // Only show toast if error message changed (avoid duplicate toasts)
      const errorMessage = error.message || "فشل في الاتصال بخدمة التتبع";
      if (lastTrackingError.current !== errorMessage) {
        lastTrackingError.current = errorMessage;
        toast({
          title: "خطأ في التتبع",
          description: errorMessage,
          variant: "destructive",
          duration: 5000, // Show for 5 seconds
        });
      } else {
        console.log('[OrderTracking] ℹ️ Suppressing duplicate error toast');
      }
    } finally {
      trackingFetchInProgress.current = false;
      setTrackingLoading(false);
    }
  };

  // نسخ رقم التتبع
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "تم النسخ",
      description: "تم نسخ الرقم إلى الحافظة",
    });
  };

  // إرسال التقييم
  const submitRating = async (productId: string, rating: number) => {
    setRatingSubmitting(productId);
    try {
      const { error } = await supabasePublic
        .from('product_reviews')
        .insert({
          product_id: productId,
          order_id: orderInfo?.source_order_id || orderId,
          rating: rating,
          user_id: orderInfo?.customer_phone || 'anonymous',
          is_verified: true,
        });

      if (error) throw error;

      setRatings(prev => ({ ...prev, [productId]: rating }));
      toast({
        title: "شكراً لك!",
        description: "تم إرسال تقييمك بنجاح",
      });
    } catch (error: any) {
      console.error('Error submitting rating:', error);
      toast({
        title: "خطأ",
        description: "فشل في إرسال التقييم",
        variant: "destructive"
      });
    } finally {
      setRatingSubmitting(null);
    }
  };

  // حالات Bolesa الكاملة - استخدام الحالات الفعلية من Bolesa
  const getStatusInfo = (status: string) => {
    // تحويل الحالة إلى uppercase للمقارنة
    const statusUpper = status?.toUpperCase() || '';
    
    const statusMap: Record<string, { label: string; icon: any; color: string; bgColor: string; step: number }> = {
      // حالات Bolesa الشائعة
      'PENDING': { label: 'قيد الانتظار', icon: Clock, color: '#F59E0B', bgColor: isDarkMode ? '#78350F' : '#FEF3C7', step: 1 },
      'CONFIRMED': { label: 'مؤكد', icon: CheckCircle, color: '#3B82F6', bgColor: isDarkMode ? '#1E3A8A' : '#DBEAFE', step: 2 },
      'PROCESSING': { label: 'قيد التحضير', icon: Package, color: '#8B5CF6', bgColor: isDarkMode ? '#4C1D95' : '#EDE9FE', step: 2 },
      'READY_FOR_PICKUP': { label: 'جاهز للاستلام', icon: PackageCheck, color: '#06B6D4', bgColor: isDarkMode ? '#164E63' : '#CFFAFE', step: 3 },
      'PICKED_UP': { label: 'تم الاستلام من المتجر', icon: Truck, color: '#0EA5E9', bgColor: isDarkMode ? '#0C4A6E' : '#E0F2FE', step: 3 },
      'IN_TRANSIT': { label: 'في الطريق', icon: Truck, color: '#14B8A6', bgColor: isDarkMode ? '#134E4A' : '#CCFBF1', step: 4 },
      'OUT_FOR_DELIVERY': { label: 'خارج للتوصيل', icon: MapPin, color: '#22C55E', bgColor: isDarkMode ? '#14532D' : '#DCFCE7', step: 5 },
      'SHIPPED': { label: 'تم الشحن', icon: Truck, color: '#06B6D4', bgColor: isDarkMode ? '#164E63' : '#CFFAFE', step: 4 },
      'DELIVERED': { label: 'تم التسليم', icon: CheckCircle2, color: '#10B981', bgColor: isDarkMode ? '#064E3B' : '#D1FAE5', step: 6 },
      'RETURNED': { label: 'مرتجع', icon: PackageX, color: '#F97316', bgColor: isDarkMode ? '#7C2D12' : '#FFEDD5', step: 0 },
      'CANCELLED': { label: 'ملغي', icon: XCircle, color: '#EF4444', bgColor: isDarkMode ? '#7F1D1D' : '#FEE2E2', step: 0 },
      'FAILED': { label: 'فشل التوصيل', icon: AlertCircle, color: '#DC2626', bgColor: isDarkMode ? '#991B1B' : '#FEE2E2', step: 0 },
      // حالات إضافية من Bolesa
      'READY FOR SHIPPING': { label: 'جاهز للشحن', icon: PackageCheck, color: '#06B6D4', bgColor: isDarkMode ? '#164E63' : '#CFFAFE', step: 2 },
      'NOT RECEIVED YET': { label: 'لم يتم الاستلام بعد', icon: Clock, color: '#F59E0B', bgColor: isDarkMode ? '#78350F' : '#FEF3C7', step: 1 },
      'RECEIVED': { label: 'تم الاستلام', icon: CheckCircle, color: '#10B981', bgColor: isDarkMode ? '#064E3B' : '#D1FAE5', step: 3 },
    };
    
    // البحث في الخريطة
    if (statusMap[statusUpper]) {
      return statusMap[statusUpper];
    }
    
    // البحث الجزئي في المفاتيح
    for (const [key, value] of Object.entries(statusMap)) {
      if (statusUpper.includes(key) || key.includes(statusUpper)) {
        return value;
      }
    }
    
    // إذا لم يتم العثور على حالة مطابقة، استخدم النص كما هو من Bolesa
    return { 
      label: status || 'حالة غير معروفة', 
      icon: Clock, 
      color: mutedColor,
      bgColor: isDarkMode ? '#374151' : '#F3F4F6',
      step: 1
    };
  };

  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // خطوات التتبع - removed as unused

  // التحقق من إمكانية التقييم
  const canRate = orderInfo?.status === 'DELIVERED' || ecommerceOrder?.status === 'DELIVERED';

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{
          background: isDarkMode 
            ? '#000000' 
            : 'linear-gradient(to bottom right, #F9FAFB, #FFFFFF, #F9FAFB)'
        }}
      >
        <div className="text-center">
          <div 
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ background: `${primaryColor}20` }}
          >
            <RefreshCw className="h-8 w-8 animate-spin" style={{ color: primaryColor }} />
          </div>
          <p style={{ color: mutedColor }}>جاري تحميل معلومات الطلب...</p>
        </div>
      </div>
    );
  }

  // الحصول على رقم التتبع النظيف
  // Priority: ecommerceOrder.tracking_number > orderInfo.tracking_number
  const rawTrackingNumber = ecommerceOrder?.tracking_number || orderInfo?.tracking_number;
  const cleanTrackingNumber = rawTrackingNumber?.replace(/^shipLink:/i, '').trim() || '';

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{
        background: isDarkMode 
          ? '#000000' 
          : 'linear-gradient(to bottom right, #F9FAFB, #FFFFFF, #F9FAFB)'
      }}
      dir="rtl"
      data-page="tracking"
    >
      {/* Header */}
      <header 
        className="sticky top-0 z-50 border-b shadow-sm"
        style={{
          background: bgColor,
          borderColor: `${borderColor}30`
        }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/${storeSlug}/orders`)}
                className="p-2 rounded-lg transition-all hover:scale-105"
                style={{
                  background: isDarkMode ? '#1F1F1F' : '#F3F4F6',
                  color: textColor
                }}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: primaryColor }}>
                  تتبع الطلب
                </h1>
                <p style={{ color: mutedColor }}>{store?.store_name || 'المتجر'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {orderInfo && orderInfo.tracking_number && (
                <button
                  onClick={() => {
                    const trackingNumber = ecommerceOrder?.tracking_number || orderInfo.tracking_number;
                    if (trackingNumber) {
                      fetchTrackingInfo(
                        orderInfo.source_order_id || orderInfo.id,
                        orderInfo.order_number || '',
                        trackingNumber
                      );
                    }
                  }}
                  disabled={trackingLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all hover:scale-105"
                  style={{
                    background: isDarkMode ? '#1F1F1F' : '#F3F4F6',
                    color: textColor,
                    border: `1px solid ${borderColor}40`
                  }}
                >
                  <RefreshCw className={`h-4 w-4 ${trackingLoading ? 'animate-spin' : ''}`} />
                  تحديث التتبع
                </button>
              )}
              <button
                onClick={fetchOrderInfo}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all hover:scale-105"
                style={{
                  background: primaryColor,
                  color: isDarkMode ? '#000000' : '#FFFFFF'
                }}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                تحديث
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 flex-1">
        {!orderInfo ? (
          <div 
            className="text-center py-16 rounded-2xl shadow-lg max-w-md mx-auto"
            style={{ background: cardBg }}
          >
            <div 
              className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ background: '#FEE2E2' }}
            >
              <AlertCircle className="h-10 w-10" style={{ color: '#EF4444' }} />
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: textColor }}>
              الطلب غير موجود
            </h3>
            <p style={{ color: mutedColor }}>لم يتم العثور على معلومات هذا الطلب</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* ========== كارد واحد يحتوي كل المعلومات ========== */}
            <div 
              className="p-6 rounded-2xl shadow-lg"
              style={{ background: cardBg, border: `2px solid ${borderColor}` }}
            >
              {/* Header: رقم الطلب والحالة */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Hash className="h-5 w-5" style={{ color: primaryColor }} />
                    <p className="font-mono text-lg font-bold" style={{ color: primaryColor }}>
                      {orderInfo.order_number || 'N/A'}
                    </p>
                    <button
                      onClick={() => copyToClipboard(orderInfo.order_number || '')}
                      className="p-1.5 rounded-lg transition-all hover:scale-105"
                      style={{ background: isDarkMode ? '#333' : '#E5E7EB' }}
                    >
                      <Copy className="h-3.5 w-3.5" style={{ color: mutedColor }} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Calendar className="h-4 w-4" style={{ color: mutedColor }} />
                    <p className="text-sm" style={{ color: mutedColor }}>
                      {formatDate(orderInfo.created_at)}
                    </p>
                  </div>
                </div>
                
                {(() => {
                  // استخدام local_status من Bolesa إذا كان متاحاً
                  const bolesaStatus = trackingData?.shipments?.[0]?.local_status;
                  const displayStatus = bolesaStatus || orderInfo.status || 'PENDING';
                  const statusInfo = getStatusInfo(displayStatus);
                  const StatusIcon = statusInfo.icon;
                  return (
                    <div 
                      className="flex items-center gap-2 px-4 py-2 rounded-full"
                      style={{ background: statusInfo.bgColor }}
                    >
                      <StatusIcon className="h-5 w-5" style={{ color: statusInfo.color }} />
                      <span className="font-bold" style={{ color: statusInfo.color }}>
                        {bolesaStatus ? bolesaStatus : statusInfo.label}
                      </span>
                      {bolesaStatus && (
                        <span className="text-xs" style={{ color: statusInfo.color, opacity: 0.8 }}>
                          (من Bolesa)
                        </span>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* رقم التتبع - بارز */}
              {(() => {
                // Get tracking number from Bolesa response if available, otherwise use order info
                let displayTrackingNumber = 
                  trackingData?.shipments?.[0]?.tracking_number || 
                  cleanTrackingNumber;
                
                // Handle 'null' string case
                if (displayTrackingNumber === 'null' || displayTrackingNumber === 'NULL' || displayTrackingNumber === 'undefined' || !displayTrackingNumber || displayTrackingNumber.trim().length === 0) {
                  displayTrackingNumber = null;
                }
                
                // Show tracking number section even if loading
                if (!displayTrackingNumber && !trackingLoading) {
                  return (
                    <div 
                      className="flex items-center justify-center p-6 rounded-xl mb-4"
                      style={{ 
                        background: isDarkMode ? '#1F1F1F' : '#F9FAFB',
                        border: `2px solid ${primaryColor}40`
                      }}
                    >
                      <div className="text-center max-w-md">
                        <div 
                          className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                          style={{ background: `${primaryColor}20` }}
                        >
                          <Package className="h-8 w-8" style={{ color: primaryColor }} />
                        </div>
                        <h4 className="font-bold text-lg mb-2" style={{ color: textColor }}>
                          الشحنة قيد الإنشاء
                        </h4>
                        <p className="text-sm mb-3" style={{ color: mutedColor }}>
                          شحنتك قيد التحضير حالياً. سيتم إنشاء رقم التتبع قريباً.
                        </p>
                        <div 
                          className="p-3 rounded-lg mt-3"
                          style={{ 
                            background: `${primaryColor}10`,
                            border: `1px solid ${primaryColor}30`
                          }}
                        >
                          <p className="text-xs font-medium" style={{ color: primaryColor }}>
                            <Clock className="h-4 w-4 inline-block ml-1" />
                            سيتم تحديث رقم التتبع تلقائياً عند توافره
                          </p>
                          <p className="text-xs mt-2" style={{ color: mutedColor }}>
                            يمكنك تحديث الصفحة لاحقاً للتحقق من رقم التتبع
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }
                
                if (!displayTrackingNumber) return null;
                
                const isFromBolesa = !!trackingData?.shipments?.[0]?.tracking_number;
                
                return (
                  <div 
                    className="flex items-center justify-between p-4 rounded-xl mb-4"
                    style={{ 
                      background: `${primaryColor}15`,
                      border: `2px solid ${primaryColor}40`
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Truck className="h-6 w-6" style={{ color: primaryColor }} />
                      <div>
                        <p className="text-sm" style={{ color: mutedColor }}>
                          {isFromBolesa ? 'رقم التتبع من Bolesa' : 'رقم التتبع'}
                        </p>
                        <p className="font-mono font-black text-xl" style={{ color: primaryColor }}>
                          {displayTrackingNumber}
                        </p>
                        {trackingData?.shipments?.[0]?.carrier_name && (
                          <p className="text-xs mt-1" style={{ color: mutedColor }}>
                            شركة الشحن: {trackingData.shipments[0].carrier_name}
                          </p>
                        )}
                        {isFromBolesa && (
                          <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#10B981' }}>
                            <CheckCircle2 className="h-3 w-3" />
                            تم التحقق من Bolesa
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(displayTrackingNumber)}
                      className="p-3 rounded-lg transition-all hover:scale-105"
                      style={{ background: primaryColor }}
                    >
                      <Copy className="h-5 w-5" style={{ color: isDarkMode ? '#000' : '#FFF' }} />
                    </button>
                  </div>
                );
              })()}

              {/* معلومات العميل والشحن */}
              <div 
                className="grid grid-cols-2 gap-4 pt-4 mb-4"
                style={{ borderTop: `1px solid ${isDarkMode ? '#333' : '#E5E7EB'}` }}
              >
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" style={{ color: mutedColor }} />
                  <span style={{ color: textColor }}>{orderInfo.customer_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" style={{ color: mutedColor }} />
                  <span style={{ color: mutedColor }}>{orderInfo.customer_phone}</span>
                </div>
                {/* حالة الشحنة من Bolesa */}
                {trackingData?.shipments?.[0]?.local_status && (
                  <div className="flex items-center gap-2 col-span-2">
                    <PackageCheck className="h-4 w-4" style={{ color: mutedColor }} />
                    <span style={{ color: mutedColor }}>حالة الشحنة من Bolesa:</span>
                    <span className="font-bold" style={{ color: primaryColor }}>
                      {trackingData.shipments[0].local_status}
                    </span>
                    {trackingData.shipments[0].is_delivered && (
                      <span className="px-2 py-1 rounded-full text-xs font-bold" style={{ 
                        background: '#10B98120', 
                        color: '#10B981' 
                      }}>
                        تم التسليم
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* ملخص الطلب */}
              {ecommerceOrder && (
                <div 
                  className="pt-4 space-y-2"
                  style={{ borderTop: `1px solid ${isDarkMode ? '#333' : '#E5E7EB'}` }}
                >
                  <div className="flex justify-between">
                    <span style={{ color: mutedColor }}>المجموع الفرعي</span>
                    <span style={{ color: textColor }}>{ecommerceOrder.subtotal_sar?.toFixed(2)} ر.س</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: mutedColor }}>الشحن</span>
                    <span style={{ color: textColor }}>{ecommerceOrder.shipping_sar?.toFixed(2)} ر.س</span>
                  </div>
                  {(ecommerceOrder.tax_sar || 0) > 0 && (
                    <div className="flex justify-between">
                      <span style={{ color: mutedColor }}>الضريبة</span>
                      <span style={{ color: textColor }}>{(ecommerceOrder.tax_sar || 0).toFixed(2)} ر.س</span>
                    </div>
                  )}
                  <div 
                    className="flex justify-between pt-3 font-bold text-xl"
                    style={{ borderTop: `1px solid ${isDarkMode ? '#333' : '#E5E7EB'}` }}
                  >
                    <span style={{ color: primaryColor }}>الإجمالي</span>
                    <span style={{ color: primaryColor }}>{ecommerceOrder.total_sar?.toFixed(2)} ر.س</span>
                  </div>
                </div>
              )}
            </div>

            {/* Progress Steps - استخدام حالات Bolesa الفعلية فقط */}
            {(() => {
              // استخدام trackingStatuses من Bolesa فقط
              const bolesaTrackingStatuses = trackingData?.shipments?.[0]?.trackingStatuses || [];
              // bolesaStatus available but not used in this block
              
              // إذا كان الطلب ملغي أو مرتجع، لا تعرض خطوات التتبع
              if (orderInfo.status === 'CANCELLED' || orderInfo.status === 'RETURNED') {
                return null;
              }
              
              // إذا لم تكن هناك trackingStatuses من Bolesa، لا تعرض قسم الخطوات
              if (bolesaTrackingStatuses.length === 0) {
                return null;
              }
              
              return (
                <div className="p-6 rounded-2xl shadow-lg" style={{ background: cardBg }}>
                  <h3 className="font-bold text-lg mb-6" style={{ color: primaryColor }}>
                    حالة الطلب من Bolesa
                  </h3>
                  
                  {/* عرض trackingStatuses من Bolesa فقط */}
                  {bolesaTrackingStatuses.length > 0 && (
                    <div className="relative">
                      {bolesaTrackingStatuses.map((trackingStatus: any, index: number) => {
                        const isLatest = index === 0; // أحدث حالة هي الأولى في المصفوفة
                        // استخدام الوصف بالعربي من Bolesa أولاً، ثم الإنجليزي، ثم الحالة
                        let statusText = trackingStatus.ar_description || trackingStatus.description || trackingStatus.status || '';
                        
                        // ترجمة الرسائل الإنجليزية الشائعة من Bolesa إلى العربية
                        if (statusText) {
                          const translations: Record<string, string> = {
                            'Shipment Is Not Received Yet From Shipper': 'الشحنة لم يتم استلامها من الشاحن بعد',
                            'When Shipment Received, More Details Will Be Updated On Tracking Information': 'عند استلام الشحنة، سيتم تحديث المزيد من التفاصيل في معلومات التتبع',
                            'For Further Assistance, Please Contact The Shipper': 'لمزيد من المساعدة، يرجى الاتصال بالشاحن',
                            'Shipment received': 'تم استلام الشحنة',
                            'In transit': 'في الطريق',
                            'Out for delivery': 'خارج للتوصيل',
                            'Delivered': 'تم التسليم',
                            'Not Received Yet From Shipper': 'لم يتم استلامها من الشاحن بعد',
                            'Received Yet From Shipper': 'تم استلامها من الشاحن',
                            'Shipment Is Not Received': 'الشحنة لم يتم استلامها',
                            'Not Received': 'لم يتم الاستلام',
                            'Received From Shipper': 'تم الاستلام من الشاحن',
                            'Picked Up': 'تم الاستلام',
                            'On The Way': 'في الطريق',
                            'Out For Delivery': 'خارج للتوصيل',
                            'Ready For Pickup': 'جاهز للاستلام',
                            'Failed Delivery': 'فشل التسليم',
                            'Returned': 'مرتجع',
                          };
                          
                          // البحث عن ترجمة لكل رسالة
                          let translatedText = statusText;
                          for (const [en, ar] of Object.entries(translations)) {
                            if (translatedText.includes(en)) {
                              translatedText = translatedText.replace(new RegExp(en, 'gi'), ar);
                            }
                          }
                          statusText = translatedText;
                        }
                        
                        const statusInfo = getStatusInfo(trackingStatus.status || trackingStatus.code || '');
                        const StatusIcon = statusInfo.icon;
                        
                        return (
                          <div key={index} className="flex items-start gap-4 relative">
                            {/* Connector Line */}
                            {index < bolesaTrackingStatuses.length - 1 && (
                              <div 
                                className="absolute right-5 top-12 w-1 h-12 rounded-full"
                                style={{
                                  background: isLatest ? primaryColor : (isDarkMode ? '#333' : '#E5E7EB')
                                }}
                              />
                            )}
                            
                            {/* Step Circle */}
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all shadow-lg"
                              style={{
                                background: isLatest ? primaryColor : (isDarkMode ? '#333' : '#E5E7EB'),
                                boxShadow: isLatest ? `0 0 0 4px ${primaryColor}30` : 'none'
                              }}
                            >
                              <StatusIcon 
                                className="h-5 w-5"
                                style={{ color: isLatest ? (isDarkMode ? '#000' : '#FFF') : mutedColor }}
                              />
                            </div>
                            
                            {/* Step Label */}
                            <div className="pb-8 flex-1">
                              <p 
                                className="font-bold text-base leading-relaxed"
                                style={{ color: isLatest ? textColor : mutedColor }}
                              >
                                {statusText}
                              </p>
                              {trackingStatus.comment && (
                                <p className="text-sm mt-1 italic" style={{ color: mutedColor }}>
                                  {trackingStatus.comment}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                {trackingStatus.location && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" style={{ color: mutedColor }} />
                                    <p className="text-xs" style={{ color: mutedColor }}>
                                      {trackingStatus.location}
                                    </p>
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" style={{ color: mutedColor }} />
                                  <p className="text-xs" style={{ color: mutedColor }}>
                                    {new Date(trackingStatus.time).toLocaleDateString('ar-SA', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                                {trackingStatus.code && (
                                  <div className="flex items-center gap-1">
                                    <Hash className="h-3 w-3" style={{ color: mutedColor }} />
                                    <p className="text-xs font-mono" style={{ color: mutedColor }}>
                                      {trackingStatus.code}
                                    </p>
                                  </div>
                                )}
                              </div>
                              {isLatest && (
                                <p className="text-sm mt-2 font-medium px-2 py-1 rounded-full inline-block" style={{ 
                                  color: primaryColor,
                                  background: `${primaryColor}15`
                                }}>
                                  ✓ الحالة الحالية من Bolesa
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Order Items */}
            {orderItems.length > 0 && (
              <div 
                className="p-6 rounded-2xl shadow-lg"
                style={{ background: cardBg }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Box className="h-5 w-5" style={{ color: primaryColor }} />
                  <h3 className="font-bold text-lg" style={{ color: primaryColor }}>
                    المنتجات ({orderItems.length})
                  </h3>
                </div>
                
                <div className="space-y-4">
                  {orderItems.map((item) => (
                    <div 
                      key={item.id}
                      className="flex gap-4 p-4 rounded-xl"
                      style={{ background: isDarkMode ? '#1F1F1F' : '#F9FAFB' }}
                    >
                      {/* Product Image */}
                      <div 
                        className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0"
                        style={{ background: isDarkMode ? '#333' : '#E5E7EB' }}
                      >
                        {item.product_image_url ? (
                          <img 
                            src={item.product_image_url} 
                            alt={item.product_title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-8 w-8" style={{ color: mutedColor }} />
                          </div>
                        )}
                      </div>
                      
                      {/* Product Info */}
                      <div className="flex-1">
                        <h4 className="font-bold mb-1" style={{ color: textColor }}>
                          {item.product_title}
                        </h4>
                        <p className="text-sm mb-2" style={{ color: mutedColor }}>
                          الكمية: {item.quantity} × {item.unit_price_sar?.toFixed(2)} ر.س
                        </p>
                        <p className="font-bold" style={{ color: primaryColor }}>
                          {(item.quantity * item.unit_price_sar).toFixed(2)} ر.س
                        </p>
                        
                        {/* Rating Section */}
                        {canRate && (
                          <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${isDarkMode ? '#333' : '#E5E7EB'}` }}>
                            <p className="text-sm mb-2" style={{ color: mutedColor }}>
                              قيّم هذا المنتج:
                            </p>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={() => submitRating(item.product_id, star)}
                                  disabled={ratingSubmitting === item.product_id || ratings[item.product_id] !== undefined}
                                  className="transition-all hover:scale-110 disabled:opacity-50"
                                >
                                  <Star 
                                    className="h-6 w-6"
                                    fill={(ratings[item.product_id] || 0) >= star ? primaryColor : 'none'}
                                    style={{ 
                                      color: (ratings[item.product_id] || 0) >= star ? primaryColor : mutedColor 
                                    }}
                                  />
                                </button>
                              ))}
                            </div>
                            {ratings[item.product_id] && (
                              <p className="text-sm mt-1" style={{ color: '#10B981' }}>
                                ✓ شكراً لتقييمك!
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed Tracking Events from Bolesa */}
            {((trackingData?.shipments && trackingData.shipments.length > 0) || trackingData?.success) && (
              <div className="p-6 rounded-2xl shadow-lg" style={{ background: cardBg }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg" style={{ color: primaryColor }}>
                      سجل التتبع التفصيلي من Bolesa
                    </h3>
                    {trackingData.order_id && (
                      <p className="text-xs mt-1" style={{ color: mutedColor }}>
                        رقم الطلب في Bolesa: {trackingData.order_id}
                        {trackingData.order_number && ` (${trackingData.order_number})`}
                      </p>
                    )}
                  </div>
                  {trackingData.shipments?.[0]?.is_delivered && (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ 
                      background: '#10B98120', 
                      border: '1px solid #10B981'
                    }}>
                      <CheckCircle2 className="h-4 w-4" style={{ color: '#10B981' }} />
                      <span className="text-sm font-bold" style={{ color: '#10B981' }}>
                        تم التسليم
                      </span>
                    </div>
                  )}
                </div>
                
                {trackingLoading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto" style={{ color: primaryColor }} />
                    <p className="mt-2 text-sm" style={{ color: mutedColor }}>
                      جاري جلب معلومات التتبع من Bolesa...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {trackingData.shipments && trackingData.shipments.length > 0 ? (
                      trackingData.shipments.map((shipment, shipmentIndex) => (
                      <div key={shipmentIndex}>
                        {/* Shipment Info */}
                        <div 
                          className="p-4 rounded-xl mb-4"
                          style={{ background: isDarkMode ? '#1F1F1F' : '#F9FAFB' }}
                        >
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            {shipment.tracking_number && (
                              <div className="flex items-center gap-2">
                                <Hash className="h-4 w-4" style={{ color: mutedColor }} />
                                <span className="text-sm" style={{ color: mutedColor }}>رقم التتبع:</span>
                                <span className="font-mono font-bold" style={{ color: primaryColor }}>
                                  {shipment.tracking_number}
                                </span>
                              </div>
                            )}
                            {shipment.carrier_name && (
                              <div className="flex items-center gap-2">
                                <Truck className="h-4 w-4" style={{ color: mutedColor }} />
                                <span className="text-sm" style={{ color: mutedColor }}>شركة الشحن:</span>
                                <span className="font-bold" style={{ color: textColor }}>
                                  {shipment.carrier_name}
                                </span>
                              </div>
                            )}
                            {shipment.local_status && (
                              <div className="flex items-center gap-2">
                                <PackageCheck className="h-4 w-4" style={{ color: mutedColor }} />
                                <span className="text-sm" style={{ color: mutedColor }}>الحالة:</span>
                                <span className="font-bold" style={{ color: primaryColor }}>
                                  {shipment.local_status}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Tracking Statuses */}
                        {shipment.trackingStatuses && shipment.trackingStatuses.length > 0 ? (
                          <div className="relative">
                            {shipment.trackingStatuses.map((status, statusIndex) => {
                              const isLatest = statusIndex === 0;
                              return (
                                <div key={statusIndex} className="flex gap-4 relative pb-6">
                                  {/* Connector */}
                                  {statusIndex < shipment.trackingStatuses!.length - 1 && (
                                    <div 
                                      className="absolute right-3 top-8 w-0.5 h-full"
                                      style={{ background: isDarkMode ? '#333' : '#E5E7EB' }}
                                    />
                                  )}
                                  
                                  {/* Dot */}
                                  <div 
                                    className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center shadow-md transition-all"
                                    style={{
                                      background: isLatest ? primaryColor : (isDarkMode ? '#333' : '#D1D5DB'),
                                      transform: isLatest ? 'scale(1.1)' : 'scale(1)',
                                    }}
                                  >
                                    {isLatest && (
                                      <ArrowDown className="h-3 w-3" style={{ color: isDarkMode ? '#000' : '#FFF' }} />
                                    )}
                                  </div>
                                  
                                  {/* Content */}
                                  <div className="flex-1">
                                    <div className="flex items-start justify-between gap-2 flex-wrap">
                                      <div className="flex-1">
                                        <p className="font-bold" style={{ color: isLatest ? primaryColor : textColor }}>
                                          {status.ar_description || status.description || status.status}
                                        </p>
                                        {status.code && (
                                          <p className="text-xs mt-1 font-mono" style={{ color: mutedColor }}>
                                            كود: {status.code}
                                          </p>
                                        )}
                                      </div>
                                      {isLatest && (
                                        <span 
                                          className="px-2 py-1 rounded-full text-xs font-bold"
                                          style={{ 
                                            background: `${primaryColor}20`, 
                                            color: primaryColor 
                                          }}
                                        >
                                          آخر تحديث
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                                      <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" style={{ color: mutedColor }} />
                                        <p className="text-xs" style={{ color: mutedColor }}>
                                          {new Date(status.time).toLocaleString('ar-SA', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </p>
                                      </div>
                                      {status.location && (
                                        <>
                                          <span style={{ color: isDarkMode ? '#475569' : '#D1D5DB' }}>•</span>
                                          <div className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" style={{ color: mutedColor }} />
                                            <span className="text-xs" style={{ color: mutedColor }}>
                                              {status.location}
                                            </span>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                    {status.comment && (
                                      <p className="text-xs mt-2 p-2 rounded" style={{ 
                                        background: isDarkMode ? '#1F1F1F' : '#F3F4F6',
                                        color: mutedColor 
                                      }}>
                                        {status.comment}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div 
                            className="text-center py-8 rounded-xl"
                            style={{ background: isDarkMode ? '#1F1F1F' : '#F9FAFB' }}
                          >
                            <Timer className="h-8 w-8 mx-auto mb-2" style={{ color: mutedColor }} />
                            <p style={{ color: mutedColor }}>
                              لا توجد تحديثات تتبع متاحة حالياً من Bolesa
                            </p>
                            <p className="text-xs mt-2" style={{ color: mutedColor }}>
                              الشحنة تم إنشاؤها بنجاح وسيتم تحديث المعلومات عند بدء الشحنة بالتحرك
                            </p>
                          </div>
                        )}
                      </div>
                      ))
                    ) : (
                      // No shipments data yet - show helpful message
                      <div 
                        className="text-center py-8 rounded-xl"
                        style={{ 
                          background: isDarkMode ? '#1F1F1F' : '#F9FAFB',
                          border: `2px solid ${primaryColor}30`
                        }}
                      >
                        <div 
                          className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                          style={{ background: `${primaryColor}20` }}
                        >
                          <Package className="h-8 w-8" style={{ color: primaryColor }} />
                        </div>
                        <h4 className="font-bold text-lg mb-2" style={{ color: textColor }}>
                          الشحنة قيد الإنشاء
                        </h4>
                        <p className="text-sm mb-3" style={{ color: mutedColor }}>
                          شحنتك قيد التحضير حالياً. سيتم إنشاء رقم التتبع قريباً.
                        </p>
                        <div 
                          className="p-4 rounded-lg mt-3 max-w-md mx-auto"
                          style={{ 
                            background: `${primaryColor}10`,
                            border: `1px solid ${primaryColor}30`
                          }}
                        >
                          <p className="text-sm font-medium mb-2" style={{ color: primaryColor }}>
                            <Clock className="h-4 w-4 inline-block ml-1" />
                            سيتم تحديث رقم التتبع تلقائياً عند توافره
                          </p>
                          <p className="text-xs mt-2" style={{ color: mutedColor }}>
                            يمكنك تحديث الصفحة لاحقاً للتحقق من رقم التتبع ومتابعة حالة الشحنة
                          </p>
                        </div>
                        {trackingData?.order_id && (
                          <p className="text-xs mt-4 font-mono" style={{ color: mutedColor }}>
                            رقم الطلب في Bolesa: {trackingData.order_id}
                          </p>
                        )}
                        {cleanTrackingNumber && (
                          <p className="text-xs mt-1 font-mono" style={{ color: mutedColor }}>
                            رقم التتبع: {cleanTrackingNumber}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Shipping Address */}
            {ecommerceOrder?.shipping_address && (
              <div className="p-6 rounded-2xl shadow-lg" style={{ background: cardBg }}>
                <div className="flex items-center gap-3 mb-4">
                  <MapPin className="h-5 w-5" style={{ color: primaryColor }} />
                  <h3 className="font-bold" style={{ color: primaryColor }}>عنوان التوصيل</h3>
                </div>
                
                <div 
                  className="p-4 rounded-xl"
                  style={{ background: isDarkMode ? '#1F1F1F' : '#F9FAFB' }}
                >
                  <p style={{ color: textColor }}>
                    {ecommerceOrder.shipping_address.city && `${ecommerceOrder.shipping_address.city}`}
                    {ecommerceOrder.shipping_address.district && ` - ${ecommerceOrder.shipping_address.district}`}
                  </p>
                  {ecommerceOrder.shipping_address.street && (
                    <p className="mt-1" style={{ color: mutedColor }}>
                      {ecommerceOrder.shipping_address.street}
                    </p>
                  )}
                  {ecommerceOrder.shipping_address.notes && (
                    <p className="mt-2 text-sm" style={{ color: mutedColor }}>
                      ملاحظات: {ecommerceOrder.shipping_address.notes}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderTrackingPageV2;
