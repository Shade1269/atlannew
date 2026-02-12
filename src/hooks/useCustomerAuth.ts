import { useCustomerAuthContext } from '@/contexts/CustomerAuthContext';

export const useCustomerAuth = () => {
  const {
    customer,
    isAuthenticated,
    isLoading,
    sendOTP,
    verifyOTP,
    signOut,
    refreshSession,
    checkStoredSession,
    updateProfile,
  } = useCustomerAuthContext();

  return {
    customer,
    isAuthenticated,
    isLoading,
    sendOTP,
    verifyOTP,
    signOut,
    refreshSession,
    checkStoredSession,
    updateCustomerProfile: updateProfile,
  };
};
