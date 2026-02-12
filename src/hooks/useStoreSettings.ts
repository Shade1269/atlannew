import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

export interface StoreCategoryBannerProduct {
  id: string;
  title: string;
  image_url?: string | null;
  category?: string | null;
}

export interface StoreCategory {
  id: string;
  name: string;
  isActive: boolean;
  productCount: number;
  bannerProducts?: StoreCategoryBannerProduct[];
}

export interface Announcement {
  text: string;
  icon?: string;
  color?: string;
}

export interface StoreSettings {
  id?: string;
  store_id: string;
  hero_image_url?: string | null;
  hero_title?: string | null;
  hero_subtitle?: string | null;
  hero_description?: string | null;
  hero_cta_text?: string | null;
  hero_cta_color?: string | null;
  /** بانرات الهيرو المتعددة للسلايدر: مصفوفة [{ id, image_url, title, subtitle, cta_text, cta_link? }] */
  hero_slides?: Json | null;
  category_display_style?: string | null;
  featured_categories?: Json;
  store_analytics?: Json;
  // الحقول الجديدة
  announcements?: Json | null;
  countdown_enabled?: boolean | null;
  countdown_end_date?: string | null;
  countdown_title?: string | null;
  countdown_subtitle?: string | null;
  promo_banner_enabled?: boolean | null;
  promo_banner_title?: string | null;
  promo_banner_subtitle?: string | null;
  promo_banner_discount?: string | null;
  promo_banner_image_url?: string | null;
  promo_banner_link?: string | null;
  default_hero_enabled?: boolean | null;
  social_links?: Json | null;
  whatsapp_number?: string | null;
  store_email?: string | null;
  ai_recommendations_enabled?: boolean | null;
  // حقول الفوتر
  footer_phone?: string | null;
  footer_address?: string | null;
  footer_description?: string | null;
  footer_links?: Json | null;
  // شريطا الإعلانات العلويان
  top_announcement_bars?: Json | null;
  header_config?: Json | null;
  font_family?: string | null;
  flash_deals?: Json | null;
}

