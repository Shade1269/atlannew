import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const COMPARE_KEY = 'store_compare';
const MAX_COMPARE_ITEMS = 4;

export const useCompare = (storeId: string) => {
  const [compareList, setCompareList] = useState<string[]>([]);
  const { user } = useAuth();

  const getStorageKey = useCallback(() => `${COMPARE_KEY}_${storeId}`, [storeId]);

  // تحميل قائمة المقارنة من قاعدة البيانات أو localStorage
  useEffect(() => {
    if (!storeId) return;
    
    const loadCompareList = async () => {
      if (user) {
        // المستخدم مسجل - جلب من قاعدة البيانات
        try {
          const { data, error } = await supabase
            .from('user_compare_lists')
            .select('product_id')
            .eq('user_id', user.id)
            .eq('store_id', storeId);

          if (error) throw error;

          const productIds = (data || []).map(item => item.product_id);
          setCompareList(productIds);
        } catch (error) {
          console.error('Error loading compare list from database:', error);
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
          setCompareList(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Error loading compare list from localStorage:', error);
      }
    };

    loadCompareList();
  }, [storeId, user, getStorageKey]);

  // حفظ قائمة المقارنة في localStorage للزوار
  const saveToLocalStorage = useCallback((items: string[]) => {
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(items));
    } catch (error) {
      console.error('Error saving compare list to localStorage:', error);
    }
  }, [getStorageKey]);

  const isInCompare = useCallback((productId: string) => {
    return compareList.includes(productId);
  }, [compareList]);

  const toggleCompare = useCallback(async (productId: string) => {
    try {
      if (isInCompare(productId)) {
        // إزالة من المقارنة
        if (user) {
          const { error } = await supabase
            .from('user_compare_lists')
            .delete()
            .eq('user_id', user.id)
            .eq('store_id', storeId)
            .eq('product_id', productId);

          if (error) throw error;
        }
        
        const updated = compareList.filter(id => id !== productId);
        setCompareList(updated);
        if (!user) saveToLocalStorage(updated);
        toast.success('تم إزالة المنتج من المقارنة');
      } else {
        // التحقق من الحد الأقصى
        if (compareList.length >= MAX_COMPARE_ITEMS) {
          toast.error(`يمكنك مقارنة ${MAX_COMPARE_ITEMS} منتجات كحد أقصى`);
          return;
        }
        
        // إضافة للمقارنة
        if (user) {
          const { error } = await supabase
            .from('user_compare_lists')
            .insert({
              user_id: user.id,
              store_id: storeId,
              product_id: productId
            });

          if (error) throw error;
        }
        
        const updated = [...compareList, productId];
        setCompareList(updated);
        if (!user) saveToLocalStorage(updated);
        toast.success('تم إضافة المنتج للمقارنة');
      }
    } catch (error) {
      console.error('Error toggling compare:', error);
      toast.error('حدث خطأ أثناء تحديث المقارنة');
    }
  }, [compareList, isInCompare, user, storeId, saveToLocalStorage]);

  const addToCompare = useCallback((productId: string) => {
    if (!isInCompare(productId) && compareList.length < MAX_COMPARE_ITEMS) {
      toggleCompare(productId);
    }
  }, [isInCompare, compareList.length, toggleCompare]);

  const removeFromCompare = useCallback(async (productId: string) => {
    if (isInCompare(productId)) {
      try {
        if (user) {
          const { error } = await supabase
            .from('user_compare_lists')
            .delete()
            .eq('user_id', user.id)
            .eq('store_id', storeId)
            .eq('product_id', productId);

          if (error) throw error;
        }
        
        const updated = compareList.filter(id => id !== productId);
        setCompareList(updated);
        if (!user) saveToLocalStorage(updated);
      } catch (error) {
        console.error('Error removing from compare:', error);
      }
    }
  }, [isInCompare, compareList, user, storeId, saveToLocalStorage]);

  const clearCompare = useCallback(async () => {
    try {
      if (user) {
        const { error } = await supabase
          .from('user_compare_lists')
          .delete()
          .eq('user_id', user.id)
          .eq('store_id', storeId);

        if (error) throw error;
      }
      
      setCompareList([]);
      if (!user) saveToLocalStorage([]);
      toast.success('تم مسح قائمة المقارنة');
    } catch (error) {
      console.error('Error clearing compare list:', error);
      toast.error('حدث خطأ أثناء مسح المقارنة');
    }
  }, [user, storeId, saveToLocalStorage]);

  return {
    compareList,
    compareCount: compareList.length,
    isInCompare,
    toggleCompare,
    addToCompare,
    removeFromCompare,
    clearCompare,
    maxItems: MAX_COMPARE_ITEMS,
    canAddMore: compareList.length < MAX_COMPARE_ITEMS
  };
};
