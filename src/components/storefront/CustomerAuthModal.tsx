import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { UnifiedButton } from '@/components/design-system';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UnifiedCard, UnifiedCardContent } from '@/components/design-system';
import { Phone, Lock, CheckCircle, Loader2 } from 'lucide-react';
import { useCustomerAuth } from '@/hooks/useCustomerAuth';
import { StorefrontSession } from '@/utils/storefrontSession';

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  storeSlug: string;
  storeName: string;
}

/**
 * مودال بسيط لتسجيل دخول العملاء
 * يستخدم رقم الجوال + OTP فقط
 */
export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen,
  onClose,
  storeId,
  storeSlug,
  storeName
}) => {
  const { isLoading, sendOTP, verifyOTP, isAuthenticated, checkStoredSession } = useCustomerAuth();
  const [step, setStep] = useState<'phone' | 'otp' | 'authenticated'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.trim()) {
      const result = await sendOTP(phone, storeId);
      if (result.success) {
        setStep('otp');
      }
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim()) {
      const result = await verifyOTP(phone, otp, storeId);
      if (result.success) {
        // تأكيد جلسة المتجر والتحقق عبر StorefrontSession (خاصة بكل متجر)
        const manager = new StorefrontSession(storeSlug);
        const existing = manager.getSession();
        if (!existing) {
          manager.createGuestSession(storeId);
        }
        manager.verifySession(phone);

        setStep('authenticated');
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    }
  };

  // Reset when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setStep('phone');
      setPhone('');
      setOtp('');
    }
  }, [isOpen]);

  // Auto-close after successful authentication
  React.useEffect(() => {
    if (step === 'authenticated') {
      const timer = setTimeout(() => {
        onClose();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [step, onClose]);

  // Check if already authenticated (store-specific + customer context)
  React.useEffect(() => {
    if (!isOpen) return;
    const manager = new StorefrontSession(storeSlug);
    const storeSessionValid = manager.isSessionValid();

    if (storeSessionValid && isAuthenticated) {
      setStep('authenticated');
    } else {
      // نحاول مزامنة جلسة العميل إن وُجدت، وإلا نبقى على خطوة الهاتف
      if (storeSessionValid && !isAuthenticated) {
        checkStoredSession?.();
      }
      setStep('phone');
    }
  }, [isOpen, storeSlug, isAuthenticated]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">
            تسجيل الدخول
          </DialogTitle>
          <DialogDescription className="text-center">
            سجل دخولك لتتبع طلباتك في {storeName}
          </DialogDescription>
        </DialogHeader>

        <UnifiedCard variant="flat" padding="lg">
          <UnifiedCardContent className="space-y-6">
            {/* خطوة 1: رقم الجوال */}
            {step === 'phone' && (
              <form onSubmit={handlePhoneSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    رقم الجوال
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="05xxxxxxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="text-lg text-right"
                    dir="ltr"
                    required
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    سنرسل لك رمز تحقق عبر رسالة نصية
                  </p>
                </div>

                <UnifiedButton 
                  type="submit" 
                  variant="primary"
                  className="w-full h-12 text-lg"
                  disabled={isLoading || !phone.trim()}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <Phone className="h-5 w-5 ml-2" />
                      إرسال رمز التحقق
                    </>
                  )}
                </UnifiedButton>
              </form>
            )}

            {/* خطوة 2: رمز التحقق */}
            {step === 'otp' && (
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    رمز التحقق
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    maxLength={6}
                    className="text-2xl text-center tracking-widest font-mono"
                    dir="ltr"
                    required
                    disabled={isLoading}
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    أدخل الرمز المكون من 6 أرقام المرسل إلى {phone}
                  </p>
                </div>

                <div className="space-y-2">
                  <UnifiedButton 
                    type="submit"
                    variant="primary"
                    className="w-full h-12 text-lg"
                    disabled={isLoading || otp.length !== 6}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                        جاري التحقق...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5 ml-2" />
                        تحقق
                      </>
                    )}
                  </UnifiedButton>

                  <UnifiedButton
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => sendOTP(phone, storeId)}
                    disabled={isLoading}
                  >
                    إعادة إرسال الرمز
                  </UnifiedButton>
                </div>
              </form>
            )}

            {/* خطوة 3: تم التحقق */}
            {step === 'authenticated' && (
              <div className="text-center space-y-4 py-4">
                <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-12 w-12 text-success" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">تم تسجيل الدخول بنجاح!</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    يمكنك الآن تتبع طلباتك ومتابعة عملياتك الشرائية
                  </p>
                </div>
                <UnifiedButton 
                  onClick={onClose}
                  variant="primary"
                  className="w-full"
                >
                  ابدأ التسوق
                </UnifiedButton>
              </div>
            )}
          </UnifiedCardContent>
        </UnifiedCard>
      </DialogContent>
    </Dialog>
  );
};
