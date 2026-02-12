import { Package, ChevronLeft, Clock, CheckCircle2, Truck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useLuxuryTheme } from './LuxuryThemeContext';

export interface OrderItem {
  id: string;
  name: string;
  image: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  total: number;
  items: OrderItem[];
}

interface LuxuryOrderHistoryProps {
  orders: Order[];
  onViewOrder: (id: string) => void;
  onReorder: (id: string) => void;
  onTrackOrder: (id: string) => void;
}

export function LuxuryOrderHistory({
  orders,
  onViewOrder,
  onReorder,
  onTrackOrder,
}: LuxuryOrderHistoryProps) {
  const { colors } = useLuxuryTheme();
  
  const statusConfig = {
    pending: { label: "قيد الانتظار", icon: Clock, bgColor: colors.warning },
    processing: { label: "جاري التجهيز", icon: Package, bgColor: colors.info },
    shipped: { label: "تم الشحن", icon: Truck, bgColor: colors.primary },
    delivered: { label: "تم التوصيل", icon: CheckCircle2, bgColor: colors.success },
    cancelled: { label: "ملغي", icon: XCircle, bgColor: colors.error },
  };

  return (
    <div className="min-h-screen py-12" dir="rtl" style={{ background: colors.background, color: colors.text }}>
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <Package className="w-8 h-8" style={{ color: colors.primary }} />
            <h1 className="text-3xl md:text-4xl font-bold">
              طلباتي
            </h1>
          </div>
          <p style={{ color: colors.textMuted }}>
            {orders.length} طلب
          </p>
        </motion.div>

        {orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Package className="w-20 h-20 mx-auto mb-6" style={{ color: colors.textMuted }} />
            <h2 className="text-2xl font-semibold mb-4">
              لا توجد طلبات
            </h2>
            <p className="mb-8" style={{ color: colors.textMuted }}>
              ابدأ التسوق لتظهر طلباتك هنا
            </p>
            <Button style={{ background: colors.buttonPrimary, color: colors.buttonText }}>
              تسوق الآن
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {orders.map((order, index) => {
              const status = statusConfig[order.status];
              const StatusIcon = status.icon;

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="rounded-2xl overflow-hidden"
                  style={{ 
                    background: colors.backgroundSecondary, 
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  {/* Order Header */}
                  <div className="p-6" style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold">
                            طلب #{order.orderNumber}
                          </h3>
                          <span 
                            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm"
                            style={{ 
                              background: `${status.bgColor}20`,
                              color: status.bgColor,
                            }}
                          >
                            <StatusIcon className="w-4 h-4" />
                            {status.label}
                          </span>
                        </div>
                        <p className="text-sm" style={{ color: colors.textMuted }}>
                          {order.date}
                        </p>
                      </div>
                      <p className="text-xl font-bold" style={{ color: colors.primary }}>
                        {order.total.toFixed(2)} ر.س
                      </p>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="p-6">
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex-shrink-0 w-20">
                          <div 
                            className="relative w-20 h-20 rounded-lg overflow-hidden mb-2"
                            style={{ background: colors.backgroundTertiary }}
                          >
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                            {item.quantity > 1 && (
                              <span 
                                className="absolute top-1 right-1 text-xs w-5 h-5 rounded-full flex items-center justify-center"
                                style={{ background: colors.primary, color: colors.primaryText }}
                              >
                                {item.quantity}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-center line-clamp-2" style={{ color: colors.textMuted }}>
                            {item.name}
                          </p>
                        </div>
                      ))}
                      {order.items.length > 4 && (
                        <div 
                          className="flex-shrink-0 w-20 h-20 rounded-lg flex items-center justify-center"
                          style={{ background: colors.backgroundTertiary }}
                        >
                          <span className="text-sm" style={{ color: colors.textMuted }}>
                            +{order.items.length - 4}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-6 pb-6 flex flex-wrap gap-3">
                    <Button
                      onClick={() => onViewOrder(order.id)}
                      variant="outline"
                      className="gap-2 flex-1"
                      style={{ 
                        background: 'transparent',
                        border: `1px solid ${colors.border}`,
                        color: colors.text,
                      }}
                    >
                      تفاصيل الطلب
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    
                    {(order.status === "shipped" || order.status === "processing") && (
                      <Button
                        onClick={() => onTrackOrder(order.id)}
                        className="flex-1"
                        style={{ background: colors.buttonPrimary, color: colors.buttonText }}
                      >
                        <Truck className="w-4 h-4 ml-2" />
                        تتبع الشحنة
                      </Button>
                    )}
                    
                    {order.status === "delivered" && (
                      <Button
                        onClick={() => onReorder(order.id)}
                        className="flex-1"
                        style={{ background: colors.buttonPrimary, color: colors.buttonText }}
                      >
                        إعادة الطلب
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
