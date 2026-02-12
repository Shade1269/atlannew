import React, { useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { Button as UnifiedButton } from '@/components/ui/button';
import { Badge as UnifiedBadge } from '@/components/ui/badge';
import { ArrowLeft, ShoppingCart, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import { useIsolatedStoreCart } from '@/hooks/useIsolatedStoreCart';
import { motion, AnimatePresence } from 'framer-motion';

interface StoreContextType {
  store: {
    id: string;
    store_name: string;
    store_slug: string;
    shop_id: string;
  };
}

const IsolatedStoreCartContent: React.FC<{ 
  storeSlug: string; 
  store: StoreContextType['store'];
}> = ({ storeSlug, store }) => {
  const navigate = useNavigate();
  const { cart, loading, updateQuantity, removeFromCart } = useIsolatedStoreCart(store?.id || '');
  const isLight = !document.documentElement.classList.contains('dark');
  
  const handleBackToStore = () => {
    navigate(`/${storeSlug}`);
  };

  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    setUpdatingItems(prev => new Set(prev).add(itemId));
    try {
      await updateQuantity(itemId, newQuantity);
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setUpdatingItems(prev => new Set(prev).add(itemId));
    try {
      await removeFromCart(itemId);
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  // Dynamic styles based on theme
  const pageStyle = {
    minHeight: '100vh',
  };

  const textPrimary = isLight ? 'text-gray-900' : 'text-white';
  const textSecondary = isLight ? 'text-gray-600' : 'text-slate-400';
  const cardBg = isLight ? 'bg-white border-gray-200' : 'bg-slate-900/50 border-red-600/20';
  const quantityBg = isLight ? 'bg-gray-100 border-gray-300' : 'bg-slate-800/80 border-red-600/10';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={pageStyle}>
        <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4 ${isLight ? 'border-amber-600' : 'border-red-500'}`} />
          <p className={textSecondary}>جاري تحميل السلة...</p>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen p-6" style={pageStyle}>
        <div className="flex items-center gap-4 mb-8">
          <UnifiedButton 
            variant="ghost" 
            size="sm" 
            onClick={handleBackToStore}
            className={`${isLight ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100' : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'}`}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            العودة للمتجر
          </UnifiedButton>
        </div>

        <div className={`max-w-md mx-auto rounded-2xl p-8 ${cardBg} border shadow-lg`}>
          <div className="text-center">
            <div className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6 ${isLight ? 'bg-gray-100' : 'bg-slate-800'}`}>
              <ShoppingCart className={`h-16 w-16 ${isLight ? 'text-gray-400' : 'text-muted-foreground/50'}`} />
            </div>
            <h3 className={`text-2xl font-bold mb-3 ${textPrimary}`}>السلة فارغة</h3>
            <p className={`${textSecondary} mb-6 text-lg`}>
              لم تقم بإضافة أي منتجات للسلة بعد
            </p>
            <UnifiedButton 
              onClick={handleBackToStore}
              variant="primary"
              size="lg"
            >
              تسوق الآن
            </UnifiedButton>
          </div>
        </div>
      </div>
    );
  }

  const shipping = 25;
  const total = cart.total + shipping;

  return (
    <div className="space-y-6 min-h-screen p-4 md:p-6" style={pageStyle}>
      <div className="flex items-center gap-4">
        <UnifiedButton 
          variant="ghost" 
          size="sm" 
          onClick={handleBackToStore}
          className={`${isLight ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100' : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'}`}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          العودة للمتجر
        </UnifiedButton>
        <h1 className={`text-3xl font-bold ${isLight ? 'text-amber-700' : 'bg-gradient-danger bg-clip-text text-transparent'}`}>
          سلة التسوق
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence>
            {cart.items.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.3 }}
              >
                <div className={`rounded-2xl p-6 ${cardBg} border shadow-sm`}>
                  <div className="flex gap-6">
                    {item.product_image_url && (
                      <div className="relative group w-24 h-24 flex-shrink-0">
                        <img
                          src={item.product_image_url}
                          alt={item.product_title}
                          className={`w-full h-full object-cover rounded-xl border-2 ${isLight ? 'border-gray-200' : 'border-red-600/20'} transition-all duration-300`}
                        />
                      </div>
                    )}
                    
                    <div className="flex-1 space-y-3">
                      <h3 className={`font-bold text-lg ${textPrimary}`}>{item.product_title}</h3>
                      
                      {item.selected_variants && Object.keys(item.selected_variants).length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(item.selected_variants).map(([type, value]) => (
                            <UnifiedBadge 
                              key={type} 
                              variant="outline" 
                              className={isLight ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-primary/30 bg-primary/10 text-primary-foreground'}
                            >
                              {type === 'size' ? 'المقاس' : type === 'color' ? 'اللون' : type}: {value}
                            </UnifiedBadge>
                          ))}
                        </div>
                      )}
                      
                      <p className={`text-sm ${textSecondary}`}>
                        {item.unit_price_sar.toFixed(0)} ر.س للقطعة
                      </p>
                      
                      <div className="flex items-center justify-between pt-2">
                        <div className={`flex items-center gap-3 rounded-xl p-2 border ${quantityBg}`}>
                          <UnifiedButton
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            disabled={updatingItems.has(item.id)}
                            className="h-9 w-9 p-0"
                          >
                            <Minus className="h-4 w-4" />
                          </UnifiedButton>
                          
                          <span className={`min-w-[3rem] text-center font-bold ${textPrimary}`}>
                            {item.quantity}
                          </span>
                          
                          <UnifiedButton
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            disabled={updatingItems.has(item.id)}
                            className="h-9 w-9 p-0"
                          >
                            <Plus className="h-4 w-4" />
                          </UnifiedButton>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className={`font-bold text-2xl ${isLight ? 'text-amber-700' : 'bg-gradient-danger bg-clip-text text-transparent'}`}>
                            {item.total_price_sar.toFixed(0)} ر.س
                          </span>
                          
                          <UnifiedButton
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={updatingItems.has(item.id)}
                            className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 h-9 w-9 p-0"
                          >
                            <Trash2 className="h-5 w-5" />
                          </UnifiedButton>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="lg:col-span-1">
          <div className={`sticky top-4 rounded-2xl ${cardBg} border shadow-lg overflow-hidden`}>
            <div className={`p-6 border-b ${isLight ? 'border-gray-200' : 'border-red-600/15'}`}>
              <h2 className={`text-2xl font-bold ${isLight ? 'text-amber-700' : 'bg-gradient-danger bg-clip-text text-transparent'}`}>
                ملخص الطلب
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <div className={`flex justify-between text-base ${textSecondary}`}>
                  <span>المجموع الفرعي</span>
                  <span className={`font-semibold ${textPrimary}`}>{cart.total.toFixed(0)} ر.س</span>
                </div>
                <div className={`flex justify-between text-base ${textSecondary}`}>
                  <span>الشحن</span>
                  <span className={`font-semibold ${textPrimary}`}>{shipping} ر.س</span>
                </div>
                <div className={`h-px ${isLight ? 'bg-gray-200' : 'bg-red-600/20'}`} />
                <div className="flex justify-between items-center py-2">
                  <span className={`text-xl font-bold ${textPrimary}`}>المجموع الكلي</span>
                  <span className={`text-3xl font-bold ${isLight ? 'text-amber-700' : 'bg-gradient-danger bg-clip-text text-transparent'}`}>
                    {total.toFixed(0)} ر.س
                  </span>
                </div>
              </div>

              <UnifiedButton 
                fullWidth
                size="lg"
                variant="primary"
                onClick={() => navigate(`/${storeSlug}/checkout`)}
                className="h-14 text-lg group"
              >
                إتمام الطلب
                <ArrowRight className="h-5 w-5 mr-2 group-hover:translate-x-1 transition-transform" />
              </UnifiedButton>

              <div className={`rounded-lg p-3 border ${isLight ? 'bg-amber-50 border-amber-200' : 'bg-slate-800/50 border-red-600/10'}`}>
                <p className={`text-xs text-center ${textSecondary}`}>
                  الدفع عند الاستلام متاح
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const IsolatedStoreCart: React.FC = () => {
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const { store } = useOutletContext<StoreContextType>();

  return (
    <IsolatedStoreCartContent 
      storeSlug={storeSlug || ''} 
      store={store} 
    />
  );
};
