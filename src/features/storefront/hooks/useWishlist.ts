import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const WISHLIST_KEY = 'store_wishlist';

interface WishlistItem {
  productId: string;
  addedAt: number;
}

export const useWishlist = (storeId: string) => {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const getStorageKey = useCallback(() => `${WISHLIST_KEY}_${storeId}`, [storeId]);

  // تحميل المفضلة من قاعدة البيانات أو localStorage
  useEffect(() => {
    if (!storeId) return;
    
    const loadWishlist = async () => {
      if (user) {
        // المستخدم مسجل - جلب من قاعدة البيانات
        try {
          const { data, error } = await supabase
            .from('user_wishlists')
            .select('product_id, added_at')
            .eq('user_id', user.id)
            .eq('store_id', storeId);

          if (error) throw error;

          const items: WishlistItem[] = (data || []).map(item => ({
            productId: item.product_id,
            addedAt: new Date(item.added_at).getTime()
          }));
          setWishlist(items);
        } catch (error) {
          console.error('Error loading wishlist from database:', error);
          // fallback to localStorage
          loadFromLocalStorage();
        }
      } else {
        loadFromLocalStorage();
      }
    };

    const loadFromLocalStorage = () => {
      try {
        const stored = localStorage.getItem(getStorageKey());
        if (stored) {
          setWishlist(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Error loading wishlist from localStorage:', error);
      }
    };

    loadWishlist();
  }, [storeId, user, getStorageKey]);

  // حفظ المفضلة في localStorage للزوار
  const saveToLocalStorage = useCallback((items: WishlistItem[]) => {
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(items));
    } catch (error) {
      console.error('Error saving wishlist to localStorage:', error);
    }
  }, [getStorageKey]);

  const isInWishlist = useCallback((productId: string) => {
    return wishlist.some(item => item.productId === productId);
  }, [wishlist]);

  const toggleWishlist = useCallback(async (productId: string) => {
    setLoading(true);
    
    try {
      if (isInWishlist(productId)) {
        // إزالة من المفضلة
        if (user) {
          const { error } = await supabase
            .from('user_wishlists')
            .delete()
            .eq('user_id', user.id)
            .eq('store_id', storeId)
            .eq('product_id', productId);

          if (error) throw error;
        }
        
        const updated = wishlist.filter(item => item.productId !== productId);
        setWishlist(updated);
        if (!user) saveToLocalStorage(updated);
        toast.success('تم إزالة المنتج من المفضلة');
      } else {
        // إضافة للمفضلة
        if (user) {
          const { error } = await supabase
            .from('user_wishlists')
            .insert({
              user_id: user.id,
              store_id: storeId,
              product_id: productId
            });

          if (error) throw error;
        }
        
        const newItem: WishlistItem = {
          productId,
          addedAt: Date.now()
        };
        const updated = [...wishlist, newItem];
        setWishlist(updated);
        if (!user) saveToLocalStorage(updated);
        toast.success('تم إضافة المنتج للمفضلة');
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      toast.error('حدث خطأ أثناء تحديث المفضلة');
    } finally {
      setLoading(false);
    }
  }, [wishlist, isInWishlist, user, storeId, saveToLocalStorage]);

  const addToWishlist = useCallback((productId: string) => {
    if (!isInWishlist(productId)) {
      toggleWishlist(productId);
    }
  }, [isInWishlist, toggleWishlist]);

  const removeFromWishlist = useCallback((productId: string) => {
    if (isInWishlist(productId)) {
      toggleWishlist(productId);
    }
  }, [isInWishlist, toggleWishlist]);

  const clearWishlist = useCallback(async () => {
    try {
      if (user) {
        const { error } = await supabase
          .from('user_wishlists')
          .delete()
          .eq('user_id', user.id)
          .eq('store_id', storeId);

        if (error) throw error;
      }
      
      setWishlist([]);
      if (!user) saveToLocalStorage([]);
      toast.success('تم مسح قائمة المفضلة');
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      toast.error('حدث خطأ أثناء مسح المفضلة');
    }
  }, [user, storeId, saveToLocalStorage]);

  const getWishlistProductIds = useCallback(() => {
    return wishlist.map(item => item.productId);
  }, [wishlist]);

  return {
    wishlist,
    loading,
    isInWishlist,
    toggleWishlist,
    addToWishlist,
    removeFromWishlist,
    clearWishlist,
    getWishlistProductIds,
    wishlistCount: wishlist.length
  };
};
