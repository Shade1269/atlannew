import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, CreditCard, Truck, Check, ChevronLeft, Lock, 
  Building2, User, Phone, Mail, Home, Tag, ShieldCheck 
} from 'lucide-react';
import { useLuxuryTheme } from './LuxuryThemeContext';

interface CartItem {
  id: string;
  title: string;
  imageUrl: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
}

interface LuxuryCheckoutProps {
  items: CartItem[];
  onComplete: () => void;
  onBack?: () => void;
}

type CheckoutStep = 'shipping' | 'payment' | 'review';

const paymentMethods = [
  { id: 'card', name: 'بطاقة ائتمانية', icon: CreditCard, desc: 'Visa, Mastercard, مدى' },
  { id: 'cod', name: 'الدفع عند الاستلام', icon: Truck, desc: '+15 ر.س رسوم إضافية' },
];

const cities = [
  'الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام', 
  'الخبر', 'الظهران', 'تبوك', 'أبها', 'القصيم'
];

export const LuxuryCheckout: React.FC<LuxuryCheckoutProps> = ({
  items,
  onComplete,
  onBack,
}) => {
  const { colors } = useLuxuryTheme();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('shipping');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    postalCode: '',
    notes: '',
    paymentMethod: 'card',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    saveCard: false,
    couponCode: '',
  });

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal >= 500 ? 0 : 30;
  const codFee = formData.paymentMethod === 'cod' ? 15 : 0;
  const total = subtotal + shipping + codFee;

  const steps = [
    { id: 'shipping', label: 'العنوان', icon: MapPin },
    { id: 'payment', label: 'الدفع', icon: CreditCard },
    { id: 'review', label: 'المراجعة', icon: Check },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleNextStep = () => {
    if (currentStep === 'shipping') setCurrentStep('payment');
    else if (currentStep === 'payment') setCurrentStep('review');
    else onComplete();
  };

  const handlePrevStep = () => {
    if (currentStep === 'payment') setCurrentStep('shipping');
    else if (currentStep === 'review') setCurrentStep('payment');
    else onBack?.();
  };

  const inputStyle = {
    background: colors.backgroundSecondary,
    border: `1px solid ${colors.border}`,
    color: colors.text,
  };

  return (
    <div 
      className="min-h-screen py-8"
      style={{ background: colors.background, color: colors.text }}
    >
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <motion.button
            onClick={handlePrevStep}
            className="p-2 rounded-lg"
            style={{ background: colors.accentMuted }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft className="w-5 h-5 rotate-180" />
          </motion.button>
          <h1 
            className="text-2xl md:text-3xl"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            إتمام الطلب
          </h1>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 md:gap-8 mb-10">
          {steps.map((step, index) => {
            const isActive = step.id === currentStep;
            const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
            
            return (
              <React.Fragment key={step.id}>
                <motion.div 
                  className="flex items-center gap-2"
                  animate={{ opacity: isActive || isCompleted ? 1 : 0.4 }}
                >
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                    style={{ 
                      background: isCompleted 
                        ? colors.success 
                        : isActive 
                          ? colors.primary 
                          : colors.accentMuted,
                      color: isActive || isCompleted ? colors.primaryText : 'inherit',
                    }}
                  >
                    {isCompleted ? <Check className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                  </div>
                  <span className="hidden md:inline text-sm font-medium">{step.label}</span>
                </motion.div>
                {index < steps.length - 1 && (
                  <div 
                    className="w-12 md:w-20 h-0.5"
                    style={{ 
                      background: isCompleted 
                        ? colors.success 
                        : colors.accentMuted 
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Step */}
            {currentStep === 'shipping' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-2xl p-6 md:p-8 space-y-6"
                style={{ 
                  background: colors.backgroundSecondary,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <h2 className="text-xl font-medium flex items-center gap-2">
                  <MapPin className="w-5 h-5" style={{ color: colors.accent }} />
                  معلومات التوصيل
                </h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-2" style={{ color: colors.textSecondary }}>الاسم الأول</label>
                    <div className="relative">
                      <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: colors.textMuted }} />
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full pr-10 pl-4 py-3 rounded-lg text-sm outline-none focus:ring-2"
                        style={{ ...inputStyle, '--tw-ring-color': colors.primary } as any}
                        placeholder="أدخلي اسمك"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm mb-2" style={{ color: colors.textSecondary }}>اسم العائلة</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg text-sm outline-none focus:ring-2"
                      style={inputStyle}
                      placeholder="اسم العائلة"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-2" style={{ color: colors.textSecondary }}>البريد الإلكتروني</label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: colors.textMuted }} />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full pr-10 pl-4 py-3 rounded-lg text-sm outline-none focus:ring-2"
                        style={inputStyle}
                        placeholder="example@email.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm mb-2" style={{ color: colors.textSecondary }}>رقم الجوال</label>
                    <div className="relative">
                      <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: colors.textMuted }} />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full pr-10 pl-4 py-3 rounded-lg text-sm outline-none focus:ring-2"
                        style={inputStyle}
                        placeholder="05xxxxxxxx"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-2" style={{ color: colors.textSecondary }}>المدينة</label>
                    <div className="relative">
                      <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: colors.textMuted }} />
                      <select
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full pr-10 pl-4 py-3 rounded-lg text-sm outline-none focus:ring-2 appearance-none"
                        style={inputStyle}
                      >
                        <option value="">اختاري المدينة</option>
                        {cities.map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm mb-2" style={{ color: colors.textSecondary }}>الحي</label>
                    <input
                      type="text"
                      name="district"
                      value={formData.district}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg text-sm outline-none focus:ring-2"
                      style={inputStyle}
                      placeholder="اسم الحي"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-2" style={{ color: colors.textSecondary }}>العنوان التفصيلي</label>
                  <div className="relative">
                    <Home className="absolute right-3 top-3 w-4 h-4" style={{ color: colors.textMuted }} />
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full pr-10 pl-4 py-3 rounded-lg text-sm outline-none focus:ring-2 resize-none"
                      style={inputStyle}
                      placeholder="الشارع، رقم المبنى، رقم الشقة..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-2" style={{ color: colors.textSecondary }}>ملاحظات للتوصيل (اختياري)</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-4 py-3 rounded-lg text-sm outline-none focus:ring-2 resize-none"
                    style={inputStyle}
                    placeholder="تعليمات خاصة للتوصيل..."
                  />
                </div>
              </motion.div>
            )}

            {/* Payment Step */}
            {currentStep === 'payment' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {/* Payment Methods */}
                <div 
                  className="rounded-2xl p-6 md:p-8 space-y-4"
                  style={{ 
                    background: colors.backgroundSecondary,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <h2 className="text-xl font-medium flex items-center gap-2">
                    <CreditCard className="w-5 h-5" style={{ color: colors.accent }} />
                    طريقة الدفع
                  </h2>

                  <div className="space-y-3">
                    {paymentMethods.map((method) => (
                      <motion.button
                        key={method.id}
                        onClick={() => setFormData(prev => ({ ...prev, paymentMethod: method.id }))}
                        className="w-full flex items-center gap-4 p-4 rounded-xl text-right transition-all"
                        style={{ 
                          background: formData.paymentMethod === method.id 
                            ? colors.accentMuted 
                            : colors.backgroundTertiary,
                          border: formData.paymentMethod === method.id 
                            ? `2px solid ${colors.primary}` 
                            : `1px solid ${colors.border}`,
                        }}
                        whileHover={{ scale: 1.01 }}
                      >
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ background: colors.accentMuted }}
                        >
                          <method.icon className="w-6 h-6" style={{ color: colors.accent }} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{method.name}</p>
                          <p className="text-sm" style={{ color: colors.textMuted }}>{method.desc}</p>
                        </div>
                        <div 
                          className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                          style={{ 
                            borderColor: formData.paymentMethod === method.id 
                              ? colors.primary 
                              : colors.border,
                          }}
                        >
                          {formData.paymentMethod === method.id && (
                            <div 
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ background: colors.primary }}
                            />
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Card Details */}
                {formData.paymentMethod === 'card' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="rounded-2xl p-6 md:p-8 space-y-4"
                    style={{ 
                      background: colors.backgroundSecondary,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <h3 className="text-lg font-medium">بيانات البطاقة</h3>
                    
                    <div>
                      <label className="block text-sm mb-2" style={{ color: colors.textSecondary }}>رقم البطاقة</label>
                      <input
                        type="text"
                        name="cardNumber"
                        value={formData.cardNumber}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-lg text-sm outline-none focus:ring-2"
                        style={inputStyle}
                        placeholder="1234 5678 9012 3456"
                        dir="ltr"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm mb-2" style={{ color: colors.textSecondary }}>تاريخ الانتهاء</label>
                        <input
                          type="text"
                          name="cardExpiry"
                          value={formData.cardExpiry}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-lg text-sm outline-none focus:ring-2"
                          style={inputStyle}
                          placeholder="MM/YY"
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-2" style={{ color: colors.textSecondary }}>CVV</label>
                        <input
                          type="password"
                          name="cardCvv"
                          value={formData.cardCvv}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-lg text-sm outline-none focus:ring-2"
                          style={inputStyle}
                          placeholder="***"
                          maxLength={4}
                          dir="ltr"
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="saveCard"
                        checked={formData.saveCard}
                        onChange={handleInputChange}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm" style={{ color: colors.textSecondary }}>احفظي البطاقة للمرات القادمة</span>
                    </label>

                    <div 
                      className="flex items-center gap-2 text-xs pt-2"
                      style={{ borderTop: `1px solid ${colors.border}`, color: colors.textMuted }}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>معاملة آمنة ومشفرة بالكامل</span>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Review Step */}
            {currentStep === 'review' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {/* Shipping Summary */}
                <div 
                  className="rounded-2xl p-6 space-y-3"
                  style={{ 
                    background: colors.backgroundSecondary,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4" style={{ color: colors.accent }} />
                      عنوان التوصيل
                    </h3>
                    <button 
                      onClick={() => setCurrentStep('shipping')}
                      className="text-sm underline"
                      style={{ color: colors.accent }}
                    >
                      تعديل
                    </button>
                  </div>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    {formData.firstName} {formData.lastName}<br />
                    {formData.address}, {formData.district}<br />
                    {formData.city}<br />
                    {formData.phone}
                  </p>
                </div>

                {/* Payment Summary */}
                <div 
                  className="rounded-2xl p-6 space-y-3"
                  style={{ 
                    background: colors.backgroundSecondary,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium flex items-center gap-2">
                      <CreditCard className="w-4 h-4" style={{ color: colors.accent }} />
                      طريقة الدفع
                    </h3>
                    <button 
                      onClick={() => setCurrentStep('payment')}
                      className="text-sm underline"
                      style={{ color: colors.accent }}
                    >
                      تعديل
                    </button>
                  </div>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    {formData.paymentMethod === 'card' 
                      ? `بطاقة تنتهي بـ ${formData.cardNumber.slice(-4) || '****'}` 
                      : 'الدفع عند الاستلام'
                    }
                  </p>
                </div>

                {/* Items Summary */}
                <div 
                  className="rounded-2xl p-6 space-y-4"
                  style={{ 
                    background: colors.backgroundSecondary,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <h3 className="font-medium">المنتجات ({items.length})</h3>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <img 
                          src={item.imageUrl} 
                          alt={item.title}
                          className="w-16 h-20 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="text-xs" style={{ color: colors.textMuted }}>
                            {item.size && `المقاس: ${item.size}`} 
                            {item.color && ` | اللون: ${item.color}`}
                          </p>
                          <p className="text-xs" style={{ color: colors.textMuted }}>الكمية: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-medium" style={{ color: colors.accent }}>
                          {item.price * item.quantity} ر.س
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Continue Button */}
            <motion.button
              onClick={handleNextStep}
              className="w-full py-4 rounded-xl flex items-center justify-center gap-2 font-medium text-lg"
              style={{
                background: colors.buttonPrimary,
                color: colors.buttonText,
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {currentStep === 'review' ? (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  تأكيد الطلب
                </>
              ) : (
                <>
                  <span>متابعة</span>
                  <ChevronLeft className="w-5 h-5 rotate-180" />
                </>
              )}
            </motion.button>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div 
              className="sticky top-24 rounded-2xl p-6 space-y-5"
              style={{ 
                background: colors.backgroundSecondary,
                border: `1px solid ${colors.border}`,
              }}
            >
              <h3 className="text-lg font-medium">ملخص الطلب</h3>

              {/* Items Preview */}
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="relative">
                      <img 
                        src={item.imageUrl} 
                        alt={item.title}
                        className="w-14 h-16 rounded-lg object-cover"
                      />
                      <span 
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
                        style={{ background: colors.primary, color: colors.primaryText }}
                      >
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{item.title}</p>
                      <p className="text-xs" style={{ color: colors.textMuted }}>{item.size} {item.color && `| ${item.color}`}</p>
                    </div>
                    <p className="text-sm" style={{ color: colors.accent }}>
                      {item.price * item.quantity} ر.س
                    </p>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div 
                className="flex gap-2 pt-4"
                style={{ borderTop: `1px solid ${colors.border}` }}
              >
                <div 
                  className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{ 
                    background: colors.backgroundTertiary, 
                    border: `1px solid ${colors.border}` 
                  }}
                >
                  <Tag className="w-4 h-4" style={{ color: colors.textMuted }} />
                  <input 
                    type="text" 
                    name="couponCode"
                    value={formData.couponCode}
                    onChange={handleInputChange}
                    placeholder="كود الخصم"
                    className="flex-1 bg-transparent text-sm outline-none"
                    style={{ color: colors.text }}
                  />
                </div>
                <motion.button
                  className="px-3 py-2 rounded-lg text-sm font-medium"
                  style={{ 
                    background: colors.buttonSecondary,
                    border: `1px solid ${colors.border}`,
                    color: colors.text,
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  تطبيق
                </motion.button>
              </div>

              {/* Totals */}
              <div className="space-y-2 text-sm pt-4" style={{ borderTop: `1px solid ${colors.border}` }}>
                <div className="flex justify-between" style={{ color: colors.textSecondary }}>
                  <span>المجموع الفرعي</span>
                  <span>{subtotal} ر.س</span>
                </div>
                <div className="flex justify-between" style={{ color: colors.textSecondary }}>
                  <span>الشحن</span>
                  <span style={{ color: shipping === 0 ? colors.success : 'inherit' }}>
                    {shipping === 0 ? 'مجاني' : `${shipping} ر.س`}
                  </span>
                </div>
                {codFee > 0 && (
                  <div className="flex justify-between" style={{ color: colors.textSecondary }}>
                    <span>رسوم الدفع عند الاستلام</span>
                    <span>{codFee} ر.س</span>
                  </div>
                )}
              </div>

              <div 
                className="flex justify-between font-bold text-lg pt-4"
                style={{ borderTop: `1px solid ${colors.border}` }}
              >
                <span>الإجمالي</span>
                <span style={{ color: colors.accent }}>{total} ر.س</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
