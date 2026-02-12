import { useState, useEffect } from 'react';
import { supabasePublic } from '@/integrations/supabase/publicClient';
import { toast } from 'sonner';

export interface CartItem {
  id: string;
  product_id: string;
  product_title: string;
  quantity: number;
  unit_price_sar: number;
  total_price_sar: number;
  product_image_url?: string;
  selected_variants?: Record<string, string>;
}

interface StoreCart {
  id: string;
  items: CartItem[];
  total: number;
}

export const useIsolatedStoreCart = (storeId: string, storeSlug?: string) => {
  const [cart, setCart] = useState<StoreCart | null>(null);
  const [loading, setLoading] = useState(true);

  // Get or create session-based cart using unified key format
  const getSessionId = () => {
    // Use storeSlug if available, otherwise fallback to storeId
    const key = storeSlug ? `ea_session_${storeSlug}` : `store_session_${storeId}`;
    let sessionId = localStorage.getItem(key);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem(key, sessionId);
    }
    return sessionId;
  };

  const loadCart = async () => {
    try {
      const sessionId = getSessionId();

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('storefront:last-session-id', sessionId);
        } catch (error) {
          console.warn('Unable to persist storefront session id', error);
        }
      }

      // Get or create cart
      let { data: cartData } = await supabasePublic
        .from('shopping_carts')
        .select('id')
        .eq('session_id', sessionId)
        .eq('affiliate_store_id', storeId)
        .maybeSingle();

      if (!cartData) {
        const { data: newCart } = await supabasePublic
          .from('shopping_carts')
          .insert({
            session_id: sessionId,
            affiliate_store_id: storeId,
            user_id: null
          })
          .select('id')
          .single();
        cartData = newCart;
      }

      if (cartData) {
        // Load cart items
        const { data: items } = await supabasePublic
          .from('cart_items')
          .select(`
            id,
            product_id,
            quantity,
            unit_price_sar,
            total_price_sar,
            selected_variants
          `)
          .eq('cart_id', cartData.id);

        // ✅ تحسين: جلب جميع المنتجات في استعلام واحد بدلاً من استعلام لكل منتج
        const productIds = (items || []).map(item => item.product_id);

        // جلب جميع المنتجات مرة واحدة
        const { data: productsData } = productIds.length > 0
          ? await supabasePublic
            .from('products')
            .select('id, title, image_urls')
            .in('id', productIds)
          : { data: [] };

        // إنشاء map للمنتجات للوصول السريع
        const productsMap = new Map(
          (productsData || []).map(p => [p.id, p])
        );

        // بناء عناصر السلة باستخدام البيانات المجمعة
        const cartItems: CartItem[] = (items || []).map((item) => {
          const productData = productsMap.get(item.product_id);
          return {
            id: item.id,
            product_id: item.product_id,
            product_title: productData?.title || 'منتج',
            quantity: item.quantity,
            unit_price_sar: item.unit_price_sar,
            total_price_sar: item.total_price_sar ?? (item.quantity * item.unit_price_sar),
            product_image_url: productData?.image_urls?.[0],
            selected_variants: (item.selected_variants as Record<string, string>) || {}
          };
        });

        const total = cartItems.reduce((sum, item) => sum + (item.total_price_sar ?? 0), 0);

        setCart({
          id: cartData.id,
          items: cartItems,
          total
        });

        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('storefront:last-store-id', storeId);
            localStorage.setItem('storefront:last-cart-id', cartData.id);
          } catch (error) {
            console.warn('Unable to persist storefront cart context', error);
          }
        }
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      toast.error('خطأ في تحميل السلة');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (
    productId: string,
    quantity: number = 1,
    unitPrice?: number,
    productTitle?: string,
    selectedVariants?: Record<string, string>
  ) => {
    try {
      if (!cart) return;

      // استخدام السعر الممرر أو محاولة الحصول عليه من قاعدة البيانات
      let finalPrice = unitPrice;
      let finalTitle = productTitle || 'منتج';
      void finalTitle; // Used below in database insert

      if (!finalPrice) {
        const { data: product } = await supabasePublic
          .from('products')
          .select('title, price_sar')
          .eq('id', productId)
          .single();

        if (!product) {
          toast.error('المنتج غير موجود');
          return;
        }

        finalPrice = product.price_sar;
        finalTitle = product.title;
      }

      // Check if product already in cart
      const existingItem = cart.items.find(item => item.product_id === productId);

      if (existingItem) {
        // Update quantity
        const { error } = await supabasePublic
          .from('cart_items')
          .update({
            quantity: existingItem.quantity + quantity,
            unit_price_sar: finalPrice,
            selected_variants: selectedVariants || {}
          })
          .eq('id', existingItem.id);

        if (error) throw error;
      } else {
        // Add new item
        const { error } = await supabasePublic
          .from('cart_items')
          .insert({
            cart_id: cart.id,
            product_id: productId,
            quantity,
            unit_price_sar: finalPrice,
            selected_variants: selectedVariants || {}
          });

        if (error) throw error;
      }

      await loadCart(); // Reload cart
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error; // رمي الخطأ للسماح للمكون باستخدامه
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      const { error } = await supabasePublic
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      toast.success('تم حذف المنتج من السلة');
      await loadCart();
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('خطأ في حذف المنتج');
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    try {
      if (newQuantity <= 0) {
        await removeFromCart(itemId);
        return;
      }

      const item = cart?.items.find(i => i.id === itemId);
      if (!item) return;

      const { error } = await supabasePublic
        .from('cart_items')
        .update({
          quantity: newQuantity,
          unit_price_sar: item.unit_price_sar
        })
        .eq('id', itemId);

      if (error) throw error;

      await loadCart();
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('خطأ في تحديث الكمية');
    }
  };

  const clearCart = async () => {
    try {
      if (!cart) return;

      const { error } = await supabasePublic
        .from('cart_items')
        .delete()
        .eq('cart_id', cart.id);

      if (error) throw error;

      toast.success('تم إفراغ السلة');
      await loadCart();
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('خطأ في إفراغ السلة');
    }
  };

  useEffect(() => {
    if (storeId) {
      loadCart();
    }
  }, [storeId]);

  return {
    cart,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    refetch: loadCart
  };
};
