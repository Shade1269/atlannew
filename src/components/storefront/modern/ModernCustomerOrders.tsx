import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { UnifiedCard, UnifiedCardContent } from '@/components/design-system';
import { UnifiedButton, UnifiedBadge } from '@/components/design-system';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Package, 
  Search, 
  Calendar,
  MapPin,
  CreditCard,
  Eye,
  Download,
  Truck,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_sar: number;
  created_at: string;
  shipping_address: any;
  payment_method: string;
  tracking_number?: string;
  delivered_at?: string;
  items?: OrderItem[];
}

interface OrderItem {
  id: string;
  title_snapshot: string;
  quantity: number;
  unit_price_sar: number;
  line_total_sar: number;
}

interface ModernCustomerOrdersProps {
  customerId: string;
  storeId: string;
  onViewInvoice: (orderId: string) => void;
}

const statusConfig = {
  pending: { label: 'قيد الانتظار', color: 'bg-warning/10 text-warning border-warning/20', icon: Clock },
  confirmed: { label: 'مؤكد', color: 'bg-info/10 text-info border-info/20', icon: CheckCircle },
  processing: { label: 'قيد التجهيز', color: 'bg-accent/10 text-accent border-accent/20', icon: Package },
  shipped: { label: 'تم الشحن', color: 'bg-primary/10 text-primary border-primary/20', icon: Truck },
  delivered: { label: 'تم التسليم', color: 'bg-success/10 text-success border-success/20', icon: CheckCircle },
  cancelled: { label: 'ملغي', color: 'bg-destructive/10 text-destructive border-destructive/20', icon: XCircle },
};

export const ModernCustomerOrders = ({ customerId, storeId, onViewInvoice }: ModernCustomerOrdersProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ['customer-orders', customerId, storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          total_sar,
          created_at,
          shipping_address,
          payment_method,
          tracking_number,
          delivered_at,
          order_items (
            id,
            title_snapshot,
            quantity,
            unit_price_sar,
            line_total_sar
          )
        `)
        .eq('customer_profile_id', customerId)
        .eq('affiliate_store_id', storeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Order[];
    },
    enabled: !!customerId && !!storeId,
  });

  const filteredOrders = orders?.filter(order => {
    const matchesSearch = !searchQuery || 
      order.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.tracking_number?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    return matchesSearch && matchesStatus;
  }) || [];

  const StatusIcon = ({ status }: { status: string }) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config?.icon || Package;
    return <Icon className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">جاري تحميل الطلبات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-background text-foreground" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">طلباتي</h2>
          <p className="text-sm text-muted-foreground">عرض وإدارة طلباتك السابقة</p>
        </div>
        <UnifiedButton
          variant="outline"
          size="sm"
          onClick={() => refetch()}
        >
          تحديث
        </UnifiedButton>
      </div>

      {/* Filters */}
      <UnifiedCard>
        <UnifiedCardContent className="p-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث برقم الطلب أو رقم التتبع..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>

          {/* Status Filter */}
          <div className="flex flex-wrap gap-2">
            <UnifiedButton
              variant={selectedStatus === 'all' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedStatus('all')}
            >
              الكل ({orders?.length || 0})
            </UnifiedButton>
            {Object.entries(statusConfig).map(([status, config]) => {
              const count = orders?.filter(o => o.status === status).length || 0;
              if (count === 0) return null;
              return (
                <UnifiedButton
                  key={status}
                  variant={selectedStatus === status ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedStatus(status)}
                >
                  {config.label} ({count})
                </UnifiedButton>
              );
            })}
          </div>
        </UnifiedCardContent>
      </UnifiedCard>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <UnifiedCard className="bg-card border-border">
          <UnifiedCardContent className="py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Package className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد طلبات</h3>
            <p className="text-muted-foreground text-sm">
              {searchQuery || selectedStatus !== 'all' 
                ? 'لم يتم العثور على طلبات مطابقة للفلاتر المحددة'
                : 'لم تقم بأي طلبات بعد'}
            </p>
          </UnifiedCardContent>
        </UnifiedCard>
      ) : (
        <ScrollArea className="h-[600px]">
          <div className="space-y-4">
            {filteredOrders.map((order, index) => {
              const statusConf = statusConfig[order.status as keyof typeof statusConfig];
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <UnifiedCard className="hover:shadow-lg transition-shadow bg-card border-border">
                    <UnifiedCardContent className="p-6">
                      {/* Order Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-foreground">
                              طلب #{order.order_number}
                            </h3>
                            <UnifiedBadge 
                              variant="outline" 
                              className={statusConf?.color}
                            >
                              <StatusIcon status={order.status} />
                              <span className="mr-1">{statusConf?.label}</span>
                            </UnifiedBadge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(order.created_at), 'dd MMMM yyyy - HH:mm', { locale: ar })}
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="text-2xl font-bold text-primary">
                            {order.total_sar.toFixed(2)} ريال
                          </p>
                        </div>
                      </div>

                      {/* Order Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {/* Items */}
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            المنتجات ({order.items?.length || 0})
                          </p>
                          <div className="space-y-1">
                            {order.items?.slice(0, 2).map((item) => (
                              <p key={item.id} className="text-sm text-foreground">
                                • {item.title_snapshot} (×{item.quantity})
                              </p>
                            ))}
                            {(order.items?.length || 0) > 2 && (
                              <p className="text-sm text-muted-foreground">
                                و {(order.items?.length || 0) - 2} منتجات أخرى...
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Shipping & Payment */}
                        <div className="space-y-2">
                          {order.shipping_address && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                عنوان الشحن
                              </p>
                              <p className="text-sm text-foreground">
                                {order.shipping_address.city}, {order.shipping_address.district}
                              </p>
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                              <CreditCard className="h-4 w-4" />
                              طريقة الدفع
                            </p>
                            <p className="text-sm text-foreground">{order.payment_method}</p>
                          </div>
                        </div>
                      </div>

                      {/* Tracking */}
                      {order.tracking_number && (
                        <div className="mb-4 p-3 bg-muted/50 rounded-lg border border-border">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-foreground">رقم التتبع</p>
                              <p className="text-sm text-muted-foreground font-mono">
                                {order.tracking_number}
                              </p>
                            </div>
                            <UnifiedButton variant="outline" size="sm">
                              <Truck className="h-4 w-4 ml-2" />
                              تتبع الشحنة
                            </UnifiedButton>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <UnifiedButton
                          onClick={() => onViewInvoice(order.id)}
                          className="flex-1"
                        >
                          <Eye className="h-4 w-4 ml-2" />
                          عرض الفاتورة
                        </UnifiedButton>
                        <UnifiedButton
                          variant="outline"
                          onClick={() => onViewInvoice(order.id)}
                        >
                          <Download className="h-4 w-4" />
                        </UnifiedButton>
                      </div>
                    </UnifiedCardContent>
                  </UnifiedCard>
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};