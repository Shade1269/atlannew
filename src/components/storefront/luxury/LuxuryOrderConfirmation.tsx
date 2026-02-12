import React from 'react';
import { motion } from 'framer-motion';
import { Check, Package, Truck, MapPin, Copy, MessageCircle, ArrowLeft } from 'lucide-react';
import { useLuxuryTheme } from './LuxuryThemeContext';

interface LuxuryOrderConfirmationProps {
  orderId: string;
  orderDate: string;
  total: number;
  onContinueShopping: () => void;
  onTrackOrder?: () => void;
}

export const LuxuryOrderConfirmation: React.FC<LuxuryOrderConfirmationProps> = ({
  orderId,
  orderDate,
  total,
  onContinueShopping,
  onTrackOrder,
}) => {
  const { colors } = useLuxuryTheme();
  
  const handleCopyOrderNumber = () => {
    navigator.clipboard.writeText(orderId);
  };

  const estimatedDelivery = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('ar-SA');

  const steps = [
    { icon: Check, label: 'تم الطلب', completed: true },
    { icon: Package, label: 'قيد التجهيز', completed: false },
    { icon: Truck, label: 'في الطريق', completed: false },
    { icon: MapPin, label: 'تم التوصيل', completed: false },
  ];

  return (
    <div 
      className="min-h-screen py-8 md:py-12"
      style={{ background: colors.background, color: colors.text }}
    >
      <div className="container mx-auto px-4 md:px-6 max-w-4xl">
        {/* Success Header */}
        <motion.div 
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Success Icon */}
          <motion.div
            className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{ 
              background: `linear-gradient(135deg, ${colors.success}, ${colors.success})`,
              boxShadow: `0 0 40px ${colors.success}40`,
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Check className="w-12 h-12" style={{ color: colors.primaryText }} strokeWidth={3} />
            </motion.div>
          </motion.div>

          <h1 
            className="text-3xl md:text-4xl mb-3"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            شكراً لطلبك!
          </h1>
          <p className="text-lg" style={{ color: colors.textSecondary }}>
            تم استلام طلبك بنجاح وسيتم معالجته قريباً
          </p>
        </motion.div>

        {/* Order Number */}
        <motion.div
          className="rounded-2xl p-6 mb-8 text-center"
          style={{ 
            background: colors.accentMuted,
            border: `1px solid ${colors.borderHover}`,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-sm mb-2" style={{ color: colors.textMuted }}>رقم الطلب</p>
          <div className="flex items-center justify-center gap-3">
            <span 
              className="text-2xl md:text-3xl font-bold tracking-wider"
              style={{ color: colors.accent, fontFamily: 'monospace' }}
            >
              #{orderId}
            </span>
            <motion.button
              onClick={handleCopyOrderNumber}
              className="p-2 rounded-lg"
              style={{ background: colors.backgroundTertiary }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Copy className="w-4 h-4" />
            </motion.button>
          </div>
          <p className="text-sm mt-2" style={{ color: colors.textMuted }}>
            تم الطلب في {orderDate}
          </p>
        </motion.div>

        {/* Order Progress */}
        <motion.div
          className="rounded-2xl p-6 mb-8"
          style={{ 
            background: colors.backgroundSecondary,
            border: `1px solid ${colors.border}`,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium">حالة الطلب</h2>
            <span className="text-sm" style={{ color: colors.accent }}>
              التوصيل المتوقع: {estimatedDelivery}
            </span>
          </div>

          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={index}>
                <div className="flex flex-col items-center gap-2">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ 
                      background: step.completed 
                        ? colors.success 
                        : colors.accentMuted,
                      color: step.completed ? colors.primaryText : colors.textMuted,
                    }}
                  >
                    <step.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs text-center" style={{ color: colors.textSecondary }}>{step.label}</span>
                </div>
                {index < steps.length - 1 && (
                  <div 
                    className="flex-1 h-0.5 mx-2"
                    style={{ 
                      background: step.completed 
                        ? colors.success 
                        : colors.border 
                    }}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </motion.div>

        {/* Order Summary */}
        <motion.div
          className="rounded-2xl p-6 mb-8"
          style={{ 
            background: colors.backgroundSecondary,
            border: `1px solid ${colors.border}`,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="font-medium mb-4">ملخص الطلب</h3>
          <div 
            className="flex justify-between font-bold text-lg"
          >
            <span>الإجمالي</span>
            <span style={{ color: colors.accent }}>{total} ر.س</span>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <motion.button
            onClick={onTrackOrder}
            className="flex-1 py-4 rounded-xl flex items-center justify-center gap-2 font-medium"
            style={{
              background: colors.buttonPrimary,
              color: colors.buttonText,
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Truck className="w-5 h-5" />
            تتبع الطلب
          </motion.button>

          <motion.button
            onClick={onContinueShopping}
            className="flex-1 py-4 rounded-xl flex items-center justify-center gap-2 font-medium"
            style={{
              background: colors.buttonSecondary,
              border: `1px solid ${colors.border}`,
              color: colors.text,
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ArrowLeft className="w-5 h-5" />
            متابعة التسوق
          </motion.button>
        </motion.div>

        {/* Support CTA */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-sm mb-2" style={{ color: colors.textMuted }}>هل تحتاجين مساعدة؟</p>
          <button 
            className="inline-flex items-center gap-2 text-sm"
            style={{ color: colors.accent }}
          >
            <MessageCircle className="w-4 h-4" />
            تواصلي مع خدمة العملاء
          </button>
        </motion.div>
      </div>
    </div>
  );
};
