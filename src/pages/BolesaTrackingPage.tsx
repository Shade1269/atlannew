import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Package, MapPin, Clock, CheckCircle2, XCircle, Loader2, ArrowLeft, Search } from 'lucide-react';
import { UnifiedCard, UnifiedButton, UnifiedInput } from '@/components/design-system';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useDarkMode } from '@/shared/components/DarkModeProvider';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://atlback-8yq4.vercel.app';

interface TrackingEvent {
  status: string;
  description: string;
  location?: string;
  timestamp: string;
}

interface TrackingData {
  awb_number: string;
  status: string;
  status_code?: string;
  status_description?: string;
  current_location?: string;
  travel_history: TrackingEvent[];
}

const statusColors: Record<string, string> = {
  BOOKED: 'bg-blue-500',
  PICKED_UP: 'bg-purple-500',
  IN_TRANSIT: 'bg-yellow-500',
  OUT_FOR_DELIVERY: 'bg-orange-500',
  DELIVERED: 'bg-green-500',
  RETURNED: 'bg-red-500',
  CANCELLED: 'bg-gray-500',
  UNKNOWN: 'bg-gray-400',
};

const statusLabels: Record<string, string> = {
  BOOKED: 'تم الحجز',
  PICKED_UP: 'تم الاستلام',
  IN_TRANSIT: 'قيد النقل',
  OUT_FOR_DELIVERY: 'خارج للتسليم',
  DELIVERED: 'تم التسليم',
  RETURNED: 'مرتجع',
  CANCELLED: 'ملغي',
  UNKNOWN: 'غير معروف',
};

