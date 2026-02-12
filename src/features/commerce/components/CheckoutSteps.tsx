import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ArrowLeft, ShoppingCart, Truck, CreditCard, CheckCircle, Package, User, Tag, X } from 'lucide-react';
import { useCustomerAuth } from '@/hooks/useCustomerAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  product: any;
  quantity: number;
  variant?: any;
}

interface CustomerInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  area: string;
}

interface CheckoutStepsProps {
  cart: CartItem[];
  onComplete: (orderData: any) => void;
  onCancel: () => void;
  shopSettings: any;
}

export const CheckoutSteps: React.FC<CheckoutStepsProps> = ({
  cart,
  onComplete,
  onCancel,
  shopSettings
}) => {
  const { customer } = useCustomerAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    area: ''
  });

  // ملء بيانات العميل المسجل دخول تلقائياً
  useEffect(() => {
    if (customer) {
      setCustomerInfo(prev => ({
        ...prev,
        name: customer.full_name || '',
        phone: customer.phone || '',
        email: customer.email || ''
      }));
    }
  }, [customer]);
  
  const [selectedShipping, setSelectedShipping] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('');
  const [_orderNumber, setOrderNumber] = useState('');
  
  // Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const subtotal = cart.reduce((sum, item) => 
    sum + (item.product.final_price || item.product.price_sar) * item.quantity, 0
  );

  const shippingCost = shopSettings?.shipping_companies?.find(
    (company: any) => company.name === selectedShipping
  )?.price || 0;

  // حساب قيمة الخصم
  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    
    let discount = 0;
    if (appliedCoupon.discount_type === 'percentage') {
      discount = (subtotal * appliedCoupon.discount_value) / 100;
      // تطبيق الحد الأقصى للخصم إذا كان موجوداً
      if (appliedCoupon.maximum_discount_amount && discount > appliedCoupon.maximum_discount_amount) {
        discount = appliedCoupon.maximum_discount_amount;
      }
    } else {
      // fixed amount
      discount = appliedCoupon.discount_value;
    }
    
    return Math.min(discount, subtotal); // لا يتجاوز الخصم قيمة المنتجات
  };

  const discountAmount = calculateDiscount();
  const totalPrice = Math.max(0, subtotal - discountAmount + shippingCost);

  // التحقق من صحة الكوبون
  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال كود الكوبون",
        variant: "destructive"
      });
      return;
    }

    setCouponLoading(true);
    try {
      const { data: coupon, error } = await supabase
        .from('affiliate_coupons')
        .select('*')
        .eq('coupon_code', couponCode.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (!coupon) {
        toast({
          title: "كوبون غير صالح",
          description: "الكوبون المدخل غير موجود أو غير نشط",
          variant: "destructive"
        });
        return;
      }

      // التحقق من صلاحية التاريخ
      const now = new Date();
      if (coupon.valid_from && new Date(coupon.valid_from) > now) {
        toast({
          title: "كوبون غير صالح",
          description: "هذا الكوبون لم يبدأ بعد",
          variant: "destructive"
        });
        return;
      }

      if (coupon.valid_until && new Date(coupon.valid_until) < now) {
        toast({
          title: "كوبون منتهي",
          description: "انتهت صلاحية هذا الكوبون",
          variant: "destructive"
        });
        return;
      }

      // التحقق من الحد الأدنى للطلب
      if (coupon.minimum_order_amount && subtotal < coupon.minimum_order_amount) {
        toast({
          title: "الطلب لا يستوفي الحد الأدنى",
          description: `يجب أن يكون مجموع الطلب ${coupon.minimum_order_amount} ريال على الأقل`,
          variant: "destructive"
        });
        return;
      }

      // التحقق من حد الاستخدام
      if (coupon.usage_limit && (coupon.usage_count ?? 0) >= coupon.usage_limit) {
        toast({
          title: "كوبون منتهي",
          description: "تم استخدام هذا الكوبون بالكامل",
          variant: "destructive"
        });
        return;
      }

      // تطبيق الكوبون
      setAppliedCoupon(coupon);
      toast({
        title: "تم تطبيق الكوبون!",
        description: `تم تطبيق خصم ${coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `${coupon.discount_value} ريال`}`,
      });
    } catch (error) {
      console.error('Error validating coupon:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء التحقق من الكوبون",
        variant: "destructive"
      });
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast({
      title: "تم إزالة الكوبون",
      description: "تم إلغاء الكوبون من الطلب"
    });
  };

  const steps = [
    { number: 1, title: 'السلة', icon: ShoppingCart, description: 'مراجعة المنتجات' },
    { number: 2, title: 'بيانات العميل', icon: User, description: 'معلومات التوصيل' },
    { number: 3, title: 'الشحن', icon: Truck, description: 'اختيار وسيلة الشحن' },
    { number: 4, title: 'الدفع', icon: CreditCard, description: 'اختيار وسيلة الدفع' },
    { number: 5, title: 'التأكيد', icon: CheckCircle, description: 'مراجعة نهائية' }
  ];

  const canProceed = () => {
    switch (currentStep) {
      case 1: return cart.length > 0;
      case 2: return customerInfo.name && customerInfo.phone && customerInfo.address;
      case 3: return selectedShipping;
      case 4: return selectedPayment;
      default: return true;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    const generatedOrderNumber = `ORD-${Date.now().toString().slice(-6)}`;
    setOrderNumber(generatedOrderNumber);
    
    const orderData = {
      orderNumber: generatedOrderNumber,
      customerInfo,
      cart,
      selectedShipping,
      selectedPayment,
      subtotal,
      shippingCost,
      coupon: appliedCoupon ? {
        id: appliedCoupon.id,
        code: appliedCoupon.coupon_code,
        name: appliedCoupon.coupon_name,
        discount: discountAmount
      } : null,
      discountAmount,
      totalPrice
    };

    onComplete(orderData);
  };

  return (
    <div className="max-w-4xl mx-auto p-6" dir="rtl">
      {/* Steps Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => {
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;
            const StepIcon = step.icon;

            return (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors
                    ${isActive ? 'bg-primary text-primary-foreground border-primary' : 
                      isCompleted ? 'bg-success text-success-foreground border-success' : 
                      'bg-muted text-muted-foreground border-muted'}
                  `}>
                    <StepIcon className="h-6 w-6" />
                  </div>
                  <div className="text-center mt-2">
                    <p className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    flex-1 h-0.5 mx-4 transition-colors
                    ${isCompleted ? 'bg-success' : 'bg-muted'}
                  `} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {React.createElement(steps[currentStep - 1].icon, { className: "h-6 w-6" })}
            {steps[currentStep - 1].title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Cart Review */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">مراجعة المنتجات</h3>
              {cart.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    {item.product.image_urls?.[0] && (
                      <img 
                        src={item.product.image_urls[0]} 
                        alt={item.product.title}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    <div>
                      <h4 className="font-medium">{item.product.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        الكمية: {item.quantity}
                      </p>
                      {item.variant && (
                        <Badge variant="outline" className="mt-1">
                          {item.variant.variant_type}: {item.variant.variant_value}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">
                      {((item.product.final_price || item.product.price_sar) * item.quantity).toFixed(2)} ر.س
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {(item.product.final_price || item.product.price_sar).toFixed(2)} ر.س × {item.quantity}
                    </p>
                  </div>
                </div>
              ))}
              
              {/* Coupon Section */}
              <div className="border-2 border-dashed border-primary/30 rounded-lg p-4 bg-primary/5">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold text-primary">هل لديك كوبون خصم؟</h4>
                </div>
                
                {appliedCoupon ? (
                  <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-success rounded-full flex items-center justify-center">
                          <CheckCircle className="h-6 w-6 text-success-foreground" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{appliedCoupon.coupon_name}</p>
                          <p className="text-sm text-muted-foreground">
                            كود: {appliedCoupon.coupon_code}
                          </p>
                          <p className="text-sm font-medium text-success">
                            خصم {appliedCoupon.discount_type === 'percentage' 
                              ? `${appliedCoupon.discount_value}%` 
                              : `${appliedCoupon.discount_value} ريال`}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={removeCoupon}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <X className="h-4 w-4 ml-1" />
                        إزالة
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="أدخل كود الكوبون"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1"
                      dir="ltr"
                    />
                    <Button 
                      onClick={validateCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      className="min-w-[100px]"
                    >
                      {couponLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      ) : (
                        <>
                          <Tag className="h-4 w-4 ml-1" />
                          تطبيق
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-base">
                  <span>المجموع الفرعي:</span>
                  <span>{subtotal.toFixed(2)} ر.س</span>
                </div>
                {appliedCoupon && discountAmount > 0 && (
                  <div className="flex justify-between text-base text-success font-medium">
                    <span>الخصم ({appliedCoupon.coupon_code}):</span>
                    <span>- {discountAmount.toFixed(2)} ر.س</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between text-lg font-semibold">
                  <span>المجموع:</span>
                  <span className="text-primary">{(subtotal - discountAmount).toFixed(2)} ر.س</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Customer Information */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">بيانات العميل</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">الاسم الكامل *</Label>
                  <Input
                    id="name"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                    placeholder="أدخل اسمك الكامل"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف *</Label>
                  <Input
                    id="phone"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                    placeholder="05xxxxxxxx"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                    placeholder="example@email.com"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">المدينة</Label>
                  <Input
                    id="city"
                    value={customerInfo.city}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, city: e.target.value })}
                    placeholder="الرياض، جدة، الدمام..."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">العنوان التفصيلي *</Label>
                <Input
                  id="address"
                  value={customerInfo.address}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                  placeholder="الحي، الشارع، رقم المبنى..."
                />
              </div>
            </div>
          )}

          {/* Step 3: Shipping */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">اختر وسيلة الشحن</h3>
              <RadioGroup value={selectedShipping} onValueChange={setSelectedShipping}>
                {shopSettings?.shipping_companies?.filter((company: any) => company.enabled)?.map((company: any, index: number) => (
                  <div key={index} className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value={company.name} id={`shipping-${index}`} />
                    <Label htmlFor={`shipping-${index}`} className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Truck className="h-5 w-5" />
                          <span>{company.name}</span>
                        </div>
                        <span className="font-semibold">
                          {company.price ? `${company.price} ر.س` : 'مجاني'}
                        </span>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Step 4: Payment */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">اختر وسيلة الدفع</h3>
              <RadioGroup value={selectedPayment} onValueChange={setSelectedPayment}>
                {shopSettings?.payment_providers?.filter((provider: any) => provider.enabled)?.map((provider: any, index: number) => (
                  <div key={index} className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value={provider.name} id={`payment-${index}`} />
                    <Label htmlFor={`payment-${index}`} className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        <span>{provider.name}</span>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Step 5: Confirmation */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">مراجعة الطلب النهائية</h3>
              
              {/* Customer Info Summary */}
              <div className="bg-muted/30 rounded-lg p-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  بيانات العميل
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p><span className="font-medium">الاسم:</span> {customerInfo.name}</p>
                  <p><span className="font-medium">الهاتف:</span> {customerInfo.phone}</p>
                  <p className="col-span-2"><span className="font-medium">العنوان:</span> {customerInfo.address}</p>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-muted/30 rounded-lg p-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  ملخص الطلب
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>المنتجات ({cart.length}):</span>
                    <span>{subtotal.toFixed(2)} ر.س</span>
                  </div>
                  {appliedCoupon && discountAmount > 0 && (
                    <div className="flex justify-between text-success font-medium">
                      <span className="flex items-center gap-1">
                        <Tag className="h-4 w-4" />
                        الخصم ({appliedCoupon.coupon_code}):
                      </span>
                      <span>- {discountAmount.toFixed(2)} ر.س</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>الشحن ({selectedShipping}):</span>
                    <span>{shippingCost ? `${shippingCost.toFixed(2)} ر.س` : 'مجاني'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>وسيلة الدفع:</span>
                    <span>{selectedPayment}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                    <span>المجموع النهائي:</span>
                    <span className="text-primary">{totalPrice.toFixed(2)} ر.س</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <div>
              {currentStep > 1 && (
                <Button variant="outline" onClick={handlePrevious}>
                  <ArrowRight className="h-4 w-4 ml-2" />
                  السابق
                </Button>
              )}
              <Button variant="ghost" onClick={onCancel} className="mr-2">
                إلغاء
              </Button>
            </div>
            
            <div>
              {currentStep < 5 ? (
                <Button 
                  onClick={handleNext} 
                  disabled={!canProceed()}
                  className="bg-primary hover:bg-primary/90"
                >
                  التالي
                  <ArrowLeft className="h-4 w-4 mr-2" />
                </Button>
              ) : (
                <Button 
                  onClick={handleComplete}
                  className="bg-success hover:bg-success/90 text-success-foreground"
                >
                  تأكيد الطلب
                  <CheckCircle className="h-4 w-4 mr-2" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckoutSteps;