import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Clock, X, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface AbandonedCartItem {
  id: string;
  title: string;
  price: number;
  image?: string;
  quantity: number;
}

interface AbandonedCartRecoveryProps {
  storeSlug: string;
  items: AbandonedCartItem[];
  lastUpdated: Date;
  discountPercent?: number;
  /** الحد الأدنى للوقت (بالدقائق) لاعتبار السلة متروكة - الافتراضي 30 دقيقة */
  abandonmentThresholdMinutes?: number;
  /** تأخير إظهار الإشعار (بالثواني) بعد دخول الصفحة - الافتراضي 5 ثواني */
  displayDelaySeconds?: number;
}

export const AbandonedCartRecovery: React.FC<AbandonedCartRecoveryProps> = ({
  storeSlug,
  items,
  lastUpdated,
  discountPercent = 10,
  abandonmentThresholdMinutes = 30,
  displayDelaySeconds = 5
}) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // التحقق من أن السلة فعلاً متروكة (مضى عليها الوقت المحدد)
  const isCartAbandoned = () => {
    const timeSinceUpdate = Date.now() - lastUpdated.getTime();
    const thresholdMs = abandonmentThresholdMinutes * 60 * 1000;
    return timeSinceUpdate >= thresholdMs;
  };

  useEffect(() => {
    // التحقق من الإخفاء السابق في هذه الجلسة
    const wasDismissed = sessionStorage.getItem(`cart_recovery_dismissed_${storeSlug}`);
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    // التحقق من أن السلة متروكة فعلاً (مضى عليها 30 دقيقة على الأقل)
    if (!isCartAbandoned() || items.length === 0) {
      return;
    }

    // عرض الإشعار بعد تأخير قصير عند دخول الصفحة
    const timer = setTimeout(() => {
      if (!dismissed && items.length > 0) {
        setIsVisible(true);
      }
    }, displayDelaySeconds * 1000);

    return () => clearTimeout(timer);
  }, [items.length, dismissed, lastUpdated, abandonmentThresholdMinutes, displayDelaySeconds]);

  const handleDismiss = () => {
    setIsVisible(false);
    setDismissed(true);
    // حفظ الإخفاء في sessionStorage
    sessionStorage.setItem(`cart_recovery_dismissed_${storeSlug}`, 'true');
  };

  const handleGoToCart = () => {
    navigate(`/${storeSlug}/cart`);
    setIsVisible(false);
  };

  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountedPrice = totalPrice * (1 - discountPercent / 100);

  const timeSinceAbandoned = () => {
    const diff = Date.now() - lastUpdated.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `منذ ${hours} ساعة`;
    }
    return `منذ ${minutes} دقيقة`;
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-[400px] z-50"
        >
          <Card className="overflow-hidden shadow-2xl border-primary/20">
            {/* Header */}
            <div className="bg-primary p-4 text-primary-foreground relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 left-2 h-8 w-8 text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-full">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold">نسيت شيئاً؟</h3>
                  <p className="text-sm opacity-90">سلتك بانتظارك!</p>
                </div>
              </div>
            </div>

            <CardContent className="p-4 space-y-4">
              {/* Items Preview */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {items.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-muted"
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                {items.length > 3 && (
                  <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                    <span className="text-sm font-medium">+{items.length - 3}</span>
                  </div>
                )}
              </div>

              {/* Time since abandoned */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{timeSinceAbandoned()}</span>
              </div>

              {/* Discount Offer */}
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-700 dark:text-green-400">
                      خصم {discountPercent}% خاص لك!
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-500">
                      أكمل طلبك الآن واحصل على خصم حصري
                    </p>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي السلة</p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-primary">
                      {discountedPrice.toFixed(2)} ر.س
                    </span>
                    <span className="text-sm line-through text-muted-foreground">
                      {totalPrice.toFixed(2)} ر.س
                    </span>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  وفر {(totalPrice - discountedPrice).toFixed(2)} ر.س
                </Badge>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handleDismiss}>
                  لاحقاً
                </Button>
                <Button className="flex-1" onClick={handleGoToCart}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  أكمل الطلب
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Hook لتتبع السلات المتروكة
export const useAbandonedCartTracking = (storeSlug: string, cartItems: any[]) => {
  useEffect(() => {
    if (cartItems.length === 0) return;

    // حفظ معلومات السلة
    const cartData = {
      items: cartItems,
      lastUpdated: Date.now(),
      storeSlug
    };

    localStorage.setItem(`abandoned_cart_${storeSlug}`, JSON.stringify(cartData));

    // تعيين timer للتذكير
    const reminderTimer = setTimeout(() => {
      // يمكن إضافة منطق إرسال إشعار هنا
      console.log('Cart abandoned for 30 minutes');
    }, 30 * 60 * 1000); // 30 دقيقة

    return () => clearTimeout(reminderTimer);
  }, [storeSlug, cartItems]);
};

// استرجاع السلة المتروكة
export const getAbandonedCart = (storeSlug: string): {
  items: AbandonedCartItem[];
  lastUpdated: Date;
} | null => {
  try {
    const stored = localStorage.getItem(`abandoned_cart_${storeSlug}`);
    if (!stored) return null;

    const data = JSON.parse(stored);
    
    // تحقق أن السلة لم تتجاوز 7 أيام
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    if (data.lastUpdated < sevenDaysAgo) {
      localStorage.removeItem(`abandoned_cart_${storeSlug}`);
      return null;
    }

    return {
      items: data.items,
      lastUpdated: new Date(data.lastUpdated)
    };
  } catch {
    return null;
  }
};
