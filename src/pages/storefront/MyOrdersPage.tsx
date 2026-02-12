import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useOutletContext } from 'react-router-dom';
import { 
  Package, 
  Phone, 
  RefreshCw, 
  ArrowRight,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  ChevronLeft,
  MapPin,
  Eye,
  Search,
  ShoppingBag
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabasePublic } from '@/integrations/supabase/publicClient';
import { useDarkMode } from '@/shared/components/DarkModeProvider';

interface StoreContextType {
  store: {
    id: string;
    store_name: string;
    store_slug: string;
  };
}

interface OrderData {
  id: string;
  order_number: string | null;
  created_at: string;
  status: string | null;
  total_amount_sar: number | null;
  customer_name: string | null;
  customer_phone: string | null;
  tracking_number?: string | null;
  shipping_provider?: string | null;
  source_order_id?: string | null;
}

const MyOrdersPage = () => {
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDarkMode } = useDarkMode();
  const context = useOutletContext<StoreContextType>();
  const store = context?.store;
  
  const [phone, setPhone] = useState('');
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // تطبيق التصميم المخصص (بدون إزالة النمط الليلي العام)
  useEffect(() => {
    document.body.setAttribute("data-page", "orders");
    
    return () => {
      document.body.removeAttribute("data-page");
    };
  }, []);

  // جلب الطلبات بناءً على رقم الجوال
  const fetchOrders = async () => {
    if (!phone.trim()) {
      toast({
        title: "رقم الجوال مطلوب",
        description: "يرجى إدخال رقم جوالك للبحث عن طلباتك",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const { data, error } = await supabasePublic
        .from('order_hub')
        .select('*')
        .eq('customer_phone', phone.trim())
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrders(data || []);

      if (!data || data.length === 0) {
        toast({
          title: "لا توجد طلبات",
          description: "لم يتم العثور على طلبات بهذا الرقم",
        });
      }

    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في جلب الطلبات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // ترجمة حالات الطلب
  const getStatusInfo = (status: string | null) => {
    const statusMap: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
      'PENDING': { 
        label: 'قيد الانتظار', 
        icon: Clock, 
        color: '#F59E0B',
        bgColor: isDarkMode ? '#78350F' : '#FEF3C7'
      },
      'CONFIRMED': { 
        label: 'مؤكد', 
        icon: CheckCircle, 
        color: '#3B82F6',
        bgColor: isDarkMode ? '#1E3A8A' : '#DBEAFE'
      },
      'PROCESSING': { 
        label: 'قيد التحضير', 
        icon: Package, 
        color: '#8B5CF6',
        bgColor: isDarkMode ? '#4C1D95' : '#EDE9FE'
      },
      'SHIPPED': { 
        label: 'تم الشحن', 
        icon: Truck, 
        color: '#06B6D4',
        bgColor: isDarkMode ? '#164E63' : '#CFFAFE'
      },
      'DELIVERED': { 
        label: 'تم التسليم', 
        icon: CheckCircle, 
        color: '#10B981',
        bgColor: isDarkMode ? '#064E3B' : '#D1FAE5'
      },
      'CANCELLED': { 
        label: 'ملغي', 
        icon: XCircle, 
        color: '#EF4444',
        bgColor: isDarkMode ? '#7F1D1D' : '#FEE2E2'
      }
    };
    const normalizedStatus = (status || 'PENDING').toUpperCase();
    return statusMap[normalizedStatus] || { 
      label: status || 'غير معروف', 
      icon: Clock, 
      color: isDarkMode ? '#9CA3AF' : '#6B7280',
      bgColor: isDarkMode ? '#374151' : '#F3F4F6'
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

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{
        background: isDarkMode 
          ? '#000000' 
          : 'linear-gradient(to bottom right, #F9FAFB, #FFFFFF, #F9FAFB)'
      }}
      dir="rtl"
      data-page="orders"
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
                onClick={() => navigate(`/${storeSlug}`)}
                className="p-2 rounded-lg transition-all hover:scale-105"
                style={{
                  background: isDarkMode ? '#1F1F1F' : '#F3F4F6',
                  color: textColor
                }}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 
                  className="text-2xl font-bold"
                  style={{ color: primaryColor }}
                >
                  طلباتي
                </h1>
                <p style={{ color: mutedColor }}>
                  {store?.store_name || 'المتجر'}
                </p>
              </div>
            </div>
            
            {searched && orders.length > 0 && (
              <button
                onClick={fetchOrders}
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
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 flex-1">
        {/* Search Section */}
        <div 
          className="max-w-md mx-auto mb-8 p-6 rounded-2xl shadow-lg"
          style={{
            background: cardBg,
            border: `2px solid ${borderColor}`
          }}
        >
          <div className="flex items-center gap-4 mb-6">
            <div 
              className="p-3 rounded-xl"
              style={{ background: `${primaryColor}20` }}
            >
              <Phone className="h-6 w-6" style={{ color: primaryColor }} />
            </div>
            <div>
              <h2 
                className="font-bold text-lg"
                style={{ color: primaryColor }}
              >
                البحث عن طلباتك
              </h2>
              <p style={{ color: mutedColor }}>
                أدخل رقم جوالك لعرض طلباتك
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <input
                type="tel"
                placeholder="05xxxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-4 pr-12 rounded-xl text-right text-lg font-medium transition-all focus:outline-none focus:ring-2"
                style={{
                  background: isDarkMode ? '#1F1F1F' : '#F9FAFB',
                  border: `2px solid ${isDarkMode ? '#333' : '#E5E7EB'}`,
                  color: textColor,
                  // @ts-ignore
                  '--tw-ring-color': primaryColor
                }}
                dir="ltr"
              />
              <Search 
                className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5"
                style={{ color: mutedColor }}
              />
            </div>
            
            <button
              onClick={fetchOrders}
              disabled={loading || !phone.trim()}
              className="w-full py-4 rounded-xl font-bold text-lg transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg"
              style={{
                background: primaryColor,
                color: isDarkMode ? '#000000' : '#FFFFFF'
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  جاري البحث...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Search className="h-5 w-5" />
                  عرض طلباتي
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Orders List */}
        {searched && (
          <div className="max-w-2xl mx-auto">
            {orders.length === 0 ? (
              <div 
                className="text-center py-16 rounded-2xl shadow-lg"
                style={{ background: cardBg }}
              >
                <div 
                  className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
                  style={{ background: `${primaryColor}20` }}
                >
                  <ShoppingBag className="h-10 w-10" style={{ color: primaryColor }} />
                </div>
                <h3 
                  className="text-xl font-bold mb-2"
                  style={{ color: textColor }}
                >
                  لا توجد طلبات
                </h3>
                <p className="mb-6" style={{ color: mutedColor }}>
                  لم يتم العثور على طلبات بهذا الرقم
                </p>
                <Link
                  to={`/${storeSlug}`}
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all hover:scale-105 shadow-lg"
                  style={{
                    background: primaryColor,
                    color: isDarkMode ? '#000000' : '#FFFFFF'
                  }}
                >
                  ابدأ التسوق الآن
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm font-medium" style={{ color: mutedColor }}>
                  تم العثور على {orders.length} طلب
                </p>
                
                {orders.map((order) => {
                  const statusInfo = getStatusInfo(order.status);
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <div
                      key={order.id}
                      className="p-5 rounded-2xl shadow-lg transition-all hover:shadow-xl hover:scale-[1.01]"
                      style={{
                        background: cardBg,
                        border: `2px solid ${isDarkMode ? '#333' : '#E5E7EB'}`
                      }}
                    >
                      {/* Order Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p 
                            className="font-mono text-sm font-bold"
                            style={{ color: primaryColor }}
                          >
                            {order.order_number}
                          </p>
                          <p className="text-xs mt-1" style={{ color: mutedColor }}>
                            {formatDate(order.created_at)}
                          </p>
                        </div>
                        <div 
                          className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                          style={{ background: statusInfo.bgColor }}
                        >
                          <StatusIcon className="h-4 w-4" style={{ color: statusInfo.color }} />
                          <span className="text-sm font-bold" style={{ color: statusInfo.color }}>
                            {statusInfo.label}
                          </span>
                        </div>
                      </div>

                      {/* Order Details */}
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-black" style={{ color: textColor }}>
                          {order.total_amount_sar?.toFixed(2) || '0.00'}
                          <span className="text-sm font-normal mr-1" style={{ color: mutedColor }}>
                            ر.س
                          </span>
                        </div>

                        {/* Track Button */}
                        <button
                          onClick={() => navigate(`/${storeSlug}/track/${order.source_order_id || order.id}`)}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all hover:scale-105 shadow-md"
                          style={{
                            background: order.tracking_number ? primaryColor : (isDarkMode ? '#333' : '#E5E7EB'),
                            color: order.tracking_number 
                              ? (isDarkMode ? '#000000' : '#FFFFFF') 
                              : mutedColor
                          }}
                        >
                          {order.tracking_number ? (
                            <>
                              <MapPin className="h-4 w-4" />
                              تتبع الشحنة
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4" />
                              عرض التفاصيل
                            </>
                          )}
                        </button>
                      </div>

                      {/* Tracking Number */}
                      {order.tracking_number && (
                        <div 
                          className="mt-4 pt-4"
                          style={{ borderTop: `1px solid ${isDarkMode ? '#333' : '#E5E7EB'}` }}
                        >
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4" style={{ color: mutedColor }} />
                            <span className="text-sm" style={{ color: mutedColor }}>
                              رقم التتبع:
                            </span>
                            <span 
                              className="text-sm font-mono font-bold"
                              style={{ color: primaryColor }}
                            >
                              {order.tracking_number.replace(/^shipLink:/i, '')}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrdersPage;
