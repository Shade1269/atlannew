import { useFastAuth } from './useFastAuth';
import { useCustomerAuthContext } from '@/contexts/CustomerAuthContext';

/**
 * Unified Auth Hook - يوحد جميع أنظمة المصادقة في واجهة واحدة
 * يحل محل SupabaseAuthContext مع الحفاظ على نفس الـ API
 */
export const useUnifiedAuth = () => {
  const {
    user,
    session, 
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    isAuthenticated,
    isActive,
    hasRole,
    refreshProfile,
    clearCache,
    // Role flags
    isAdmin,
    isAffiliate,
    isCustomer,
    isModerator,
    // Permission flags
    canModerate,
    canManageUsers,
    canCreateShops,
    canViewAnalytics
  } = useFastAuth();

  return {
    // Core auth state (SupabaseAuthContext compatible)
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    
    // Enhanced features
    profile,
    updateProfile,
    isAuthenticated,
    isActive,
    hasRole,
    refreshProfile,
    clearCache,
    
    // Role checks
    isAdmin,
    isAffiliate,
    isCustomer,
    isModerator,
    
    // Permissions
    canModerate,
    canManageUsers,
    canCreateShops,
    canViewAnalytics
  };
};

/**
 * Customer Auth Hook - نظام منفصل لمصادقة العملاء في المتاجر
 * منفصل تماماً عن نظام المسوقين والإداريين
 */
export const useCustomerAuth = () => {
  return useCustomerAuthContext();
};

// Legacy compatibility - exports the same interface as SupabaseAuthContext
export const useSupabaseAuth = useUnifiedAuth;