export default function BolesaTrackingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDarkMode } = useDarkMode();

  const [awbNumber, setAwbNumber] = useState(searchParams.get('awb') || '');
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // إضافة data-page="tracking" إلى body
  useEffect(() => {
    document.body.setAttribute('data-page', 'tracking');
    return () => {
      document.body.removeAttribute('data-page');
    };
  }, []);

  const fetchTracking = async (awb: string) => {
    if (!awb.trim()) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال رقم الشحنة',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const url = `${BACKEND_URL}/api/bolesa/track?awb=${encodeURIComponent(awb.trim())}`;
      console.log('[Bolesa Tracking] Fetching:', url);

      const response = await fetch(url);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          throw new Error(`HTTP ${response.status}: ${response.statusText || 'فشل في جلب معلومات الشحنة'}`);
        }

        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText || 'فشل في جلب معلومات الشحنة'}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'فشل في جلب معلومات الشحنة');
      }

      setTrackingData(data);
    } catch (error: any) {
      console.error('[Bolesa Tracking] Error:', {
        message: error.message,
        awb: awb.trim(),
        backendUrl: BACKEND_URL,
      });

      let errorMessage = error.message || 'فشل في جلب معلومات الشحنة';

      if (error.message?.includes('404') || error.message?.toLowerCase().includes('not found')) {
        errorMessage = 'لم يتم العثور على الشحنة. يرجى التحقق من رقم الشحنة (AWB) والمحاولة مرة أخرى.';
      } else if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        errorMessage = 'فشل الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت والمحاولة مرة أخرى.';
      }

      toast({
        title: 'خطأ',
        description: errorMessage,
        variant: 'destructive',
      });
      setTrackingData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (awbNumber) {
      fetchTracking(awbNumber);
    }
  }, []);

  const handleSearch = () => {
    fetchTracking(awbNumber);
  };

  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'bg-black' : 'bg-gradient-to-br from-gray-50 via-white to-gray-50'}`} data-page="tracking">
      <div className="container mx-auto max-w-4xl px-4 py-8 flex-1">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <UnifiedButton
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            leftIcon={<ArrowLeft className={`h-4 w-4 ${isDarkMode ? '!text-white' : ''}`} />}
            className={isDarkMode ? '!text-white hover:!bg-gray-800' : ''}
          >
            العودة
          </UnifiedButton>
          <div>
            <h1 className={`text-3xl font-bold ${'!text-primary'}`}>
              تتبع الشحنة - بوليصه
            </h1>
            <p className={`text-sm ${isDarkMode ? '!text-white' : '!text-gray-600'}`}>
              أدخل رقم الشحنة (AWB) لتتبع حالة شحنتك
            </p>
          </div>
        </div>

        {/* Search Box */}
        <UnifiedCard className={`mb-6 ${isDarkMode ? '!bg-gray-900 !border-primary/30' : '!bg-white !border-primary'}`}>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="awb" className={isDarkMode ? '!text-white' : '!text-gray-900'}>
                رقم الشحنة (AWB)
              </Label>
              <UnifiedInput
                id="awb"
                value={awbNumber}
                onChange={(e) => setAwbNumber(e.target.value)}
                placeholder="أدخل رقم الشحنة"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                className={isDarkMode ? '!bg-gray-900 !border-primary/50 !text-white !placeholder:text-white/90 focus:!border-primary focus:!ring-primary/30' : '!bg-white !border-primary !text-gray-900 !placeholder:text-gray-500 focus:!border-primary focus:!ring-primary/20'}
              />
            </div>
            <div className="flex items-end">
              <UnifiedButton
                variant="primary"
                onClick={handleSearch}
                disabled={loading || !awbNumber.trim()}
                loading={loading}
                leftIcon={<Search className={`h-4 w-4 ${isDarkMode ? '!text-white' : ''}`} />}
                className={isDarkMode ? '!bg-gray-900 !border-primary !text-white hover:!bg-gray-800' : '!bg-white !border-primary !text-gray-900 hover:!bg-gray-50'}
              >
                تتبع
              </UnifiedButton>
            </div>
          </div>
        </UnifiedCard>

        {/* Loading State */}
        {loading && (
          <UnifiedCard className={`${isDarkMode ? '!bg-gray-900 !border-primary/30' : '!bg-white !border-primary'}`}>
            <div className="flex items-center justify-center py-12">
              <Loader2 className={`h-8 w-8 animate-spin ${'!text-primary'}`} />
              <span className={`ml-3 ${isDarkMode ? '!text-white' : '!text-gray-900'}`}>
                جاري جلب معلومات الشحنة...
              </span>
            </div>
          </UnifiedCard>
        )}

        {/* No Results */}
        {!loading && searched && !trackingData && (
          <UnifiedCard className={`${isDarkMode ? '!bg-gray-900 !border-primary/30' : '!bg-white !border-primary'}`}>
            <div className="flex flex-col items-center justify-center py-12">
              <XCircle className={`h-16 w-16 mb-4 ${isDarkMode ? '!text-gray-600' : '!text-gray-400'}`} />
              <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? '!text-white' : '!text-gray-900'}`}>
                لم يتم العثور على الشحنة
              </h3>
              <p className={`text-sm ${isDarkMode ? '!text-gray-400' : '!text-gray-600'}`}>
                يرجى التحقق من رقم الشحنة والمحاولة مرة أخرى
              </p>
            </div>
          </UnifiedCard>
        )}

        {/* Tracking Results */}
        {!loading && trackingData && (
          <div className="space-y-6">
            {/* Current Status */}
            <UnifiedCard className={`${isDarkMode ? '!bg-gray-900 !border-primary/30' : '!bg-white !border-primary'}`}>
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-full ${statusColors[trackingData.status] || statusColors.UNKNOWN}`}>
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className={`text-xl font-bold mb-1 ${'!text-primary'}`}>
                    {statusLabels[trackingData.status] || trackingData.status_description || 'غير معروف'}
                  </h2>
                  <p className={`text-sm ${isDarkMode ? '!text-white' : '!text-gray-600'}`}>
                    رقم الشحنة: {trackingData.awb_number}
                  </p>
                </div>
              </div>

              {/* Current Location */}
              {trackingData.current_location && (
                <div className={`pt-4 border-t ${isDarkMode ? 'border-primary/30' : 'border-primary/30'}`}>
                  <div className="flex items-center gap-2">
                    <MapPin className={`h-4 w-4 ${'!text-primary'}`} />
                    <p className={`text-sm ${isDarkMode ? '!text-white' : '!text-gray-900'}`}>
                      الموقع الحالي: {trackingData.current_location}
                    </p>
                  </div>
                </div>
              )}
            </UnifiedCard>

            {/* Travel History */}
            {trackingData.travel_history && trackingData.travel_history.length > 0 && (
              <UnifiedCard className={`${isDarkMode ? '!bg-gray-900 !border-primary/30' : '!bg-white !border-primary'}`}>
                <h3 className={`text-lg font-semibold mb-4 ${'!text-primary'}`}>
                  سجل التتبع
                </h3>
                <div className="relative">
                  <div className={`absolute left-4 top-0 bottom-0 w-0.5 ${isDarkMode ? 'bg-primary/30' : 'bg-primary/30'}`} />
                  <div className="space-y-6">
                    {trackingData.travel_history.map((event, index) => (
                      <div key={index} className="relative flex gap-4">
                        <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full ${
                          statusColors[event.status] || statusColors.UNKNOWN
                        }`}>
                          {event.status === 'DELIVERED' ? (
                            <CheckCircle2 className="h-4 w-4 text-white" />
                          ) : (
                            <Clock className="h-4 w-4 text-white" />
                          )}
                        </div>
                        <div className="flex-1 pb-6">
                          <div className={`flex items-center justify-between mb-1`}>
                            <p className={`font-semibold ${isDarkMode ? '!text-white' : '!text-gray-900'}`}>
                              {event.description || event.status}
                            </p>
                            <p className={`text-xs ${isDarkMode ? '!text-gray-400' : '!text-gray-600'}`}>
                              {new Date(event.timestamp).toLocaleString('ar-SA', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-2 mb-1">
                              <MapPin className={`h-3 w-3 ${isDarkMode ? '!text-gray-400' : '!text-gray-600'}`} />
                              <p className={`text-sm ${isDarkMode ? '!text-gray-400' : '!text-gray-600'}`}>
                                {event.location}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </UnifiedCard>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

