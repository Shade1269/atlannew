import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Trash2, ShoppingBag, ArrowRight, Tag, Truck } from 'lucide-react';
import { useLuxuryTheme } from './LuxuryThemeContext';

interface CartItem {
  id: string;
  title: string;
  imageUrl: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  size?: string;
  color?: string;
}

interface LuxuryCartProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
  onContinueShopping: () => void;
}

export const LuxuryCart: React.FC<LuxuryCartProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onContinueShopping,
}) => {
  const { colors } = useLuxuryTheme();
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal >= 500 ? 0 : 30;
  const total = subtotal + shipping;

  return (
    <div 
      className="min-h-screen py-8 transition-colors duration-500"
      style={{ background: colors.background, color: colors.text }}
    >
      <div className="container mx-auto px-4 md:px-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-6 h-6" style={{ color: colors.accent }} />
            <h1 
              className="text-2xl md:text-3xl"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              سلة التسوق
            </h1>
            <span 
              className="px-3 py-1 rounded-full text-sm font-medium"
              style={{ background: colors.accentMuted, color: colors.accent }}
            >
              {items.length} منتج
            </span>
          </div>
          <motion.button
            onClick={onContinueShopping}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
            style={{ 
              background: colors.buttonSecondary,
              border: `1px solid ${colors.border}`,
              color: colors.text,
            }}
            whileHover={{ scale: 1.02 }}
          >
            <ArrowRight className="w-4 h-4" />
            متابعة التسوق
          </motion.button>
        </div>

        {/* Free Shipping Notice */}
        {subtotal > 0 && subtotal < 500 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl flex items-center gap-3"
            style={{ 
              background: colors.accentMuted, 
              border: `1px solid ${colors.border}` 
            }}
          >
            <Truck className="w-5 h-5" style={{ color: colors.accent }} />
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              أضيفي <span className="font-bold" style={{ color: colors.accent }}>{500 - subtotal} ر.س</span> للحصول على شحن مجاني
            </p>
          </motion.div>
        )}

        {/* Empty Cart */}
        {items.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <ShoppingBag className="w-20 h-20 mb-6" style={{ color: colors.textMuted, opacity: 0.3 }} />
            <h2 className="text-2xl mb-3" style={{ fontFamily: "'Playfair Display', serif", color: colors.text }}>
              سلتك فارغة
            </h2>
            <p className="text-sm mb-8" style={{ color: colors.textMuted }}>اكتشفي تشكيلتنا الراقية وأضيفي قطعك المفضلة</p>
            <motion.button
              onClick={onContinueShopping}
              className="px-8 py-3 rounded-xl font-medium"
              style={{
                background: colors.primaryGradient,
                color: colors.primaryText,
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              تصفحي المنتجات
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Items List */}
            <div className="lg:col-span-2 space-y-4">
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className="flex gap-4 p-5 rounded-2xl transition-colors duration-500"
                    style={{ 
                      background: colors.backgroundCard, 
                      border: `1px solid ${colors.border}` 
                    }}
                  >
                    {/* Image */}
                    <div 
                      className="w-28 h-32 rounded-xl overflow-hidden flex-shrink-0"
                      style={{ border: `1px solid ${colors.border}` }}
                    >
                      <img 
                        src={item.imageUrl} 
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium mb-1" style={{ color: colors.text }}>
                            {item.title}
                          </h3>
                          <div className="flex gap-3 text-xs" style={{ color: colors.textMuted }}>
                            {item.size && <span>المقاس: {item.size}</span>}
                            {item.color && <span>اللون: {item.color}</span>}
                          </div>
                        </div>
                        <motion.button
                          onClick={() => onRemoveItem(item.id)}
                          className="p-2 rounded-lg"
                          style={{ background: colors.buttonDanger }}
                          whileHover={{ scale: 1.1 }}
                        >
                          <Trash2 className="w-4 h-4" style={{ color: colors.error }} />
                        </motion.button>
                      </div>

                      <div className="mt-auto flex items-center justify-between">
                        {/* Quantity */}
                        <div 
                          className="flex items-center rounded-xl overflow-hidden"
                          style={{ border: `1px solid ${colors.border}` }}
                        >
                          <motion.button
                            onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                            className="px-3 py-2"
                            style={{ background: colors.buttonSecondary }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Minus className="w-4 h-4" />
                          </motion.button>
                          <span className="px-4 text-sm font-medium">{item.quantity}</span>
                          <motion.button
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            className="px-3 py-2"
                            style={{ background: colors.buttonSecondary }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Plus className="w-4 h-4" />
                          </motion.button>
                        </div>

                        {/* Price */}
                        <div className="text-left">
                          <p className="font-bold text-lg" style={{ color: colors.accent }}>
                            {item.price * item.quantity} ر.س
                          </p>
                          {item.originalPrice && (
                            <p className="text-sm line-through" style={{ color: colors.textMuted }}>
                              {item.originalPrice * item.quantity} ر.س
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Summary Sidebar */}
            <div className="lg:col-span-1">
              <div 
                className="sticky top-24 rounded-2xl p-6 space-y-5 transition-colors duration-500"
                style={{ 
                  background: colors.backgroundCard,
                  border: `1px solid ${colors.border}` 
                }}
              >
                <h2 className="font-medium text-lg" style={{ color: colors.text }}>ملخص الطلب</h2>

                {/* Coupon */}
                <div className="flex gap-2">
                  <div 
                    className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg"
                    style={{ 
                      background: colors.backgroundInput, 
                      border: `1px solid ${colors.borderInput}` 
                    }}
                  >
                    <Tag className="w-4 h-4" style={{ color: colors.textMuted }} />
                    <input 
                      type="text" 
                      placeholder="كود الخصم"
                      className="flex-1 bg-transparent text-sm outline-none"
                      style={{ color: colors.text }}
                    />
                  </div>
                  <motion.button
                    className="px-3 py-2.5 rounded-lg text-sm font-medium"
                    style={{ 
                      background: colors.accentMuted,
                      border: `1px solid ${colors.borderHover}`,
                      color: colors.accent,
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    تطبيق
                  </motion.button>
                </div>

                {/* Summary */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between" style={{ color: colors.textSecondary }}>
                    <span>المجموع الفرعي</span>
                    <span>{subtotal} ر.س</span>
                  </div>
                  <div className="flex justify-between" style={{ color: colors.textSecondary }}>
                    <span>الشحن</span>
                    <span style={{ color: shipping === 0 ? colors.success : 'inherit' }}>
                      {shipping === 0 ? 'مجاني ✓' : `${shipping} ر.س`}
                    </span>
                  </div>
                  <div 
                    className="flex justify-between font-bold text-lg pt-4"
                    style={{ borderTop: `1px solid ${colors.border}` }}
                  >
                    <span style={{ color: colors.text }}>الإجمالي</span>
                    <span style={{ color: colors.accent }}>{total} ر.س</span>
                  </div>
                </div>

                {/* Checkout Button */}
                <motion.button
                  onClick={onCheckout}
                  className="w-full py-4 rounded-xl flex items-center justify-center gap-2 font-medium text-lg"
                  style={{
                    background: colors.primaryGradient,
                    color: colors.primaryText,
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>إتمام الطلب</span>
                  <ArrowRight className="w-5 h-5 rotate-180" />
                </motion.button>

                <p className="text-center text-xs" style={{ color: colors.textMuted }}>
                  الدفع الآمن مع Visa, Mastercard, مدى
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
