import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { supabasePublic } from '@/integrations/supabase/publicClient';
import { useToast } from '@/hooks/use-toast';

interface CustomerProfile {
  id: string;
  profile_id: string;
  phone: string;
  email?: string;
  full_name: string;
  loyalty_points: number;
  total_orders: number;
  total_spent_sar: number;
  created_at: string;
  updated_at: string;
}

interface CustomerSession {
  customer: CustomerProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionToken: string | null;
}

interface CustomerAuthContextType {
  // الحالة الأساسية
  customer: CustomerProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // وظائف المصادقة
  sendOTP: (phone: string, storeId?: string) => Promise<{ success: boolean; otpCode?: string; error?: string }>;
  verifyOTP: (phone: string, otpCode: string, storeId?: string, role?: 'affiliate' | 'merchant' | 'customer') => Promise<{ success: boolean; customer?: CustomerProfile; error?: string }>;
  signInWithPassword: (phone: string, password: string) => Promise<{ success: boolean; customer?: CustomerProfile; error?: string }>;
  setPassword: (phone: string, otpCode: string, password: string) => Promise<{ success: boolean; error?: string }>;

  // إدارة الجلسة
  signOut: () => void;
  refreshSession: () => Promise<void>;
  checkStoredSession: () => Promise<void>;
  updateProfile: (updates: Partial<CustomerProfile>) => Promise<{ success: boolean; error?: string }>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

const CUSTOMER_SESSION_KEY = 'customer_session';
const SESSION_EXPIRY_DAYS = 30;

interface CustomerAuthProviderProps {
  children: ReactNode;
}

const CustomerAuthProvider: React.FC<CustomerAuthProviderProps> = ({ children }) => {
  const { toast } = useToast();
  const [session, setSession] = useState<CustomerSession>({
    customer: null,
    isAuthenticated: false,
    isLoading: true,
    sessionToken: null
  });

  // توليد رمز جلسة فريد
  const generateSessionToken = () => {
    return `customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // حفظ الجلسة في localStorage (محمي لـ Safari Private)
  const saveSession = (customer: CustomerProfile) => {
    const sessionToken = generateSessionToken();
    const sessionData = {
      customer,
      sessionToken,
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + (SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000)).toISOString()
    };
    try {
      if (typeof window !== 'undefined') {
        window.localStorage?.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(sessionData));
      }
    } catch {
      // تجاهل أخطاء التخزين في وضع التصفح الخاص
    }
    setSession({
      customer,
      isAuthenticated: true,
      isLoading: false,
      sessionToken
    });
  };

  // إزالة الجلسة (محمي لـ Safari Private)
  const clearSession = () => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage?.removeItem(CUSTOMER_SESSION_KEY);
      }
    } catch {
      // تجاهل أخطاء التخزين
    }
    setSession({
      customer: null,
      isAuthenticated: false,
      isLoading: false,
      sessionToken: null
    });
  };

  // التحقق من صحة الجلسة المحفوظة
  const validateStoredSession = async (): Promise<boolean> => {
    try {
      let storedSession: string | null = null;
      try {
        if (typeof window !== 'undefined') {
          storedSession = window.localStorage?.getItem(CUSTOMER_SESSION_KEY) ?? null;
        }
      } catch {
        storedSession = null;
      }
      if (!storedSession) return false;

      const sessionData = JSON.parse(storedSession);

      // التحقق من انتهاء الصلاحية
      if (new Date() > new Date(sessionData.expiresAt)) {
        clearSession();
        return false;
      }

      // التحقق من صحة بيانات العميل من قاعدة البيانات
      const { data: customerData, error } = await supabase
        .from('customers')
        .select(`
          *,
          profiles!customers_profile_id_fkey (
            id,
            phone,
            email,
            full_name
          )
        `)
        .eq('id', sessionData.customer.id)
        .maybeSingle();

      if (error || !customerData || !customerData.profiles) {
        clearSession();
        return false;
      }

      // تحديث بيانات الجلسة بالبيانات الأحدث
      const updatedCustomer: CustomerProfile = {
        id: customerData.id,
        profile_id: customerData.profile_id,
        phone: customerData.profiles.phone ?? '',
        email: customerData.profiles.email ?? undefined,
        full_name: customerData.profiles.full_name ?? '',
        loyalty_points: customerData.loyalty_points || 0,
        total_orders: customerData.total_orders || 0,
        total_spent_sar: customerData.total_spent_sar || 0,
        created_at: customerData.created_at,
        updated_at: customerData.updated_at
      };

      setSession({
        customer: updatedCustomer,
        isAuthenticated: true,
        isLoading: false,
        sessionToken: sessionData.sessionToken
      });

      return true;
    } catch (error) {
      console.error('خطأ في التحقق من الجلسة:', error);
      clearSession();
      return false;
    }
  };

  // إرسال كود OTP عبر Supabase
  const sendOTP = async (phone: string, storeId?: string) => {
    try {
      setSession(prev => ({ ...prev, isLoading: true }));

      // تنظيف رقم الهاتف وتحويله إلى E.164
      const digits = phone.replace(/\D/g, '');
      let fullPhone = '';
      if (digits.startsWith('966')) {
        fullPhone = `+${digits}`;
      } else if (digits.startsWith('0')) {
        fullPhone = `+966${digits.replace(/^0+/, '')}`;
      } else if (digits.startsWith('5') && digits.length === 9) {
        fullPhone = `+966${digits}`;
      } else if (phone.startsWith('+')) {
        fullPhone = phone;
      } else {
        fullPhone = `+${digits}`;
      }

      // إرسال OTP عبر Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('send-customer-otp', {
        body: { phone: fullPhone, storeId }
      });

      // معالجة خطأ الـ edge function
      if (error) {
        // إذا كان الخطأ يحتوي على رسالة من الـ function
        if (data?.error) {
          throw new Error(data.error);
        }
        throw error;
      }

      // إذا كانت الاستجابة تحتوي على خطأ
      if (data && !data.success && data.error) {
        throw new Error(data.error);
      }

      // إذا تم الحظر من المزود لكن أعاد الخادم كوداً للاختبار، نعرض تنبيه ونواصل
      if (data?.blocked) {
        toast({
          title: "تم إرسال كود للاختبار",
          description: data?.message || 'مزود الرسائل حظر الإرسال مؤقتاً. يمكنك استخدام الكود الظاهر الآن للتجربة',
        });
      }

      if (!data?.success && !data?.otp) throw new Error(data?.error || 'فشل في إرسال رمز التحقق');

      // حفظ البيانات في sessionStorage
      sessionStorage.setItem('customer-otp-confirmation', JSON.stringify({
        phone: fullPhone,
        storeId
      }));

      toast({
        title: "تم إرسال كود التحقق",
        description: `تم إرسال رمز التحقق إلى ${fullPhone}${data?.blocked ? ' (اختبار)' : ''}`,
      });

      return { success: true, otpCode: data.otp };
    } catch (error: any) {
      console.error('خطأ في إرسال OTP:', error);

      const errorMessage = error.message || 'فشل في إرسال رمز التحقق';

      toast({
        title: "خطأ في إرسال الكود",
        description: errorMessage,
        variant: "destructive",
      });

      return { success: false, error: errorMessage };
    } finally {
      setSession(prev => ({ ...prev, isLoading: false }));
    }
  };

  // التحقق من كود OTP وتسجيل الدخول عبر Supabase
  const verifyOTP = async (phone: string, otpCode: string, storeId?: string, _role?: 'affiliate' | 'merchant' | 'customer') => {
    try {
      setSession(prev => ({ ...prev, isLoading: true }));

      // تنظيف رقم الهاتف وتحويله إلى E.164
      const digits = phone.replace(/\D/g, '');
      let fullPhone = '';
      if (digits.startsWith('966')) {
        fullPhone = `+${digits}`;
      } else if (digits.startsWith('0')) {
        fullPhone = `+966${digits.replace(/^0+/, '')}`;
      } else if (digits.startsWith('5') && digits.length === 9) {
        fullPhone = `+966${digits}`;
      } else if (phone.startsWith('+')) {
        fullPhone = phone;
      } else {
        fullPhone = `+${digits}`;
      }

      // استرجاع storeId من sessionStorage إن لم يُمرر
      let targetStoreId = storeId;
      if (!targetStoreId) {
        try {
          const confirmationData = sessionStorage.getItem('customer-otp-confirmation');
          if (confirmationData) {
            const { storeId: savedStoreId } = JSON.parse(confirmationData);
            targetStoreId = savedStoreId;
          }
        } catch {
          // Ignore JSON parsing errors for confirmation data
        }
      }

      // التحقق من OTP عبر Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('verify-customer-otp', {
        body: { phone: fullPhone, otp: otpCode, storeId: targetStoreId }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }
      if (!data?.success) {
        console.error('Verification failed:', data?.error);
        throw new Error(data?.error || 'رمز التحقق غير صحيح');
      }

      // تنظيف بيانات التحقق
      sessionStorage.removeItem('customer-otp-confirmation');

      // حفظ الـ session في Supabase Auth
      if (data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        });
      }

      // إنشاء/تمديد جلسة المتجر
      if (targetStoreId) {
        try {
          const phoneDigits = fullPhone.replace(/\D/g, '');
          const sanitizedPhone = phoneDigits.startsWith('966')
            ? phoneDigits
            : phoneDigits.startsWith('0')
              ? `966${phoneDigits.replace(/^0+/, '')}`
              : (phoneDigits.startsWith('5') && phoneDigits.length === 9)
                ? `966${phoneDigits}`
                : phoneDigits;

          const now = new Date();
          const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

          const { data: existing } = await supabasePublic
            .from('customer_otp_sessions')
            .select('id')
            .eq('store_id', targetStoreId)
            .eq('phone', sanitizedPhone)
            .eq('verified', true)
            .order('verified_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          let sessionId: string | null = null;
          if (existing?.id) {
            await supabasePublic
              .from('customer_otp_sessions')
              .update({ expires_at: expiresAt, updated_at: now.toISOString() })
              .eq('id', existing.id);
            sessionId = existing.id as string;
          } else {
            const { data: inserted, error: insertError } = await supabasePublic
              .from('customer_otp_sessions')
              .insert({
                store_id: targetStoreId,
                phone: sanitizedPhone,
                otp_code: 'verified',
                verified: true,
                verified_at: now.toISOString(),
                expires_at: expiresAt,
              })
              .select('id')
              .single();
            if (insertError) throw insertError;
            sessionId = inserted.id as string;
          }

          try {
            localStorage.setItem(
              `customer_session_${targetStoreId}`,
              JSON.stringify({
                sessionId,
                phone: sanitizedPhone,
                storeId: targetStoreId,
                verifiedAt: now.toISOString(),
                expiresAt,
              })
            );
          } catch {
            // Ignore localStorage errors in private browsing mode
          }
        } catch (sessionError) {
          console.warn('Failed to create/extend store session:', sessionError);
        }
      }

      // جلب أو إنشاء بيانات العميل
      // إذا حصلنا على بيانات العميل من edge function، استخدمها
      if (data?.customer && data.customer.id && data?.customerId) {
        const customer: CustomerProfile = {
          id: data.customerId,  // استخدام customers.id الصحيح
          profile_id: data.customer.id,  // profiles.id
          phone: fullPhone,
          email: data.customer.email,
          full_name: data.customer.full_name || fullPhone,
          loyalty_points: 0,
          total_orders: 0,
          total_spent_sar: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        saveSession(customer);

        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: `مرحباً ${customer.full_name}`,
        });

        return { success: true, customer };
      }

      // Fallback: جلب بيانات العميل من قاعدة البيانات
      const customerData = await fetchCustomerByPhone(fullPhone, targetStoreId);

      if (customerData) {
        saveSession(customerData);

        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: `مرحباً ${customerData.full_name}`,
        });

        return { success: true, customer: customerData };
      }

      console.error('Failed to fetch customer data');
      throw new Error('فشل في جلب بيانات العميل');
    } catch (error: any) {
      console.error('خطأ في التحقق:', error);

      const errorMessage = error.message || 'فشل في التحقق من الكود';

      toast({
        title: "خطأ في التحقق",
        description: errorMessage,
        variant: "destructive",
      });

      return { success: false, error: errorMessage };
    } finally {
      setSession(prev => ({ ...prev, isLoading: false }));
    }
  };

  // تسجيل الدخول بكلمة المرور
  const signInWithPassword = async (phone: string, password: string) => {
    try {
      setSession(prev => ({ ...prev, isLoading: true }));

      // تنظيف رقم الهاتف وتحويله إلى E.164
      const digits = phone.replace(/\D/g, '');
      let fullPhone = '';
      if (digits.startsWith('966')) {
        fullPhone = `+${digits}`;
      } else if (digits.startsWith('0')) {
        fullPhone = `+966${digits.replace(/^0+/, '')}`;
      } else if (digits.startsWith('5') && digits.length === 9) {
        fullPhone = `+966${digits}`;
      } else if (phone.startsWith('+')) {
        fullPhone = phone;
      } else {
        fullPhone = `+${digits}`;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        phone: fullPhone,
        password: password,
      });

      if (error) throw error;

      if (data.session) {
        // جلب بيانات العميل
        const customerData = await fetchCustomerByPhone(fullPhone);

        if (customerData) {
          saveSession(customerData);

          toast({
            title: "تم تسجيل الدخول بنجاح",
            description: `مرحباً ${customerData.full_name}`,
          });

          return { success: true, customer: customerData };
        }
      }

      throw new Error('فشل في استرجاع بيانات الحساب');
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, error: error.message || 'فشل في تسجيل الدخول' };
    } finally {
      setSession(prev => ({ ...prev, isLoading: false }));
    }
  };

  // تعيين كلمة مرور جديدة
  const setPassword = async (phone: string, otpCode: string, password: string) => {
    try {
      // 1. أولاً نتحقق من OTP للحصول على جلسة
      const verifyResult = await verifyOTP(phone, otpCode);

      if (!verifyResult.success) {
        throw new Error(verifyResult.error || 'فشل التحقق من رمز OTP');
      }

      // 2. تحديث كلمة المرور للمستخدم الحالي
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      toast({
        title: "تم تعيين كلمة المرور",
        description: "تم تحديث كلمة المرور بنجاح",
      });

      return { success: true };
    } catch (error: any) {
      console.error('Set password error:', error);
      return { success: false, error: error.message || 'فشل في تعيين كلمة المرور' };
    }
  };

  // Utilities: normalize phone formats to E.164 and national (05...) - reserved for future
  const _getPhoneVariants = (input: string): { e164: string; national: string } => {
    void _getPhoneVariants; // Reserved for future use
    const digits = input.replace(/\D/g, '');
    if (digits.startsWith('966')) {
      const national = '0' + digits.slice(3);
      return { e164: `+${digits}`, national };
    }
    if (digits.startsWith('0')) {
      const core = digits.replace(/^0+/, '');
      return { e164: `+966${core}`, national: `0${core}` };
    }
    if (digits.startsWith('5') && digits.length === 9) {
      return { e164: `+966${digits}`, national: `0${digits}` };
    }
    return { e164: input.startsWith('+') ? input : `+${digits}`, national: input };
  };

  // جلب بيانات العميل بالهاتف
  const fetchCustomerByPhone = async (phone: string, storeId?: string): Promise<CustomerProfile | null> => {
    try {
      // توحيد صيغة رقم الهاتف إلى E.164
      const digits = phone.replace(/\D/g, '');
      const e164 = digits.startsWith('966')
        ? `+${digits}`
        : digits.startsWith('0')
          ? `+966${digits.replace(/^0+/, '')}`
          : (digits.startsWith('5') && digits.length === 9)
            ? `+966${digits}`
            : (phone.startsWith('+') ? phone : `+${digits}`);

      // استخدم الدالة الآمنة في قاعدة البيانات لإنشاء/جلب العميل
      const { data: result, error } = await supabase.rpc('create_customer_account', {
        p_phone: e164,
        p_store_id: storeId ?? undefined,
        p_full_name: undefined,
        p_email: undefined
      });

      if (error) {
        console.error('RPC create_customer_account error:', error);
        throw error;
      }

      const profileId = (result as any)?.profile_id ?? (result as any)?.profileId;
      const customerId = (result as any)?.customer_id ?? (result as any)?.customerId;

      if (!customerId || !profileId) {
        throw new Error('تعذر إنشاء/جلب العميل');
      }

      // نبني كائن العميل بالحد الأدنى من البيانات لتجاوز قيود RLS على الجداول
      const customer: CustomerProfile = {
        id: customerId,
        profile_id: profileId,
        phone: e164,
        email: undefined,
        full_name: e164,
        loyalty_points: 0,
        total_orders: 0,
        total_spent_sar: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      return customer;
    } catch (error: any) {
      console.error('خطأ في جلب بيانات العميل:', error);
      toast({
        title: 'خطأ في جلب البيانات',
        description: error.message || 'حدث خطأ أثناء جلب بيانات العميل',
        variant: 'destructive',
      });
      return null;
    }
  };

  // تسجيل الخروج
  const signOut = () => {
    clearSession();
    toast({
      title: "تم تسجيل الخروج",
      description: "شكراً لاستخدام متجرنا",
    });
  };

  // تحديث الجلسة
  const refreshSession = async () => {
    if (session.customer) {
      const updated = await fetchCustomerByPhone(session.customer.phone);
      if (updated) {
        saveSession(updated);
      }
    }
  };

  // تحديث بيانات العميل
  const updateProfile = async (updates: Partial<CustomerProfile>) => {
    if (!session.customer) return { success: false, error: 'لا يوجد عميل مسجل دخول' };

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: updates.full_name,
          email: updates.email
        })
        .eq('id', session.customer.profile_id);

      if (error) throw error;

      // تحديث الجلسة المحلية
      const updatedCustomer = { ...session.customer, ...updates };
      saveSession(updatedCustomer);

      toast({
        title: "تم تحديث البيانات",
        description: "تم حفظ التغييرات بنجاح",
      });

      return { success: true };
    } catch (error: any) {
      toast({
        title: "خطأ في التحديث",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  // التحقق من الجلسة عند التحميل
  useEffect(() => {
    const initSession = async () => {
      const isValid = await validateStoredSession();
      if (!isValid) {
        setSession(prev => ({ ...prev, isLoading: false }));
      }
    };

    initSession();
  }, []);

  // التحقق من الجلسة المحفوظة
  const checkStoredSession = async () => {
    await validateStoredSession();
  };

  const contextValue: CustomerAuthContextType = {
    customer: session.customer,
    isAuthenticated: session.isAuthenticated,
    isLoading: session.isLoading,
    sendOTP,
    verifyOTP,
    signInWithPassword,
    setPassword,
    signOut,
    refreshSession,
    checkStoredSession,
    updateProfile
  };

  return (
    <CustomerAuthContext.Provider value={contextValue}>
      {children}
    </CustomerAuthContext.Provider>
  );
};

const useCustomerAuthContext = () => {
  const context = useContext(CustomerAuthContext);
  if (context === undefined) {
    // Return default context instead of throwing error
    return {
      customer: null,
      isAuthenticated: false,
      isLoading: false,
      sendOTP: async () => ({ success: false, error: 'CustomerAuthProvider not available' }),
      verifyOTP: async () => ({ success: false, error: 'CustomerAuthProvider not available' }),
      signInWithPassword: async () => ({ success: false, error: 'CustomerAuthProvider not available' }),
      setPassword: async () => ({ success: false, error: 'CustomerAuthProvider not available' }),
      signOut: () => { },
      refreshSession: async () => { },
      checkStoredSession: async () => { },
      updateProfile: async () => ({ success: false, error: 'CustomerAuthProvider not available' }),
    } as CustomerAuthContextType;
  }
  return context;
};

export { CustomerAuthProvider, useCustomerAuthContext };