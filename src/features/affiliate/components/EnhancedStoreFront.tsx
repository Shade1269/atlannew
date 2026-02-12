import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StoreThemeProvider } from "@/components/store/ThemeProvider";
import { UnifiedBadge } from "@/components/design-system";
import { UnifiedButton } from "@/components/design-system";
// Sheet components removed - not used
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { StorefrontSession } from "@/utils/storefrontSession";
import {
  Store,
  ArrowRight,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  parseFeaturedCategories,
  type StoreCategory,
  type StoreSettings,
} from "@/hooks/useStoreSettings";
import { useIsolatedStoreCart } from "@/hooks/useIsolatedStoreCart";
import { CustomerAuthModal } from "@/components/storefront/CustomerAuthModal";
// Tabs components removed - not used
import { DraggableChatButton } from "@/components/customer-service/DraggableChatButton";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
// LuxuryCardContent removed - not used
// Removed unused imports: EnhancedBannerSlider, EnhancedProductGrid
import { useStoreProductModal } from "@/contexts/StoreProductModalContext";
import { ModernShoppingCart } from "@/components/storefront/modern/ModernShoppingCart";
import { HomeFooter } from "@/components/home/HomeFooter";
import { ModernCustomerOrders } from "@/components/storefront/modern/ModernCustomerOrders";
import { ModernInvoice } from "@/components/storefront/modern/ModernInvoice";
// Removed unused import: LanguageDarkModeToggle
import {
  CompareProducts,
  AdvancedSearch,
  CustomerLoyaltyCard,
  AbandonedCartRecovery,
  useWishlist,
  useCompare,
} from "@/features/storefront";
import { AnimatePresence, motion } from "framer-motion";
import {
  EcommerceHeader,
  CategoryShowcase,
  FeaturedProducts,
  PromoBanner,
  EcommerceFooter,
  AnnouncementBar,
  TwoTopAnnouncementBars,
  MegaMenu,
  ScrollProgress,
  HeroSlider,
  CountdownTimer,
  AIRecommendations,
  useUserBehaviorTracker,
  useLuxuryTheme,
} from "@/components/storefront/luxury";

interface Product {
  id: string;
  title: string;
  description: string;
  price_sar: number;
  image_urls: string[];
  stock: number;
  category: string;
  variants?: ProductVariant[];
  commission_amount?: number;
  final_price?: number;
  average_rating?: number;
  total_reviews?: number;
  discount_percentage?: number;
}

interface ProductVariant {
  id: string;
  product_id: string;
  size?: string | null;
  color?: string | null;
  available_stock: number;
  current_stock: number;
  selling_price?: number;
  variant_name?: string;
  is_active: boolean;
}

interface CategoryBannerProductDisplay {
  id: string;
  title: string;
  imageUrl: string | null;
  price: number | null;
  rating: number | null;
  product: Product | null;
  category: string | null;
}

interface CategoryBannerDisplay {
  category: StoreCategory;
  products: CategoryBannerProductDisplay[];
}

