// إعدادات النطاق المخصص لأتلانتس تيش
export const ATLANTIS_DOMAIN = 'https://atlantiss.tech';

// الحصول على رابط القاعدة المخصص
export const getBaseUrl = (): string => {
  // Always use the current origin in the running environment
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // Fallback only when window is unavailable (SSR/build-time)
  return ATLANTIS_DOMAIN;
};

// إنشاء رابط متجر مع معرف الإحالة
export const createStoreUrl = (storeSlug: string, referralId?: string): string => {
  // استخدام الرابط الحالي (Lovable في التطوير، الدومين المخصص في الإنتاج)
  const baseUrl = getBaseUrl();
  const storeUrl = `${baseUrl}/${storeSlug}`;
  
  if (referralId) {
    return `${storeUrl}?ref=${referralId}`;
  }
  
  return storeUrl;
};

// إنشاء رابط منتج مع معرف الإحالة
export const createProductUrl = (productId: string, referralId?: string): string => {
  const baseUrl = getBaseUrl();
  const productUrl = `${baseUrl}/products/${productId}`;
  
  if (referralId) {
    return `${productUrl}?ref=${referralId}`;
  }
  
  return productUrl;
};

// التحقق من كون النطاق الحالي هو نطاق أتلانتس تيش
export const isAtlantisDomain = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const hostname = window.location.hostname;
  return hostname === 'atlantiss.tech' || hostname === 'www.atlantiss.tech';
};
