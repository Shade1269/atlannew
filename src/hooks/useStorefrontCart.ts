import { useState, useEffect } from "react";
import { supabasePublic } from "@/integrations/supabase/publicClient";
import { useToast } from "@/hooks/use-toast";

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price_sar: number;
  total_price_sar: number | null;
  products: {
    title: string;
    image_urls?: string[] | null;
  };
}

export const useStorefrontCart = (cartId?: string) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchCartItems = async () => {
    if (!cartId) return;

    try {
      setLoading(true);
      const { data, error } = await supabasePublic
        .from("cart_items")
        .select(
          `
          id,
          product_id,
          quantity,
          unit_price_sar,
          total_price_sar,
          products (
            title,
            image_urls
          )
        `,
        )
        .eq("cart_id", cartId);

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error fetching cart items:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCartItems();
  }, [cartId]);

  const addToCart = async (
    productId: string,
    quantity: number = 1,
    unitPrice: number,
  ) => {
    if (!cartId) return false;

    try {
      // التحقق من وجود المنتج في السلة
      const { data: existingItem } = await supabasePublic
        .from("cart_items")
        .select("id, quantity")
        .eq("cart_id", cartId)
        .eq("product_id", productId)
        .maybeSingle();

      if (existingItem) {
        // تحديث الكمية
        const newQuantity = existingItem.quantity + quantity;
        const { error } = await supabasePublic
          .from("cart_items")
          .update({
            quantity: newQuantity,
            total_price_sar: newQuantity * unitPrice,
          })
          .eq("id", existingItem.id);

        if (error) throw error;
      } else {
        // إضافة منتج جديد
        const { error } = await supabasePublic.from("cart_items").insert({
          cart_id: cartId,
          product_id: productId,
          quantity,
          unit_price_sar: unitPrice,
          total_price_sar: quantity * unitPrice,
        });

        if (error) throw error;
      }

      await fetchCartItems();

      toast({
        title: "تمت الإضافة للسلة",
        description: "تم إضافة المنتج بنجاح",
      });

      return true;
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({
        title: "خطأ",
        description: "فشل في إضافة المنتج للسلة",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      return removeItem(itemId);
    }

    try {
      const item = items.find((i) => i.id === itemId);
      if (!item) return false;

      const { error } = await supabasePublic
        .from("cart_items")
        .update({
          quantity: newQuantity,
          total_price_sar: newQuantity * item.unit_price_sar,
        })
        .eq("id", itemId);

      if (error) throw error;
      await fetchCartItems();
      return true;
    } catch (error) {
      console.error("Error updating quantity:", error);
      return false;
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const { error } = await supabasePublic
        .from("cart_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;
      await fetchCartItems();

      toast({
        title: "تم الحذف",
        description: "تم حذف المنتج من السلة",
      });

      return true;
    } catch (error) {
      console.error("Error removing item:", error);
      return false;
    }
  };

  const clearCart = async () => {
    if (!cartId) return;

    try {
      const { error } = await supabasePublic
        .from("cart_items")
        .delete()
        .eq("cart_id", cartId);

      if (error) throw error;
      setItems([]);

      toast({
        title: "تم إفراغ السلة",
        description: "تم حذف جميع المنتجات من السلة",
      });
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  };

  const getTotal = () => {
    return items.reduce((sum, item) => sum + (item.total_price_sar ?? 0), 0);
  };

  const getItemsCount = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  return {
    items,
    loading,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart: fetchCartItems,
    total: getTotal(),
    itemsCount: getItemsCount(),
  };
};