interface StoreBanner {
  id: string;
  store_id: string;
  title: string;
  subtitle?: string | null;
  image_url: string;
  link_url?: string | null;
  link_type: "product" | "category" | "external" | "none";
  position: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AffiliateStore {
  id: string;
  store_name: string;
  bio: string;
  store_slug: string;
  logo_url?: string;
  theme: string;
  total_sales: number;
  total_orders: number;
  profile_id: string;
  is_active: boolean;
}

// CartItem interface moved to ModernShoppingCart

interface EnhancedStoreFrontProps {
  storeSlug?: string;
}

const EnhancedStoreFront = ({
  storeSlug: propStoreSlug,
}: EnhancedStoreFrontProps = {}) => {
  const { storeSlug: paramStoreSlug } = useParams<{ storeSlug: string }>();
  const storeSlug = propStoreSlug || paramStoreSlug;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { customer, isAuthenticated } = useCustomerAuth();
  const { language, direction } = useLanguage();

  // States
  const [showCart, setShowCart] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [_showOrdersModal, setShowOrdersModal] = useState(false); // showOrdersModal
  const [pendingCheckout, setPendingCheckout] = useState(false);
  const { openProductModal } = useStoreProductModal();
  const [_productQuantities, setProductQuantities] = useState<{
    [productId: string]: number;
  }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [sortBy, setSortBy] = useState("newest");
  const [_showFilters, _setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showOrders, setShowOrders] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showCompare, setShowCompare] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showLoyalty, setShowLoyalty] = useState(false);
  
  // الثيم من التخطيط (IsolatedStoreLayout) — لا نكرر الـ provider هنا لتجنب التجمّد
  const { colors, isDark } = useLuxuryTheme();

  // AI Behavior Tracker
  const { behavior, trackProductView, trackAddToCart: trackAIAddToCart, trackAddToWishlist } = useUserBehaviorTracker();

  // Mark unused setters as used (for lint)
  void setShowOrdersModal;
  void setProductQuantities;

  // جلب بيانات المتجر
  const {
    data: affiliateStore,
    isLoading: storeLoading,
    error: storeError,
  } = useQuery({
    queryKey: ["affiliate-store", storeSlug],
    queryFn: async () => {
      if (!storeSlug) return null;

      const { data, error } = await supabase
        .from("affiliate_stores")
        .select("*")
        .eq("store_slug", storeSlug)
        .eq("is_active", true)
        .maybeSingle();

      if (error) {
        // معالجة الخطأ 406 وأخطاء الصلاحيات بشكل خاص
        if (error.code === 'PGRST116' || 
            error.message?.includes('406') ||
            (error as any).status === 406 ||
            error.message?.includes('permission') ||
            error.message?.includes('row-level security')) {
          console.warn('خطأ في الصلاحيات أو RLS policies:', error);
          // إرجاع null بدلاً من رمي الخطأ
          return null;
        }
        throw error;
      }
      return data as AffiliateStore | null;
    },
    enabled: !!storeSlug,
    staleTime: 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: (failureCount, error: any) => {
      // عدم إعادة المحاولة في حالة الخطأ 406
      if (error?.code === 'PGRST116' || 
          error?.message?.includes('406') ||
          error?.status === 406) {
        return false;
      }
      return failureCount < 1;
    },
  });

  // New hooks for storefront features - use store ID (UUID) not slug
  // Must be called after affiliateStore is loaded
  const { getWishlistProductIds, toggleWishlist: toggleWishlistFromHook } =
    useWishlist(affiliateStore?.id || "");
  const { compareList, toggleCompare } = useCompare(affiliateStore?.id || "");

  // Wishlist as array of productIds for compatibility
  const wishlist = getWishlistProductIds();

  // استخدام نظام السلة المحسّن مع تمرير storeSlug
  const {
    cart: isolatedCart,
    addToCart: addToIsolatedCart,
    updateQuantity: updateIsolatedQuantity,
    removeFromCart: removeFromIsolatedCart,
  } = useIsolatedStoreCart(affiliateStore?.id || "", storeSlug);

  // جلب المنتجات
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["affiliate-store-products", affiliateStore?.id],
    queryFn: async () => {
      if (!affiliateStore?.id) return [];

      const { data: affiliateProducts, error } = await supabase
        .from("affiliate_products")
        .select(
          `
          product_id,
          commission_rate,
          custom_price_sar,
          is_visible,
          products (
            id,
            title,
            description,
            price_sar,
            image_urls,
            stock,
            category,
            is_active
          )
        `
        )
        .eq("affiliate_store_id", affiliateStore.id)
        .eq("is_visible", true);

      if (error) throw error;

      const productsWithDetails = (await Promise.all(
        affiliateProducts
          .filter((item) => item.products && item.products.is_active)
          .map(async (item) => {
            const productData = item.products!;
            const { data: ratingStats } = await (supabase.rpc as any)(
              "get_product_rating_stats",
              {
                p_product_id: productData.id,
              }
            );

            // ✅ FIX: استخدام custom_price_sar إذا كان موجوداً، وإلا استخدام price_sar الأصلي
            const sellingPrice = item.custom_price_sar || productData.price_sar;
            
            return {
              ...productData,
              commission_amount:
                sellingPrice * ((item.commission_rate || 0) / 100),
              final_price: sellingPrice,
              average_rating: ratingStats?.[0]?.average_rating || 0,
              total_reviews: ratingStats?.[0]?.total_reviews || 0,
              discount_percentage:
                Math.random() > 0.7 ? Math.floor(Math.random() * 30) + 10 : 0,
            };
          })
      )) as Product[];

      if (productsWithDetails.length === 0) return [];

      const productIds = productsWithDetails.map((p) => p.id);

      // Try advanced variants first, fallback to legacy table if needed
      let variantsByProduct: Record<string, ProductVariant[]> = {};

      // Attempt to fetch from product_variants_advanced (preferred)
      const { data: advVariants, error: advError } = await supabase
        .from("product_variants_advanced")
        .select(
          "id, product_id, color, size, quantity, price_override, is_active, sku"
        )
        .in("product_id", productIds)
        .eq("is_active", true);

      if (!advError && (advVariants?.length || 0) > 0) {
        variantsByProduct = (advVariants || []).reduce((acc, v: any) => {
          const mapped: ProductVariant = {
            id: v.id,
            product_id: v.product_id,
            size: v.size,
            color: v.color,
            available_stock: v.quantity ?? 0,
            current_stock: v.quantity ?? 0,
            // selling_price can be derived in UI if needed using price_override
            selling_price: undefined,
            variant_name:
              [v.color, v.size].filter(Boolean).join(" / ") ||
              v.sku ||
              undefined,
            is_active: v.is_active,
          };
          if (!acc[v.product_id]) acc[v.product_id] = [] as ProductVariant[];
          acc[v.product_id].push(mapped);
          return acc;
        }, {} as Record<string, ProductVariant[]>);
      } else {
        // Fallback: legacy variants table
        const { data: legacyVariants, error: legacyError } = await supabase
          .from("product_variants")
          .select("*")
          .in("product_id", productIds);

        if (legacyError) {
          console.error("Error fetching variants:", advError || legacyError);
          return productsWithDetails;
        }

        variantsByProduct = (legacyVariants || []).reduce(
          (acc: Record<string, ProductVariant[]>, variant: any) => {
            if (!acc[variant.product_id]) {
              acc[variant.product_id] = [];
            }
            acc[variant.product_id].push(variant as ProductVariant);
            return acc;
          },
          {} as Record<string, ProductVariant[]>
        );
      }

      return productsWithDetails.map((product) => ({
        ...product,
        variants: variantsByProduct[product.id] || [],
      }));
    },
    enabled: !!affiliateStore?.id,
    staleTime: 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const { data: storeSettings } = useQuery<StoreSettings | null>({
    queryKey: ["affiliate-store-settings", affiliateStore?.id],
    queryFn: async () => {
      if (!affiliateStore?.id) return null;

      const { data, error } = await supabase
        .from("affiliate_store_settings")
        .select("*")
        .eq("store_id", affiliateStore.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;
      return data as StoreSettings | null;
    },
    enabled: !!affiliateStore?.id,
    staleTime: 60 * 1000, // 1 min - صفحة المتجر ديناميكية
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const { data: storeBanners } = useQuery<StoreBanner[]>({
    queryKey: ["store-banners", affiliateStore?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("store_banners")
        .select("*")
        .eq("store_id", affiliateStore!.id)
        .eq("is_active", true)
        .order("position", { ascending: true });

      if (error) throw error;
      return (data || []) as StoreBanner[];
    },
    enabled: !!affiliateStore?.id,
    staleTime: 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // جلب الأقسام من affiliate_store_categories
  const { data: storeCategories = [] } = useQuery({
    queryKey: ["affiliate-store-categories-frontend", affiliateStore?.id],
    queryFn: async () => {
      if (!affiliateStore?.id) return [];

      const { data, error } = await (supabase as any)
        .from("affiliate_store_categories")
        .select("*")
        .eq("affiliate_store_id", affiliateStore.id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!affiliateStore?.id,
    staleTime: 60 * 1000,
    refetchOnMount: true,
  });

  // جلب المنتجات المرتبطة بالأقسام
  const { data: categoryProductsMap = {} } = useQuery({
    queryKey: ["category-products-map", affiliateStore?.id, storeCategories],
    queryFn: async () => {
      if (!affiliateStore?.id || storeCategories.length === 0) return {};

      const categoryIds = storeCategories.map((cat: any) => cat.id);

      const { data, error } = await (supabase as any)
        .from("affiliate_product_categories")
        .select(
          `
            category_id,
            affiliate_products!inner(
              id,
              product_id,
              affiliate_store_id,
              products (
                id
              )
            )
          `
        )
        .in("category_id", categoryIds);

      if (error) throw error;

      const map: Record<string, string[]> = {};
      (data || []).forEach((item: any) => {
        const categoryId = item.category_id;
        const productId = item.affiliate_products?.products?.id;
        if (categoryId && productId) {
          if (!map[categoryId]) map[categoryId] = [];
          map[categoryId].push(productId);
        }
      });

      return map;
    },
    enabled: !!affiliateStore?.id && storeCategories.length > 0,
    staleTime: 60 * 1000,
    refetchOnMount: true,
  });

  // تطبيق نوع الخط من إعدادات المتجر
  useEffect(() => {
    const font = (storeSettings as any)?.font_family?.trim();
    if (font) {
      document.body.style.fontFamily = `${font}, var(--font-sans), sans-serif`;
      document.documentElement.style.setProperty("--font-sans", font);
    }
    return () => {
      document.body.style.fontFamily = "";
      document.documentElement.style.removeProperty("--font-sans");
    };
  }, [(storeSettings as any)?.font_family]);

  // عند فتح الصفحة أو العودة للمتجر نبدأ من أعلى الصفحة
  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    };
    scrollToTop();
    requestAnimationFrame(scrollToTop);
  }, [storeSlug]);


  // حساب المجموع من السلة المعزولة
  const cartTotal = isolatedCart?.total || 0;
  void cartTotal; // Used in ModernShoppingCart

  // حساب عدد المنتجات في كل قسم من affiliate_store_categories
  const storeCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    storeCategories.forEach((category: any) => {
      const productIds = categoryProductsMap[category.id] || [];
      counts[category.id] = productIds.length;
    });
    return counts;
  }, [storeCategories, categoryProductsMap]);

  // حساب عدد المنتجات في الفئات القديمة (من جدول products)
  const productCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products?.forEach((product) => {
      const categoryName = product.category || "غير مصنف";
      counts[categoryName] = (counts[categoryName] || 0) + 1;
    });
    return counts;
  }, [products]);

  const featuredCategories = useMemo(
    () => parseFeaturedCategories(storeSettings?.featured_categories),
    [storeSettings?.featured_categories]
  );

  /** الأقسام من إعدادات المسوق فقط (featured_categories) — لا افتراضي من الكود */
  const visibleCategories: StoreCategory[] = useMemo(() => {
    if (featuredCategories.length > 0) {
      return featuredCategories
        .map((category) => ({
          ...category,
          productCount:
            category.productCount ??
            storeCategoryCounts[category.id] ??
            productCategoryCounts[category.name] ??
            0,
        }))
        .filter((category) => category.isActive !== false);
    }
    return [];
  }, [
    storeCategoryCounts,
    featuredCategories,
    productCategoryCounts,
  ]);

  void useMemo(() => {
    if (visibleCategories.length > 0) {
      return visibleCategories.map((category) => category.name);
    }
    return Object.keys(productCategoryCounts);
  }, [visibleCategories, productCategoryCounts]);

  const categoryDisplayStyle = storeSettings?.category_display_style || "grid";

  void useMemo<CategoryBannerDisplay[]>(() => {
    if (!featuredCategories || featuredCategories.length === 0) {
      return [];
    }

    const productMap = new Map<string, Product>();
    (products ?? []).forEach((product) => {
      productMap.set(product.id, product);
    });

    return featuredCategories
      .filter(
        (category) =>
          category.isActive !== false &&
          category.bannerProducts &&
          category.bannerProducts.length > 0
      )
      .map((category) => {
        const productsForBanner: CategoryBannerProductDisplay[] = (
          category.bannerProducts ?? []
        )
          .map((bannerProduct) => {
            const fullProduct = productMap.get(bannerProduct.id) ?? null;
            const title = fullProduct?.title || bannerProduct.title;

            if (!title) {
              return null;
            }

            const price = fullProduct
              ? fullProduct.final_price || fullProduct.price_sar
              : null;
            const imageUrl =
              fullProduct?.image_urls?.[0] || bannerProduct.image_url || null;

            return {
              id: bannerProduct.id,
              title,
              imageUrl,
              price,
              rating: fullProduct?.average_rating ?? null,
              product: fullProduct,
              category:
                bannerProduct.category ??
                fullProduct?.category ??
                category.name ??
                null,
            } as CategoryBannerProductDisplay;
          })
          .filter(
            (item): item is CategoryBannerProductDisplay =>
              item !== null && Boolean(item.id)
          );

        return {
          category,
          products: productsForBanner,
        } satisfies CategoryBannerDisplay;
      })
      .filter((banner) => banner.products.length > 0);
  }, [featuredCategories, products]);

  // فلترة وترتيب المنتجات المحسنة
  const filteredProducts =
    products
      ?.filter((product) => {
        const matchesSearch =
          !searchQuery ||
          product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase());

        // التحقق من القسم المحدد
        let matchesCategory = false;
        if (selectedCategory === "all") {
          matchesCategory = true;
        } else {
          // البحث في الأقسام من affiliate_store_categories
          const selectedCategoryObj = storeCategories.find(
            (cat: any) =>
              cat.id === selectedCategory || cat.name === selectedCategory
          ) as any;

          if (selectedCategoryObj && selectedCategoryObj.id) {
            // إذا كان القسم من affiliate_store_categories، تحقق من المنتجات المرتبطة
            const categoryProductIds =
              categoryProductsMap[selectedCategoryObj.id] || [];
            matchesCategory = categoryProductIds.includes(product.id);
          } else {
            // إذا كان القسم من الفئات القديمة (من جدول products)
            matchesCategory = product.category === selectedCategory;
          }
        }

        const price = product.final_price || product.price_sar;
        const matchesPrice = price >= priceRange[0] && price <= priceRange[1];

        return matchesSearch && matchesCategory && matchesPrice;
      })
      ?.sort((a, b) => {
        const priceA = a.final_price || a.price_sar;
        const priceB = b.final_price || b.price_sar;

        switch (sortBy) {
          case "price-low":
            return priceA - priceB;
          case "price-high":
            return priceB - priceA;
          case "name":
            return a.title.localeCompare(b.title);
          case "rating":
            return (b.average_rating || 0) - (a.average_rating || 0);
          case "discount":
            return (b.discount_percentage || 0) - (a.discount_percentage || 0);
          case "newest":
          default:
            return 0; // keep original order (no random shuffle)
        }
      }) || [];

  // وظائف السلة المحسّنة
  const addToCart = async (
    product: Product,
    quantity: number = 1,
    variantInfo?: {
      variant_id: string;
      size?: string | null;
      color?: string | null;
    }
  ) => {
    try {
      // التحقق من المخزون قبل الإضافة
      if (variantInfo) {
        // إذا كان هناك متغير محدد، تحقق من مخزون المتغير
        const variant = product.variants?.find(
          (v) => v.id === variantInfo.variant_id
        );
        if (variant && variant.current_stock < quantity) {
          toast({
            title: "⚠️ نفذت الكمية",
            description: `عذراً، المخزون المتاح: ${variant.current_stock} فقط`,
            variant: "destructive",
          });
          return;
        }
      } else {
        // إذا لم يكن هناك متغير، تحقق من مخزون المنتج الأساسي
        if (product.stock < quantity) {
          toast({
            title: "⚠️ نفذت الكمية",
            description:
              product.stock === 0
                ? "عذراً، هذا المنتج غير متوفر حالياً"
                : `عذراً، المخزون المتاح: ${product.stock} فقط`,
            variant: "destructive",
          });
          return;
        }
      }

      const variants = variantInfo
        ? {
            variant_id: variantInfo.variant_id,
            size: variantInfo.size || "",
            color: variantInfo.color || "",
          }
        : undefined;

      await addToIsolatedCart(
        product.id,
        quantity,
        product.final_price || product.price_sar,
        product.title,
        variants
      );

      toast({
        title: "✅ تم إضافة المنتج للسلة",
        description: `تم إضافة ${product.title} إلى سلة التسوق`,
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({
        title: "خطأ",
        description: "فشل إضافة المنتج للسلة",
        variant: "destructive",
      });
    }
  };

  // معالج إضافة المنتج للسلة مع التحقق من المتغيرات
  const handleProductAddToCart = (product: Product, quantity: number = 1) => {
    // إذا كان المنتج له متغيرات، افتح مودال التفاصيل الموحد
    if (product.variants && product.variants.length > 0) {
      openProductModal(product.id);
      return;
    }

    // إذا لم تكن هناك متغيرات، أضف مباشرة
    addToCart(product, quantity);
  };

  const removeFromCart = async (itemId: string) => {
    try {
      await removeFromIsolatedCart(itemId);
      toast({
        title: "🗑️ تم حذف المنتج",
        description: "تم حذف المنتج من السلة",
      });
    } catch (error) {
      console.error("Error removing from cart:", error);
    }
  };

  const updateCartQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      await removeFromCart(itemId);
      return;
    }

    try {
      await updateIsolatedQuantity(itemId, newQuantity);
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  const toggleWishlist = (productId: string) => {
    toggleWishlistFromHook(productId);
  };

  const handleCheckoutClick = () => {
    // التحقق من تسجيل الدخول والتأكد من صلاحية الجلسة قبل الانتقال للـ checkout
    if (!storeSlug || !affiliateStore?.id) return;

    const storefrontSession = new StorefrontSession(storeSlug);

    // استخدام isSessionValid() للتحقق من isVerified=true و expiresAt صالح
    const isValidSession = storefrontSession.isSessionValid();

    if (!isValidSession) {
      toast({
        title: "يجب تسجيل الدخول أولاً",
        description: "الرجاء تسجيل الدخول برقم جوالك لحفظ الطلب في صفحة طلباتي",
        variant: "default",
      });
      setPendingCheckout(true);
      setShowAuthModal(true);
      return;
    }

    // إذا كانت الجلسة صالحة، انتقل للـ checkout
    navigate(`/${storeSlug}/checkout`);
  };

  void function handleBannerClick(banner: any) {
    if (banner.link_type === "product" && banner.link_url) {
      openProductModal(banner.link_url);
    } else if (banner.link_type === "category" && banner.link_url) {
      setSelectedCategory(banner.link_url);
    } else if (banner.link_type === "external" && banner.link_url) {
      window.open(banner.link_url, "_blank", "noopener,noreferrer");
    }
  };

  void function clearFilters() {
    setSearchQuery("");
    setSelectedCategory("all");
    setPriceRange([0, 1000]);
    setSortBy("newest");
  };

  const handleCategorySelection = (categoryName: string) => {
    setSelectedCategory((current) =>
      current === categoryName ? "all" : categoryName
    );
  };

  void function handleBannerProductClick(
    bannerProduct: CategoryBannerProductDisplay
  ) {
    if (bannerProduct.product) {
      openProductModal(bannerProduct.product.id);
      return;
    }

    toast({
      title: "المنتج غير متاح",
      description:
        "تمت إزالة هذا المنتج من المتجر. يرجى تحديث البنر أو اختيار منتج آخر.",
      variant: "destructive",
    });
  };

  const renderCategoryLayout = () => {
    if (visibleCategories.length === 0) return null;

    const categoriesToRender = visibleCategories.filter(
      (category) => category.productCount >= 0
    );
    if (categoriesToRender.length === 0) return null;

    const renderCategoryCard = (
      category: StoreCategory,
      variant: "grid" | "horizontal" | "circular"
    ) => {
      const isSelected = selectedCategory === category.name;
      const baseClasses =
        "transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60";

      if (variant === "horizontal") {
        return (
          <button
            key={category.id}
            type="button"
            onClick={() => handleCategorySelection(category.name)}
            aria-pressed={isSelected}
            className={`${baseClasses} flex-shrink-0 px-5 py-3 rounded-full border text-sm font-medium whitespace-nowrap ${
              isSelected
                ? "border-primary bg-primary/10 text-primary shadow"
                : "border-border bg-background hover:border-primary/40"
            }`}
          >
            <span>{category.name}</span>
            <UnifiedBadge variant="secondary" size="sm">
              {category.productCount} منتج
            </UnifiedBadge>
          </button>
        );
      }

      if (variant === "circular") {
        return (
          <button
            key={category.id}
            type="button"
            onClick={() => handleCategorySelection(category.name)}
            aria-pressed={isSelected}
            className={`${baseClasses} w-32 h-32 rounded-full border flex flex-col items-center justify-center gap-2 text-center px-4 ${
              isSelected
                ? "border-primary bg-primary/10 text-primary shadow-lg"
                : "border-border bg-background hover:border-primary/40"
            }`}
          >
            <span className="font-semibold text-sm leading-tight line-clamp-2">
              {category.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {category.productCount} منتج
            </span>
          </button>
        );
      }

      return (
        <button
          key={category.id}
          type="button"
          onClick={() => handleCategorySelection(category.name)}
          aria-pressed={isSelected}
          className={`${baseClasses} text-right p-5 rounded-2xl border bg-background/80 hover:-translate-y-1 ${
            isSelected
              ? "border-primary bg-primary/10 shadow-xl"
              : "border-border hover:border-primary/40"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="font-semibold text-lg">{category.name}</p>
              <p className="text-sm text-muted-foreground">
                اكتشف {category.productCount} منتجاً مميزاً في هذه الفئة
              </p>
            </div>
            <UnifiedBadge variant={isSelected ? "default" : "secondary"}>
              {category.productCount}
            </UnifiedBadge>
          </div>
        </button>
      );
    };

    switch (categoryDisplayStyle) {
      case "horizontal":
        return (
          <div className="flex gap-3 overflow-x-auto pb-2">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              aria-pressed={selectedCategory === "all"}
              className={`${
                selectedCategory === "all"
                  ? "border-primary bg-primary/10 text-primary shadow"
                  : "border-border bg-background hover:border-primary/40"
              } flex-shrink-0 px-5 py-3 rounded-full border text-sm font-medium whitespace-nowrap transition-colors`}
            >
              جميع الفئات
            </button>
            {categoriesToRender.map((category) =>
              renderCategoryCard(category, "horizontal")
            )}
          </div>
        );
      case "circular":
        return (
          <div className="flex flex-wrap justify-center gap-6">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              aria-pressed={selectedCategory === "all"}
              className={`w-32 h-32 rounded-full border flex flex-col items-center justify-center gap-2 text-center px-4 transition-colors ${
                selectedCategory === "all"
                  ? "border-primary bg-primary/10 text-primary shadow-lg"
                  : "border-border bg-background hover:border-primary/40"
              }`}
            >
              <span className="font-semibold text-sm">جميع الفئات</span>
              <span className="text-xs text-muted-foreground">
                {products?.length || 0} منتج
              </span>
            </button>
            {categoriesToRender.map((category) =>
              renderCategoryCard(category, "circular")
            )}
          </div>
        );
      default:
        return (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              aria-pressed={selectedCategory === "all"}
              className={`${
                selectedCategory === "all"
                  ? "border-primary bg-primary/10 shadow-xl"
                  : "border-border hover:border-primary/40"
              } text-right p-5 rounded-2xl border bg-background/80 hover:-translate-y-1 transition-all duration-300`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-semibold text-lg">جميع الفئات</p>
                  <p className="text-sm text-muted-foreground">
                    استعرض كل المنتجات المتاحة
                  </p>
                </div>
                <UnifiedBadge
                  variant={selectedCategory === "all" ? "default" : "secondary"}
                >
                  {products?.length || 0}
                </UnifiedBadge>
              </div>
            </button>
            {categoriesToRender.map((category) =>
              renderCategoryCard(category, "grid")
            )}
          </div>
        );
    }
  };

  void renderCategoryLayout(); // Execute category layout

  // Announcement data - جلب من قاعدة البيانات أو استخدام الافتراضي - MUST be before early returns
  /** إعلانات الشريط من إعدادات المسوق فقط — لا افتراضي من الكود */
  const announcements = useMemo(() => {
    if (storeSettings?.announcements && Array.isArray(storeSettings.announcements) && storeSettings.announcements.length > 0) {
      return (storeSettings.announcements as any[]).map((ann, idx) => ({
        id: String(idx + 1),
        text: ann.text || '',
        icon: (['gift', 'truck', 'clock', 'percent'].includes(ann.icon) ? ann.icon : undefined) as 'gift' | 'truck' | 'clock' | 'percent' | undefined,
        highlight: ann.highlight || false
      }));
    }
    return [];
  }, [storeSettings?.announcements]);

  /** الهيرو من إعدادات المسوق فقط — يجب أن يكون قبل أي return حتى لا يتغير عدد الـ hooks */
  const offersPath = storeSlug ? `/${storeSlug}/offers` : "#products-section";

  /** عروض الفلاش المفعّلة من إعدادات المسوق */
  const flashDealsList = useMemo(() => {
    const raw = storeSettings?.flash_deals;
    if (!raw) return [];
    let arr = Array.isArray(raw) ? raw : (typeof raw === "string" ? (() => { try { return JSON.parse(raw); } catch { return []; } })() : []);
    return (arr as any[])
      .filter((d: any) => d && d.enabled !== false)
      .map((d: any) => ({
        id: d.id || crypto.randomUUID?.() || String(Math.random()),
        title: d.title || (language === "ar" ? "عرض محدود" : "Limited offer"),
        end_date_iso: d.end_date_iso || new Date(Date.now() + 86400000).toISOString(),
        product_ids: Array.isArray(d.product_ids) ? d.product_ids : [],
        product_discounts: (d.product_discounts && typeof d.product_discounts === "object") ? d.product_discounts as Record<string, number> : {} as Record<string, number>,
        link: d.link,
      }));
  }, [storeSettings?.flash_deals, language]);

  const heroSlides = useMemo(() => {
    const defaultCta = storeSettings?.hero_cta_text || (language === "ar" ? "تسوق الآن" : "Shop Now");
    const rawSlides = storeSettings?.hero_slides;
    const slidesArray = Array.isArray(rawSlides) ? rawSlides : (typeof rawSlides === "string" ? (() => { try { return JSON.parse(rawSlides); } catch { return []; } })() : []);
    if (slidesArray.length > 0) {
      return slidesArray.map((s: any, i: number) => ({
        id: s.id || `hero-slide-${i}`,
        title: s.title ?? "",
        subtitle: s.subtitle ?? "",
        image: s.image_url ?? s.image ?? "",
        ctaText: s.cta_text ?? defaultCta,
        ctaLink: (s.cta_link && String(s.cta_link).trim()) ? s.cta_link : offersPath
      })).filter((s: any) => s.image || s.title);
    }
    if (storeBanners && storeBanners.length > 0) {
      return storeBanners.map((banner) => ({
        id: banner.id,
        title: banner.title,
        subtitle: banner.subtitle || '',
        image: banner.image_url,
        ctaText: defaultCta,
        ctaLink: offersPath
      }));
    }
    if (storeSettings?.hero_image_url || storeSettings?.hero_title) {
      return [{
        id: "hero-settings",
        title: storeSettings.hero_title || '',
        subtitle: storeSettings.hero_subtitle || '',
        image: storeSettings.hero_image_url || '',
        ctaText: defaultCta,
        ctaLink: offersPath
      }];
    }
    return [];
  }, [storeBanners, storeSettings?.hero_slides, storeSettings?.hero_image_url, storeSettings?.hero_title, storeSettings?.hero_subtitle, storeSettings?.hero_cta_text, language, offersPath]);

  // Loading states
  if (storeLoading || productsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto"></div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">جاري تحميل المتجر</h3>
            <p className="text-muted-foreground">الرجاء الانتظار...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (storeError) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg-muted">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Store className="h-12 w-12 text-destructive" />
          </div>
          <h3 className="text-2xl font-bold mb-3 text-foreground">
            خطأ في تحميل المتجر
          </h3>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            حدث خطأ أثناء محاولة تحميل المتجر. الرجاء المحاولة مرة أخرى.
          </p>
          <UnifiedButton onClick={() => navigate("/")} variant="primary">
            <ArrowRight className="h-4 w-4 mr-2" />
            العودة للصفحة الرئيسية
          </UnifiedButton>
        </div>
      </div>
    );
  }

  // تطبيق الثيم إذا كان المتجر محمل
  if (!affiliateStore) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg-muted">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Store className="h-12 w-12 text-destructive" />
          </div>
          <h3 className="text-2xl font-bold mb-3 text-foreground">
            المتجر غير متاح
          </h3>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            عذراً، لا يمكن الوصول إلى هذا المتجر في الوقت الحالي. إذا كنت مسوقة،
            يمكنك إنشاء متجرك الخاص من هنا.
          </p>
          <div className="space-y-3">
            <UnifiedButton
              onClick={() => navigate("/affiliate/store/setup")}
              variant="primary"
              fullWidth
            >
              <Store className="h-4 w-4 mr-2" />
              إنشاء متجر جديد
            </UnifiedButton>
            <UnifiedButton
              variant="outline"
              onClick={() => navigate("/")}
              fullWidth
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              العودة للصفحة الرئيسية
            </UnifiedButton>
          </div>
        </div>
      </div>
    );
  }

  // Mega Menu categories data from store categories
  const megaMenuCategories = visibleCategories.map((cat, idx) => ({
    id: cat.id || `cat-${idx}`,
    name: cat.name,
    href: "#",
    subcategories: [],
  }));

  // Transform products for AI Recommendations
  const aiProducts = (products || []).map(p => ({
    id: p.id,
    name: p.title,
    price: p.final_price || p.price_sar,
    originalPrice: p.price_sar,
    image: p.image_urls?.[0] || '',
    category: p.category || 'عام',
    rating: p.average_rating || 4.5,
    reviewCount: p.total_reviews || 0,
    tags: [p.category || 'موضة'].filter(Boolean)
  }));

  // جميع المنتجات (بما فيها المضاف منها لأقسام) للعرض تحت البانر
  const allProductsData = filteredProducts.map(p => ({
    id: p.id,
    title: p.title,
    price: p.final_price || p.price_sar,
    originalPrice: p.price_sar !== (p.final_price || p.price_sar) ? p.price_sar : undefined,
    imageUrl: p.image_urls?.[0] || '',
    category: p.category,
    isNew: false,
    isSale: p.discount_percentage ? p.discount_percentage > 0 : false,
    isBestseller: false,
    rating: p.average_rating || 4.5,
    reviewCount: p.total_reviews || 0,
  }));
  // Transform filtered products for FeaturedProducts component (عرض مميز لاحقاً)
  const featuredProductsData = filteredProducts.slice(0, 8).map(p => ({
    id: p.id,
    title: p.title,
    price: p.final_price || p.price_sar,
    originalPrice: p.price_sar !== (p.final_price || p.price_sar) ? p.price_sar : undefined,
    imageUrl: p.image_urls?.[0] || '',
    category: p.category,
    isNew: false,
    isSale: p.discount_percentage ? p.discount_percentage > 0 : false,
    isBestseller: false,
    rating: p.average_rating || 4.5,
    reviewCount: p.total_reviews || 0,
  }));

  return (
    <StoreThemeProvider storeId={affiliateStore.id}>
        <motion.div 
          className="min-h-screen transition-colors duration-500"
          style={{
            backgroundColor: isDark ? 'hsl(20, 14%, 4%)' : '#ffffff',
            color: colors.text,
          }}
          dir={direction}
          initial={false}
          animate={{ 
            backgroundColor: isDark ? 'hsl(20, 14%, 4%)' : '#ffffff',
            color: colors.text,
          }}
          transition={{ duration: 0.5 }}
        >
        {/* Scroll Progress Indicator */}
        <ScrollProgress />

        {/* شريطا الإعلانات العلويان — من إعدادات المسوق إن وُجدت؛ وإلا شريطان افتراضيان فارغان */}
        {(() => {
          const raw = storeSettings
            ? (storeSettings.top_announcement_bars ?? (storeSettings as any).topAnnouncementBars)
            : null;
          let bars: any[] = [];
          if (raw != null) {
            if (typeof raw === "string") {
              try {
                bars = JSON.parse(raw);
              } catch {
                bars = [];
              }
            } else if (Array.isArray(raw)) {
              bars = raw;
            } else if (typeof raw === "object" && raw !== null) {
              bars = Object.values(raw);
            }
          }
          const defaultBars = [
            { visible: true, lines: [{ id: "1", text: "", visible: true }], bg_color: "#dc2626", text_color: "#ffffff" },
            { visible: true, lines: [{ id: "1", text: "", visible: true }], bg_color: "#2563eb", text_color: "#ffffff" },
          ];
          if (!Array.isArray(bars) || bars.length === 0) bars = defaultBars;
          return <TwoTopAnnouncementBars bars={bars} dir={direction} />;
        })()}

        {/* شريط الإعلانات الدوار — من إعدادات المسوق فقط (announcements) */}
        {announcements.length > 0 && (
          <AnnouncementBar
            announcements={announcements}
            autoRotate={true}
            rotateInterval={4000}
          />
        )}

        {/* Header with Mega Menu - إعدادات من header_config */}
        <EcommerceHeader
          storeName={affiliateStore.store_name}
          logoUrl={affiliateStore.logo_url}
          cartCount={isolatedCart?.items?.length || 0}
          wishlistCount={wishlist.length}
          compareCount={compareList.length}
          isAuthenticated={isAuthenticated}
          onCartClick={() => setShowCart(true)}
          onWishlistClick={() => navigate(`/${storeSlug}/wishlist`)}
          onLogoClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          onAdvancedSearchClick={() => setShowAdvancedSearch(true)}
          onCompareClick={() => setShowCompare(true)}
          onLoyaltyClick={() => setShowLoyalty(true)}
          onOrdersClick={() => setShowOrders(true)}
          onAccountClick={() => !isAuthenticated && setShowAuthModal(true)}
          onViewModeChange={(mode) => setViewMode(mode)}
          viewMode={viewMode}
          onSearchChange={(query) => setSearchQuery(query)}
          searchQuery={searchQuery}
          headerConfig={storeSettings?.header_config as any}
        />
        
        {/* القائمة الكبيرة — تظهر فقط عند وجود أقسام من إعدادات المسوق */}
        {megaMenuCategories.length > 0 && (
          <MegaMenu 
            categories={megaMenuCategories}
            onCategoryClick={(href) => {
              const categoryName = megaMenuCategories.find(c => c.href === href)?.name;
              if (categoryName) setSelectedCategory(categoryName);
            }}
            onProductClick={(id) => {
              openProductModal(id);
              const product = products?.find(p => p.id === id);
              if (product) trackProductView(product.id, product.category || 'عام');
            }}
          />
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key="home"
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            style={isDark ? { background: 'hsl(20, 14%, 4%)' } : { background: '#ffffff' }}
          >
            {/* الهيرو — من إعدادات المسوق فقط (بانرات أو إعدادات الهيرو) */}
            {heroSlides.length > 0 && (
              <HeroSlider
                slides={heroSlides}
                autoPlay={true}
                interval={6000}
                parallax={true}
                onCtaClick={(link) => {
                  if (link.startsWith('/')) {
                    navigate(link);
                  } else if (link.startsWith('#')) {
                    document.getElementById(link.slice(1))?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              />
            )}

            {/* منطقة واحدة: جميع المنتجات + الأقسام — خلفية بيضاء (فاتح) أو داكنة (ليلي، بدون أي أبيض) */}
            <div 
              className="w-full transition-colors duration-300" 
              style={{ 
                background: isDark ? 'hsl(20, 14%, 4%)' : '#ffffff',
              }}
            >
            {allProductsData.length > 0 && (
              <div id="all-products-section" className="w-full px-4 py-8 md:py-10">
                <div className="max-w-7xl mx-auto">
                  <FeaturedProducts
                    products={allProductsData}
                    title=""
                    subtitle=""
                    compareList={compareList}
                    wishlistIds={wishlist}
                    showAllHref={storeSlug ? `/${storeSlug}/shop` : undefined}
                    onProductClick={(product) => {
                      openProductModal(product.id);
                      const fullProduct = products?.find(p => p.id === product.id);
                      if (fullProduct) trackProductView(fullProduct.id, fullProduct.category || 'عام');
                    }}
                    onAddToCart={(product) => {
                      const fullProduct = products?.find(p => p.id === product.id);
                      if (fullProduct) {
                        handleProductAddToCart(fullProduct);
                        trackAIAddToCart(fullProduct.id);
                      }
                    }}
                    onAddToWishlist={(product) => {
                      toggleWishlist(product.id);
                      trackAddToWishlist(product.id);
                    }}
                    onAddToCompare={(product) => {
                      toggleCompare(product.id);
                    }}
                  />
                </div>
              </div>
            )}

            {/* العد التنازلي — في النهاري: مربع واضح بخلفية بلون الثيم خفيفة. في الليلي: كالسابق */}
            {storeSettings?.countdown_enabled === true && storeSettings?.countdown_end_date && (
              <div className="w-full px-4 py-4 flex justify-center">
                <div 
                  className="w-full max-w-3xl py-8 px-6 transition-colors duration-500 rounded-2xl"
                  style={isDark 
                    ? { backgroundImage: colors.gradientSection } 
                    : { 
                        background: 'hsl(38, 45%, 92%)',
                        border: `2px solid ${colors.accent || 'hsl(35, 85%, 45%)'}`,
                        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                      }
                  }
                >
                <div className="max-w-7xl mx-auto text-center">
                  {storeSettings.countdown_title && (
                    <h3 className="text-2xl font-bold mb-4" style={{ color: colors.accent }}>
                      {storeSettings.countdown_title}
                    </h3>
                  )}
                  {storeSettings.countdown_subtitle && (
                    <p className="text-lg mb-4 opacity-80">{storeSettings.countdown_subtitle}</p>
                  )}
                  <CountdownTimer 
                    targetDate={new Date(storeSettings.countdown_end_date)}
                    variant="default"
                    onComplete={() => {}}
                    lightDigitBoxes={true}
                  />
                </div>
                </div>
              </div>
            )}

            {/* عرض فلاش: مربع واحد — زر تسوق الآن في الأعلى ثم العنوان والعدّ التنازلي */}
            {flashDealsList.length > 0 && (
              <div className="w-full px-4 py-6 md:py-10">
                <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto">
                  {flashDealsList.map((deal, dealIndex) => {
                    const endDate = deal.end_date_iso ? new Date(deal.end_date_iso) : new Date(Date.now() + 86400000);
                    const validDate = Number.isFinite(endDate.getTime()) ? endDate : new Date(Date.now() + 86400000);
                    return (
                      <motion.section
                        key={deal.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full rounded-2xl border overflow-hidden"
                        style={{ borderColor: colors.border, background: colors.backgroundCard }}
                      >
                        <div className="w-full p-4 md:p-6" dir="rtl">
                          <h3 className="text-lg md:text-xl font-semibold mb-3 text-center" style={{ fontFamily: "'Playfair Display', serif", color: isDark ? '#ffffff' : colors.text }}>
                            {deal.title}
                          </h3>
                          <div className="w-full">
                            <CountdownTimer
                              targetDate={validDate}
                              variant="default"
                              noFrame
                              onComplete={() => {}}
                              topContent={(() => {
                                const customLink = deal.link && String(deal.link).trim();
                                if (customLink?.startsWith("http")) {
                                  return (
                                    <a
                                      href={customLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center justify-center px-8 py-3 rounded-xl font-semibold text-sm whitespace-nowrap transition-all hover:opacity-95"
                                      style={{
                                        background: colors.primaryGradient || colors.primary,
                                        color: colors.primaryText || "#fff",
                                        boxShadow: `0 4px 20px ${colors.shadowPrimary || "rgba(0,0,0,0.15)"}`,
                                      }}
                                    >
                                      {language === "ar" ? "تسوق الآن" : "Shop Now"}
                                    </a>
                                  );
                                }
                                if (customLink?.startsWith("/")) {
                                  return (
                                    <Link
                                      to={customLink}
                                      className="inline-flex items-center justify-center px-8 py-3 rounded-xl font-semibold text-sm whitespace-nowrap transition-all hover:opacity-95"
                                      style={{
                                        background: colors.primaryGradient || colors.primary,
                                        color: colors.primaryText || "#fff",
                                        boxShadow: `0 4px 20px ${colors.shadowPrimary || "rgba(0,0,0,0.15)"}`,
                                      }}
                                    >
                                      {language === "ar" ? "تسوق الآن" : "Shop Now"}
                                    </Link>
                                  );
                                }
                                if (offersPath) {
                                  return (
                                    <Link
                                      to={`${offersPath}#deal-${dealIndex}`}
                                      className="inline-flex items-center justify-center px-8 py-3 rounded-xl font-semibold text-sm whitespace-nowrap transition-all hover:opacity-95"
                                      style={{
                                        background: colors.primaryGradient || colors.primary,
                                        color: colors.primaryText || "#fff",
                                        boxShadow: `0 4px 20px ${colors.shadowPrimary || "rgba(0,0,0,0.15)"}`,
                                      }}
                                    >
                                      {language === "ar" ? "تسوق الآن" : "Shop Now"}
                                    </Link>
                                  );
                                }
                                return undefined;
                              })()}
                            />
                          </div>
                        </div>
                      </motion.section>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Categories */}
            <CategoryShowcase 
              categories={visibleCategories.map((cat) => ({
                id: cat.id,
                name: cat.name,
                imageUrl: (storeCategories.find((sc: any) => sc.id === cat.id)?.image_url) || undefined,
                productCount: cat.productCount || 0,
              }))}
              onCategoryClick={(category) => {
                setSelectedCategory(category.name);
                document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              showAllHref={storeSlug ? `/${storeSlug}/shop` : undefined}
            />

            {/* Featured Products */}
            <div id="products-section">
              <FeaturedProducts
                products={featuredProductsData}
                title={language === "ar" ? "منتجات مميزة" : "Featured Products"}
                subtitle={language === "ar" ? "اكتشفي أحدث التصاميم المختارة بعناية لتناسب ذوقك الراقي" : "Discover our carefully selected designs"}
                compareList={compareList}
                wishlistIds={wishlist}
                showAllHref={storeSlug ? `/${storeSlug}/shop` : undefined}
                onProductClick={(product) => {
                  openProductModal(product.id);
                  const fullProduct = products?.find(p => p.id === product.id);
                  if (fullProduct) trackProductView(fullProduct.id, fullProduct.category || 'عام');
                }}
                onAddToCart={(product) => {
                  const fullProduct = products?.find(p => p.id === product.id);
                  if (fullProduct) {
                    handleProductAddToCart(fullProduct);
                    trackAIAddToCart(fullProduct.id);
                  }
                }}
                onAddToWishlist={(product) => {
                  toggleWishlist(product.id);
                  trackAddToWishlist(product.id);
                }}
                onAddToCompare={(product) => {
                  toggleCompare(product.id);
                }}
              />
            </div>

            </div>

            {/* منطقة العروض + التوصيات — خلفية داكنة في الليلي، بيضاء في النهاري */}
            <div style={isDark ? { background: 'hsl(20, 14%, 4%)' } : { background: '#ffffff' }}>
            {/* بانر العروض (آخر الموسم) — من إعدادات المسوق فقط */}
            {storeSettings?.promo_banner_enabled === true && (storeSettings?.promo_banner_title || storeSettings?.promo_banner_subtitle || storeSettings?.promo_banner_discount) && (
              <PromoBanner
                title={storeSettings?.promo_banner_title || ''}
                subtitle={storeSettings?.promo_banner_subtitle || ''}
                discount={storeSettings?.promo_banner_discount || ''}
                ctaText={storeSettings?.promo_banner_link ? (language === "ar" ? "تسوقي الآن" : "Shop Now") : (language === "ar" ? "تسوقي الآن" : "Shop Now")}
                onCtaClick={() => {
                  const link = (storeSettings as any)?.promo_banner_link?.trim();
                  if (link) {
                    if (link.startsWith("/")) navigate(link);
                    else if (link.startsWith("http")) window.open(link, "_blank");
                  } else if (offersPath) navigate(offersPath);
                }}
              />
            )}

            {/* AI Recommendations — خلفية موحّدة مع الصفحة في النمط الليلي */}
            {aiProducts.length > 0 && (
              <div className="container mx-auto px-4">
                <AIRecommendations
                  products={aiProducts}
                  userBehavior={behavior}
                  onProductClick={(id) => {
                    openProductModal(id);
                    const product = products?.find(p => p.id === id);
                    if (product) trackProductView(product.id, product.category || 'عام');
                  }}
                  onAddToCart={(aiProduct) => {
                    const product = products?.find(p => p.id === aiProduct.id);
                    if (product) {
                      handleProductAddToCart(product);
                      trackAIAddToCart(product.id);
                    }
                  }}
                  onAddToWishlist={(id) => {
                    toggleWishlist(id);
                    trackAddToWishlist(id);
                  }}
                />
              </div>
            )}
            </div>

          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <EcommerceFooter
          storeName={affiliateStore.store_name}
          logoUrl={affiliateStore.logo_url}
          settings={storeSettings ? {
            footer_phone: (storeSettings as any).footer_phone,
            footer_address: (storeSettings as any).footer_address,
            footer_description: (storeSettings as any).footer_description,
            store_email: storeSettings.store_email,
            whatsapp_number: storeSettings.whatsapp_number,
            social_links: storeSettings.social_links as any,
          } : null}
        />

        {/* Modern Shopping Cart */}
        <ModernShoppingCart
          open={showCart}
          onClose={() => setShowCart(false)}
          items={isolatedCart?.items || []}
          total={cartTotal}
          onUpdateQuantity={updateCartQuantity}
          onRemoveItem={removeFromCart}
          onCheckout={() => {
            // استخدام StorefrontSession للتحقق من صلاحية الجلسة (يتطلب isVerified=true و expiresAt صالح)
            if (!affiliateStore?.store_slug) return;

            const sessionManager = new StorefrontSession(
              affiliateStore.store_slug
            );
            const isValidSession = sessionManager.isSessionValid();

            if (!isValidSession) {
              toast({
                title: "يجب تسجيل الدخول أولاً",
                description:
                  "الرجاء تسجيل الدخول برقم جوالك لحفظ الطلب في صفحة طلباتي",
                variant: "default",
              });
              setPendingCheckout(true);
              setShowCart(false);
              setShowAuthModal(true);
              return;
            }
            setShowCart(false);
            handleCheckoutClick();
          }}
        />

        {/* Modern Product Modal */}
        {/* Customer Orders Modal */}
        {showOrders && isAuthenticated && customer && affiliateStore && (
          <Dialog
            open={showOrders}
            onOpenChange={(isOpen) => {
              setShowOrders(isOpen);
              if (!isOpen) setSelectedOrderId(null);
            }}
          >
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              {selectedOrderId ? (
                <ModernInvoice
                  orderId={selectedOrderId}
                  onClose={() => setSelectedOrderId(null)}
                />
              ) : (
                <ModernCustomerOrders
                  customerId={customer.profile_id}
                  storeId={affiliateStore.id}
                  onViewInvoice={(orderId) => setSelectedOrderId(orderId)}
                />
              )}
            </DialogContent>
          </Dialog>
        )}

        {/* Auth Modal */}
        <CustomerAuthModal
          isOpen={showAuthModal}
          onClose={() => {
            setShowAuthModal(false);
            // إذا كان العميل في وضع الـ checkout المعلق، تحقق من تسجيل دخوله ثم أكمل العملية
            if (pendingCheckout && storeSlug) {
              setPendingCheckout(false);

              // استخدام StorefrontSession.isSessionValid() للتحقق من isVerified=true و expiresAt صالح
              const storefrontSession = new StorefrontSession(storeSlug);
              const isValidSession = storefrontSession.isSessionValid();

              if (isValidSession) {
                handleCheckoutClick();
              }
            }
          }}
          storeId={affiliateStore?.id || ""}
          storeSlug={storeSlug || ""}
          storeName={affiliateStore?.store_name || ""}
        />

        {/* Draggable Chat Button (AI + Human Support) */}
        {affiliateStore && products && (
          <DraggableChatButton
            storeInfo={{
              id: affiliateStore.id,
              store_name: affiliateStore.store_name,
              bio: affiliateStore.bio,
            }}
            products={products.map((p) => ({
              id: p.id,
              title: p.title,
              description: p.description,
              price_sar: p.price_sar,
              stock: p.stock,
              category: p.category,
            }))}
            customerProfileId={customer?.profile_id}
            isAuthenticated={isAuthenticated}
            onAuthRequired={() => {
              toast({
                title: "تسجيل الدخول مطلوب",
                description: "يجب تسجيل الدخول لبدء المحادثة مع المتجر",
              });
              setShowAuthModal(true);
            }}
          />
        )}

        {/* Advanced Search - using filters state */}
        {showAdvancedSearch && (
          <Dialog
            open={showAdvancedSearch}
            onOpenChange={setShowAdvancedSearch}
          >
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <AdvancedSearch
                filters={{
                  query: searchQuery,
                  priceRange: priceRange,
                  categories:
                    selectedCategory !== "all" ? [selectedCategory] : [],
                  rating: null,
                  inStock: false,
                  sortBy: sortBy as any,
                  colors: [],
                  sizes: [],
                }}
                onFiltersChange={(newFilters) => {
                  setSearchQuery(newFilters.query);
                  setPriceRange(newFilters.priceRange);
                  setSelectedCategory(newFilters.categories[0] || "all");
                  setSortBy(newFilters.sortBy);
                  setShowAdvancedSearch(false);
                }}
                categories={visibleCategories.map((c) => c.name)}
                maxPrice={1000}
                totalResults={filteredProducts.length}
              />
            </DialogContent>
          </Dialog>
        )}

        {/* Compare Products Modal */}
        {showCompare && products && (
          <Dialog open={showCompare} onOpenChange={setShowCompare}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <CompareProducts
                products={products
                  .filter((p) => compareList.includes(p.id))
                  .map((p) => ({
                    id: p.id,
                    title: p.title,
                    description: p.description,
                    price_sar: p.final_price || p.price_sar,
                    image_urls: p.image_urls,
                    rating: p.average_rating,
                    reviews_count: p.total_reviews,
                    stock_quantity: p.stock,
                    category: p.category,
                  }))}
                storeId={affiliateStore?.id || ""}
                onAddToCart={(productId: string) => {
                  const product = products.find((p) => p.id === productId);
                  if (product) {
                    addToCart(product);
                  }
                }}
                onClose={() => setShowCompare(false)}
              />
            </DialogContent>
          </Dialog>
        )}

        {/* Customer Loyalty Modal */}
        {showLoyalty && (
          <Dialog open={showLoyalty} onOpenChange={setShowLoyalty}>
            <DialogContent className="max-w-lg">
              <CustomerLoyaltyCard
                points={customer?.loyalty_points || 0}
                totalOrders={0}
                totalSpent={0}
              />
            </DialogContent>
          </Dialog>
        )}

        {/* Abandoned Cart Recovery */}
        {affiliateStore &&
          storeSlug &&
          (isolatedCart?.items?.length || 0) > 0 && (
            <AbandonedCartRecovery
              storeSlug={storeSlug}
              items={(isolatedCart?.items || []).map((item: any) => ({
                id: item.product_id,
                title: item.title || "منتج",
                price: item.unit_price_sar || 0,
                image: item.image_url,
                quantity: item.quantity || 1,
              }))}
              lastUpdated={new Date()}
              discountPercent={10}
            />
          )}

        {/* Footer - نفس فوتر الصفحة الرئيسية */}
        <HomeFooter />
        </motion.div>
    </StoreThemeProvider>
  );
};

export default EnhancedStoreFront;
