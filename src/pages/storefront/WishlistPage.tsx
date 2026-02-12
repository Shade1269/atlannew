import { useMemo } from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Heart, ShoppingBag, Trash2, ChevronLeft, Package } from "lucide-react";
import { supabasePublic } from "@/integrations/supabase/publicClient";
import { useLuxuryTheme } from "@/components/storefront/luxury/LuxuryThemeContext";
import { useWishlist } from "@/features/storefront/hooks/useWishlist";
import { useStoreProductModal } from "@/contexts/StoreProductModalContext";
import { useIsolatedStoreCart } from "@/hooks/useIsolatedStoreCart";
import { UnifiedButton } from "@/components/design-system";
import { toast } from "sonner";

interface Store {
  id: string;
  store_name: string;
  store_slug: string;
}

interface Product {
  id: string;
  title: string;
  price_sar: number;
  final_price: number;
  image_urls: string[];
  category: string;
}

const formatCurrency = (v: number) =>
  `${Math.max(0, Math.round(v)).toLocaleString("en-US")} ر.س`;

const WishlistPage = () => {
  const navigate = useNavigate();
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const { store } = useOutletContext<{ store: Store }>();
  const { colors, isDark } = useLuxuryTheme();
  const { openProductModal } = useStoreProductModal();
  const cart = useIsolatedStoreCart(store?.id);

  const {
    wishlist,
    isInWishlist,
    toggleWishlist,
    clearWishlist,
    getWishlistProductIds,
    wishlistCount,
  } = useWishlist(store?.id || "");

  const wishlistIds = useMemo(() => getWishlistProductIds(), [getWishlistProductIds]);

  // جلب بيانات المنتجات المفضلة
  const { data: wishlistProducts = [], isLoading } = useQuery({
    queryKey: ["wishlist-products", store?.id, wishlistIds],
    queryFn: async () => {
      if (!wishlistIds.length) return [];
      const { data, error } = await supabasePublic
        .from("affiliate_products")
        .select(
          "product_id, custom_price_sar, products(id, title, price_sar, image_urls, category)"
        )
        .eq("affiliate_store_id", store.id)
        .eq("is_visible", true)
        .in("product_id", wishlistIds);
      if (error) throw error;
      return (data || [])
        .filter((i: any) => i.products?.id)
        .map((i: any) => ({
          id: i.products.id,
          title: i.products.title,
          price_sar: i.products.price_sar,
          final_price: i.custom_price_sar || i.products.price_sar,
          image_urls: i.products.image_urls || [],
          category: i.products.category || "",
        })) as Product[];
    },
    enabled: !!store?.id && wishlistIds.length > 0,
  });

  // جلب منتجات مشابهة (من نفس التصنيفات أو عشوائية)
  const categories = useMemo(
    () => [...new Set(wishlistProducts.map((p) => p.category).filter(Boolean))],
    [wishlistProducts]
  );

  const { data: similarProducts = [] } = useQuery({
    queryKey: ["similar-products", store?.id, categories, wishlistIds],
    queryFn: async () => {
      let query = supabasePublic
        .from("affiliate_products")
        .select(
          "product_id, custom_price_sar, products(id, title, price_sar, image_urls, category)"
        )
        .eq("affiliate_store_id", store.id)
        .eq("is_visible", true)
        .limit(8);

      const { data, error } = await query;
      if (error) throw error;
      return (data || [])
        .filter(
          (i: any) => i.products?.id && !wishlistIds.includes(i.products.id)
        )
        .map((i: any) => ({
          id: i.products.id,
          title: i.products.title,
          price_sar: i.products.price_sar,
          final_price: i.custom_price_sar || i.products.price_sar,
          image_urls: i.products.image_urls || [],
          category: i.products.category || "",
        }))
        .slice(0, 6) as Product[];
    },
    enabled: !!store?.id,
  });

  const handleAddToCart = (product: Product) => {
    cart.addItem({
      id: product.id,
      title: product.title,
      price: product.final_price,
      image: product.image_urls?.[0] || "",
      quantity: 1,
    });
    toast.success("تمت الإضافة للسلة");
  };

  return (
    <div
      className="min-h-screen"
      dir="rtl"
      style={{
        background: isDark ? colors.background : "#ffffff",
        color: colors.text,
      }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-40 border-b backdrop-blur-md"
        style={{
          background: isDark ? `${colors.background}ee` : "rgba(255,255,255,0.95)",
          borderColor: `${colors.border}`,
        }}
      >
        <div className="container mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/${storeSlug}`)}
                className="rounded-xl p-2 transition-all hover:scale-105"
                style={{
                  background: isDark ? colors.backgroundCard : "#f3f4f6",
                }}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div>
                <h1
                  className="text-2xl font-bold flex items-center gap-2"
                  style={{ color: colors.text }}
                >
                  <Heart
                    className="h-6 w-6"
                    style={{ color: colors.primary, fill: colors.primary }}
                  />
                  المفضلة
                </h1>
                <p className="text-sm" style={{ color: colors.textMuted }}>
                  {wishlistCount} منتج
                </p>
              </div>
            </div>
            {wishlistCount > 0 && (
              <button
                onClick={clearWishlist}
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm transition-colors hover:opacity-80"
                style={{
                  background: isDark ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.08)",
                  color: "#EF4444",
                }}
              >
                <Trash2 className="h-4 w-4" />
                مسح الكل
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-6">
        {/* Empty State */}
        {!isLoading && wishlistCount === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div
              className="mb-6 rounded-full p-6"
              style={{ background: `${colors.primary}15` }}
            >
              <Heart className="h-16 w-16" style={{ color: colors.primary }} />
            </div>
            <h2 className="mb-2 text-2xl font-bold">قائمة المفضلة فارغة</h2>
            <p className="mb-6 text-lg" style={{ color: colors.textMuted }}>
              أضف منتجات إلى المفضلة لتجدها بسهولة لاحقاً
            </p>
            <UnifiedButton
              onClick={() => navigate(`/${storeSlug}/shop`)}
              className="!rounded-xl !px-8"
            >
              <ShoppingBag className="h-5 w-5 ml-2" />
              تصفح المنتجات
            </UnifiedButton>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl"
                style={{ background: colors.backgroundCard, height: 320 }}
              />
            ))}
          </div>
        )}

        {/* Wishlist Products Grid */}
        {wishlistProducts.length > 0 && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {wishlistProducts.map((product) => (
              <div
                key={product.id}
                className="group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                style={{
                  background: colors.backgroundCard,
                  borderColor: colors.border,
                }}
              >
                {/* Image */}
                <div
                  className="relative aspect-square cursor-pointer overflow-hidden"
                  onClick={() => openProductModal(product.id)}
                >
                  {product.image_urls?.[0] ? (
                    <img
                      src={product.image_urls[0]}
                      alt={product.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div
                      className="flex h-full items-center justify-center"
                      style={{ background: colors.backgroundTertiary }}
                    >
                      <Package className="h-12 w-12" style={{ color: colors.textMuted }} />
                    </div>
                  )}
                  {/* Remove from wishlist */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(product.id);
                    }}
                    className="absolute top-2 left-2 rounded-full p-2 backdrop-blur-sm transition-all hover:scale-110"
                    style={{
                      background: "rgba(239,68,68,0.85)",
                      color: "#fff",
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Info */}
                <div className="p-3">
                  <h3
                    className="mb-1 line-clamp-2 text-sm font-semibold cursor-pointer"
                    onClick={() => openProductModal(product.id)}
                  >
                    {product.title}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span
                      className="text-lg font-bold"
                      style={{ color: colors.primary }}
                    >
                      {formatCurrency(product.final_price)}
                    </span>
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="rounded-lg p-2 transition-all hover:scale-110"
                      style={{
                        background: colors.primary,
                        color: colors.primaryText,
                      }}
                    >
                      <ShoppingBag className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Similar Products Section */}
        {similarProducts.length > 0 && (
          <div className="mt-12">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold">منتجات قد تعجبك</h2>
              <button
                onClick={() => navigate(`/${storeSlug}/shop`)}
                className="text-sm font-medium transition-colors hover:opacity-80"
                style={{ color: colors.primary }}
              >
                عرض الكل
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {similarProducts.map((product) => (
                <div
                  key={product.id}
                  className="group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                  style={{
                    background: colors.backgroundCard,
                    borderColor: colors.border,
                  }}
                >
                  <div
                    className="relative aspect-square cursor-pointer overflow-hidden"
                    onClick={() => openProductModal(product.id)}
                  >
                    {product.image_urls?.[0] ? (
                      <img
                        src={product.image_urls[0]}
                        alt={product.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div
                        className="flex h-full items-center justify-center"
                        style={{ background: colors.backgroundTertiary }}
                      >
                        <Package className="h-12 w-12" style={{ color: colors.textMuted }} />
                      </div>
                    )}
                    {/* Wishlist button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(product.id);
                      }}
                      className="absolute top-2 left-2 rounded-full p-2 backdrop-blur-sm transition-all hover:scale-110"
                      style={{
                        background: isInWishlist(product.id)
                          ? colors.primary
                          : "rgba(0,0,0,0.4)",
                        color: "#fff",
                      }}
                    >
                      <Heart
                        className="h-4 w-4"
                        fill={isInWishlist(product.id) ? "#fff" : "none"}
                      />
                    </button>
                  </div>
                  <div className="p-3">
                    <h3
                      className="mb-1 line-clamp-2 text-sm font-semibold cursor-pointer"
                      onClick={() => openProductModal(product.id)}
                    >
                      {product.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span
                        className="text-lg font-bold"
                        style={{ color: colors.primary }}
                      >
                        {formatCurrency(product.final_price)}
                      </span>
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="rounded-lg p-2 transition-all hover:scale-110"
                        style={{
                          background: colors.primary,
                          color: colors.primaryText,
                        }}
                      >
                        <ShoppingBag className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="h-20" />
      </div>
    </div>
  );
};

export default WishlistPage;
