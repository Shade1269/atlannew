import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabasePublic } from '@/integrations/supabase/publicClient';
import { toast } from 'sonner';
import { useCustomerAuth } from '@/hooks/useCustomerAuth';

interface UseStorefrontOtpProps {
  storeSlug: string;
  storeId?: string;
}

export const useStorefrontOtp = ({ storeSlug, storeId }: UseStorefrontOtpProps) => {
  const [step, setStep] = useState<'phone' | 'otp' | 'orders'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);

  const { sendOTP, verifyOTP, isLoading } = useCustomerAuth();

  useEffect(() => {
    if (!storeId) return;

    const sessionKey = `customer_session_${storeId}`;
    const sessionData = localStorage.getItem(sessionKey);
    if (sessionData) {
      const session = JSON.parse(sessionData);
      if (new Date(session.expiresAt) > new Date()) {
        setSessionId(session.sessionId);
        setPhone(session.phone || '');
        setStep('orders');
      }
    }
  }, [storeId]);

  const handleSendOtp = async () => {
    if (!storeId) {
      toast.error('خطأ في إرسال الرمز', {
        description: 'لم يتم العثور على معرف المتجر',
      });
      return;
    }

    const result = await sendOTP(phone, storeId);
    if (result.success) {
      setStep('otp');
    }
  };

  const handleVerifyOtp = async () => {
    if (!storeId) {
      toast.error('رمز التحقق غير صحيح', {
        description: 'لم يتم العثور على معرف المتجر',
      });
      return;
    }

    const result = await verifyOTP(phone, otp, storeId, 'customer');
    if (result.success) {
      // استخراج sessionId من localStorage
      const sessionKey = `customer_session_${storeId}`;
      const sessionData = localStorage.getItem(sessionKey);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        setSessionId(session.sessionId);
        if (storeSlug) {
          localStorage.setItem(`sf:${storeSlug}:cust_sess`, session.sessionId);
        }
        setStep('orders');
      }
    }
  };

  // Fetch orders
  const { data: orders, isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ['customer-orders', storeId, sessionId],
    queryFn: async () => {
      if (!storeId || !sessionId) return [];

      const { data, error } = await supabasePublic.rpc('get_store_orders_for_session', {
        p_store_id: storeId,
        p_session_id: sessionId
      });

      if (error) throw error;
      return data;
    },
    enabled: !!storeId && !!sessionId && step === 'orders'
  });

  const handleLogout = () => {
    if (storeId) {
      const sessionKey = `customer_session_${storeId}`;
      localStorage.removeItem(sessionKey);
    }
    if (storeSlug) {
      localStorage.removeItem(`sf:${storeSlug}:cust_sess`);
    }
    setSessionId(null);
    setPhone('');
    setOtp('');
    setStep('phone');
  };

  return {
    step,
    phone,
    setPhone,
    otp,
    setOtp,
    sessionId,
    orders,
    ordersLoading,
    sendOtpMutation: {
      mutate: handleSendOtp,
      isPending: isLoading,
    },
    verifyOtpMutation: {
      mutate: handleVerifyOtp,
      isPending: isLoading,
    },
    refetchOrders,
    handleLogout
  };
};