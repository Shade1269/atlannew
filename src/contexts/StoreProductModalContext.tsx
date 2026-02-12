import React, { createContext, useCallback, useContext, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabasePublic } from "@/integrations/supabase/publicClient";
import { useIsolatedStoreCart } from "@/hooks/useIsolatedStoreCart";
import { useWishlist } from "@/features/storefront";
import { useToast } from "@/hooks/use-toast";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { ModernProductModal } from "@/components/storefront/modern/ModernProductModal";

export interface ModalProduct {
  id: string;
  title: string;
  description?: string;
  price_sar: number;
  image_urls?: string[];
  stock: number;
  category?: string;
  variants?: any[];
  final_price?: number;
  average_rating?: number;
  total_reviews?: number;
  discount_percentage?: number;
}

interface StoreProductModalContextValue {
  openProductModal: (productId: string) => void;
  closeProductModal: () => void;
}

const StoreProductModalContext = createContext<StoreProductModalContextValue | null>(null);

export const useStoreProductModal = () => {
  const ctx = useContext(StoreProductModalContext);
  if (!ctx) return { openProductModal: () => {}, closeProductModal: () => {} };
  return ctx;
};

interface StoreProductModalProviderProps {
  storeId: string;
  storeSlug: string;
  children: React.ReactNode;
}

export const StoreProductModalProvider: React.FC<StoreProductModalProviderProps> = ({
  storeId,
  storeSlug,
  children,
}) => {
  const [productId, setProductId] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [variantError, setVariantError] = useState<string | null>(null);
  const { toast } = useToast();
  const { customer } = useCustomerAuth();
  const { addToCart: addToIsolatedCart } = useIsolatedStoreCart(storeId, storeSlug);
  const { getWishlistProductIds, toggleWishlist: toggleWishlistFromHook } = useWishlist(storeId);
  const wishlist = getWishlistProductIds();

  const { data: product = null, isLoading } = useQuery({
    queryKey: ["store-product-modal", storeId, productId],
    queryFn: async (): Promise<ModalProduct | null> => {
      if (!storeId || !productId) return null;
      const { data: ap, error: apError } = await supabasePublic
        .from("affiliate_products")
        .select("product_id, custom_price_sar, products(id, title, description, price_sar, image_urls, category)")
        .eq("affiliate_store_id", storeId)
        .eq("is_visible", true)
        .eq("product_id", productId)
        .maybeSingle();
      if (apError || !ap?.products) return null;
      const p = ap.products as any;
      const finalPrice = ap.custom_price_sar ?? p.price_sar;

      let ratingStats: { average_rating?: number; total_reviews?: number }[] = [];
      try {
        const res = await (supabasePublic as any).rpc("get_product_rating_stats", { p_product_id: p.id });
        if (res?.data?.[0]) ratingStats = res.data;
      } catch {
        // ignore
      }

      let variants: any[] = [];
      const { data: advVariants } = await supabasePublic
        .from("product_variants_advanced")
        .select("id, product_id, color, size, quantity, price_override, is_active, sku, color_code")
        .eq("product_id", p.id)
        .eq("is_active", true);
      if (advVariants?.length) {
        variants = advVariants.map((v: any) => ({
          id: v.id,
          product_id: v.product_id,
          size: v.size,
          color: v.color,
          color_code: v.color_code,
          available_stock: v.quantity ?? 0,
          current_stock: v.quantity ?? 0,
          is_active: v.is_active,
        }));
      } else {
        const { data: leg } = await supabasePublic.from("product_variants").select("*").eq("product_id", p.id);
        if (leg?.length) variants = leg;
      }

      const stock =
        variants.length > 0
          ? variants.reduce((sum, v) => sum + (Number((v as any).quantity ?? (v as any).current_stock) || 0), 0)
          : Number(p.stock) || 0;

      return {
        id: p.id,
        title: p.title,
        description: p.description,
        price_sar: p.price_sar,
        image_urls: p.image_urls ?? [],
        stock,
        category: p.category,
        variants,
        final_price: finalPrice,
        average_rating: ratingStats[0]?.average_rating ?? 0,
        total_reviews: ratingStats[0]?.total_reviews ?? 0,
        discount_percentage: 0,
      };
    },
    enabled: !!storeId && !!productId,
  });

  const openProductModal = useCallback((id: string) => {
    setProductId(id);
    setSelectedVariant(null);
    setVariantError(null);
  }, []);

  const closeProductModal = useCallback(() => {
    setProductId(null);
    setSelectedVariant(null);
    setVariantError(null);
  }, []);

  const addToCart = useCallback(async () => {
    if (!product) return;
    if (product.variants && product.variants.length > 0 && !selectedVariant) {
      const msg = "يرجى اختيار المقاس أو اللون أولاً";
      setVariantError(msg);
      toast({ title: "خطأ", description: msg, variant: "destructive" });
      return;
    }
    try {
      const variants =
        selectedVariant ?
          { variant_id: selectedVariant.id, size: selectedVariant.size ?? "", color: selectedVariant.color ?? "" }
        : undefined;
      await addToIsolatedCart(
        product.id,
        1,
        product.final_price ?? product.price_sar,
        product.title,
        variants
      );
      toast({ title: "✅ تم إضافة المنتج للسلة", description: `تم إضافة ${product.title} إلى سلة التسوق` });
      closeProductModal();
    } catch {
      toast({ title: "خطأ", description: "فشل إضافة المنتج للسلة", variant: "destructive" });
    }
  }, [product, selectedVariant, addToIsolatedCart, toast, closeProductModal]);

  const value: StoreProductModalContextValue = { openProductModal, closeProductModal };

  return (
    <StoreProductModalContext.Provider value={value}>
      {children}
      {productId && (
        <ModernProductModal
          product={isLoading ? null : product}
          open={!!productId}
          onClose={closeProductModal}
          onAddToCart={addToCart}
          onToggleWishlist={toggleWishlistFromHook}
          isInWishlist={product ? wishlist.includes(product.id) : false}
          selectedVariant={selectedVariant}
          onVariantChange={(variantId) => {
            const v = product?.variants?.find((x: any) => x.id === variantId);
            setSelectedVariant(v ?? null);
            if (v) setVariantError(null);
          }}
          variantError={variantError}
          storeId={storeId}
          customerId={customer?.id}
        />
      )}
    </StoreProductModalContext.Provider>
  );
};
