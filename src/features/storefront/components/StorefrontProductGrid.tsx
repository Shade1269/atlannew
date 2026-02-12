import { useEffect, useRef, useState } from "react";
import { EnhancedProductCard } from "@/components/storefront/modern/EnhancedProductCard";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Product {
  id: string;
  title: string;
  description?: string;
  price_sar: number;
  image_urls?: string[];
  stock: number;
  category?: string;
  average_rating?: number;
  total_reviews?: number;
  discount_percentage?: number;
  variants?: any[];
}

interface StorefrontProductGridProps {
  products: Product[];
  wishlist?: string[];
  onAddToCart: (product: Product) => void;
  onProductClick: (product: Product) => void;
  onToggleWishlist?: (productId: string) => void;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  variant?: "grid" | "list";
}

export const StorefrontProductGrid = ({
  products,
  wishlist = [],
  onAddToCart,
  onProductClick,
  onToggleWishlist,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  variant = "grid",
}: StorefrontProductGridProps) => {
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const observerRef = useRef<HTMLDivElement>(null);
  const PRODUCTS_PER_PAGE = 12;

  // Initial load
  useEffect(() => {
    setDisplayedProducts(products.slice(0, PRODUCTS_PER_PAGE));
    setPage(1);
  }, [products]);

  // Infinite scroll observer
  useEffect(() => {
    if (!observerRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );

    observer.observe(observerRef.current);

    return () => observer.disconnect();
  }, [hasMore, isLoading, page]);

  const loadMore = () => {
    if (onLoadMore) {
      onLoadMore();
    } else {
      // Local pagination
      const nextPage = page + 1;
      const start = 0;
      const end = nextPage * PRODUCTS_PER_PAGE;
      const newProducts = products.slice(start, end);
      setDisplayedProducts(newProducts);
      setPage(nextPage);
    }
  };

  const gridClassName =
    variant === "grid"
      ? "grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6"
      : "flex flex-col gap-4";

  const showLoadingIndicator = isLoading || displayedProducts.length < products.length;

  // Handle toggle wishlist with fallback
  const handleToggleWishlist = (productId: string) => {
    if (onToggleWishlist) {
      onToggleWishlist(productId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Products Grid */}
      <div className={gridClassName}>
        <AnimatePresence mode="popLayout">
          {displayedProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <EnhancedProductCard
                product={product as any}
                isInWishlist={wishlist.includes(product.id)}
                onAddToCart={(p) => onAddToCart(p as Product)}
                onProductClick={onProductClick}
                onToggleWishlist={handleToggleWishlist}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Loading Indicator / Load More Trigger */}
      {showLoadingIndicator && (
        <div ref={observerRef} className="flex justify-center py-8">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">جاري تحميل المزيد...</p>
            </div>
          ) : (
            displayedProducts.length < products.length && (
              <div className="h-8" /> // Trigger element for intersection observer
            )
          )}
        </div>
      )}

      {/* No More Products */}
      {!hasMore && displayedProducts.length === products.length && products.length > 0 && (
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground">
            تم عرض جميع المنتجات ({products.length} منتج)
          </p>
        </div>
      )}
    </div>
  );
};

// Skeleton Loader Component
export const ProductGridSkeleton = ({ count = 12 }: { count?: number }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3 animate-pulse">
          {/* Image skeleton */}
          <div className="aspect-square bg-muted rounded-lg" />
          {/* Content skeleton */}
          <div className="space-y-2 p-4">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-6 bg-muted rounded w-1/3 mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
};