export const useStoreSettings = (storeId: string) => {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  // منع التحميل المتكرر
  const fetchedRef = useRef(false);
  const currentStoreIdRef = useRef(storeId);

  const fetchSettings = useCallback(async () => {
    if (!storeId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('affiliate_store_settings')
        .select('*')
        .eq('store_id', storeId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setSettings(data);
    } catch (error: any) {
      console.error('Error fetching store settings:', error);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  const updateSettings = async (updates: Partial<StoreSettings>) => {
    if (!storeId) return false;

    try {
      const payload: Partial<StoreSettings> & { store_id: string } = {
        store_id: storeId,
        ...(settings?.id ? { id: settings.id } : {}),
        ...updates
      };

      const { data, error } = await supabase
        .from('affiliate_store_settings')
        .upsert(payload)
        .select()
        .single();

      if (error) throw error;

      setSettings(data);
      toast({
        title: "تم الحفظ",
        description: "تم حفظ الإعدادات بنجاح"
      });
      return true;
    } catch (error: any) {
      console.error('Error updating store settings:', error);
      toast({
        title: "خطأ",
        description: "فشل في حفظ الإعدادات",
        variant: "destructive"
      });
      return false;
    }
  };

  const compressImage = async (file: File, maxWidth = 800, quality = 0.7): Promise<File> => {
    return new Promise((resolve) => {
      // إذا كان نوع الملف ليس صورة، نرجع الملف كما هو
      if (!file.type.startsWith('image/')) {
        resolve(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // تصغير الصورة إذا كانت أكبر من الحد الأقصى
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          // إذا كانت الصورة طويلة جداً
          const maxHeight = 1200;
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  // إنشاء اسم ملف نظيف
                  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                  const compressedFile = new File([blob], cleanName, {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                  });
                  console.log(`Compressed image: ${file.size} -> ${compressedFile.size} bytes`);
                  resolve(compressedFile);
                } else {
                  resolve(file);
                }
              },
              'image/jpeg',
              quality
            );
          } else {
            resolve(file);
          }
        };
        img.onerror = () => resolve(file);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  };

  const uploadImage = async (file: File, path: string) => {
    try {
      // التحقق من حجم الملف الأصلي
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast({
          title: "الملف كبير جداً",
          description: "الرجاء اختيار صورة أصغر من 10MB",
          variant: "destructive"
        });
        return { success: false, error: 'File too large' };
      }

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      // ضغط الصورة قبل الرفع
      toast({
        title: "جاري رفع الصورة...",
        description: "يرجى الانتظار"
      });
      
      const compressedFile = await compressImage(file);
      
      // تنظيف اسم الملف
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${user.user.id}/${path}/${Date.now()}_${cleanFileName}`;
      
      console.log('Uploading to:', fileName, 'Size:', compressedFile.size);
      
      const { data, error } = await supabase.storage
        .from('store-assets')
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Storage upload error:', error);
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('store-assets')
        .getPublicUrl(data.path);

      toast({
        title: "تم الرفع بنجاح",
        description: "تم رفع الصورة بنجاح"
      });

      return { success: true, url: publicUrl };
    } catch (error: any) {
      console.error('Error uploading image:', error);
      
      let errorMessage = "فشل في رفع الصورة";
      if (error.message?.includes('Load failed')) {
        errorMessage = "فشل الاتصال. حاول مرة أخرى أو استخدم صورة أصغر";
      } else if (error.message?.includes('exceeded')) {
        errorMessage = "حجم الصورة كبير جداً";
      }
      
      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive"
      });
      return { success: false, error: error.message };
    }
  };

  useEffect(() => {
    // تحميل مرة واحدة فقط لكل storeId
    if (storeId && (storeId !== currentStoreIdRef.current || !fetchedRef.current)) {
      currentStoreIdRef.current = storeId;
      fetchedRef.current = true;
      fetchSettings();
    } else if (!storeId) {
      setLoading(false);
    }
  }, [storeId, fetchSettings]);

  const parsedFeaturedCategories = useMemo(() => parseFeaturedCategories(settings?.featured_categories), [settings?.featured_categories]);

  return {
    settings,
    loading,
    updateSettings,
    uploadImage,
    refetch: fetchSettings,
    featuredCategories: parsedFeaturedCategories,
    // Compatibility aliases for other components
    data: settings,
    isLoading: loading
  };
};

const normalizeBannerProduct = (product: any): StoreCategoryBannerProduct | null => {
  if (!product || typeof product !== 'object') return null;

  const id = typeof product.id === 'string' ? product.id : undefined;
  const title = typeof product.title === 'string' ? product.title : undefined;

  if (!id || !title) return null;

  return {
    id,
    title,
    image_url: typeof product.image_url === 'string' ? product.image_url : null,
    category: typeof product.category === 'string' ? product.category : null
  };
};

const normalizeFeaturedCategory = (category: any): StoreCategory | null => {
  if (!category) return null;

  const id = typeof category.id === 'string' ? category.id : typeof category.name === 'string' ? category.name : undefined;
  const name = typeof category.name === 'string' ? category.name : undefined;

  if (!id || !name) return null;

  const rawBannerProducts = Array.isArray(category.bannerProducts)
    ? category.bannerProducts
    : Array.isArray(category.selectedProducts)
      ? category.selectedProducts
      : undefined;

  const bannerProducts = rawBannerProducts
    ?.map((productItem: Record<string, unknown>) => normalizeBannerProduct(productItem))
    .filter((productResult: StoreCategoryBannerProduct | null): productResult is StoreCategoryBannerProduct => Boolean(productResult));

  return {
    id,
    name,
    isActive: typeof category.isActive === 'boolean' ? category.isActive : true,
    productCount: typeof category.productCount === 'number' ? category.productCount : 0,
    bannerProducts
  };
};

export const parseFeaturedCategories = (
  data: StoreSettings['featured_categories']
): StoreCategory[] => {
  if (!data) return [];

  let raw: unknown = data;

  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch (error) {
      console.error('Failed to parse featured categories JSON string', error);
      return [];
    }
  }

  if (Array.isArray(raw)) {
    return raw.map(normalizeFeaturedCategory).filter((category): category is StoreCategory => Boolean(category));
  }

  if (raw && typeof raw === 'object' && 'categories' in raw) {
    const categories = (raw as { categories?: unknown }).categories;
    if (Array.isArray(categories)) {
      return categories
        .map(normalizeFeaturedCategory)
        .filter((category): category is StoreCategory => Boolean(category));
    }
  }

  return [];
};

// Helper functions for payment and shipping methods
export const getEnabledPaymentMethods = (settings: StoreSettings | null) => {
  if (!settings?.store_analytics) return [];
  const analytics = typeof settings.store_analytics === 'string' 
    ? JSON.parse(settings.store_analytics) 
    : settings.store_analytics;
  return analytics?.paymentMethods || [];
};

export const getEnabledShippingMethods = (settings: StoreSettings | null) => {
  if (!settings?.store_analytics) return [];
  const analytics = typeof settings.store_analytics === 'string' 
    ? JSON.parse(settings.store_analytics) 
    : settings.store_analytics;
  return analytics?.shippingMethods || [];
};