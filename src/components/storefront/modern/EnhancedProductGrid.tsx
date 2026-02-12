import { motion } from "framer-motion";
import { EnhancedProductCard } from "./EnhancedProductCard";
import { Package } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Product {
  id: string;
  title: string;
  description: string;
  price_sar: number;
  image_urls: string[];
  stock: number;
  category: string;
  variants?: any[];
  final_price?: number;
  average_rating?: number;
  total_reviews?: number;
  discount_percentage?: number;
}

interface EnhancedProductGridProps {
  products: Product[];
  wishlist: string[];
  onAddToCart: (product: Product, quantity?: number) => void;
  onProductClick: (product: Product) => void;
  onToggleWishlist: (productId: string) => void;
  isLoading?: boolean;
  onShowMessage?: (
    message: string,
    type?: "success" | "error" | "info"
  ) => void;
}

export const EnhancedProductGrid = ({
  products,
  wishlist,
  onAddToCart,
  onProductClick,
  onToggleWishlist,
  isLoading = false,
  onShowMessage,
}: EnhancedProductGridProps) => {
  const { language } = useLanguage();

  // حالة التحميل
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 overflow-hidden animate-pulse max-w-sm mx-auto w-full"
          >
            <div className="aspect-[4/3.5] bg-gray-200 dark:bg-gray-800" />
            <div className="p-3 sm:p-4 space-y-2">
              <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full" />
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3" />
              <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
              <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // حالة عدم وجود منتجات
  if (!products || products.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16"
      >
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Package className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {language === "ar" ? "لا توجد منتجات" : "No Products"}
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {language === "ar"
            ? "لم نجد منتجات مطابقة. جرب البحث بكلمات مختلفة."
            : "No matching products found. Try searching with different keywords."}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6"
    >
      {products.map((product, index) => (
        <motion.div
          key={product.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.02 }}
        >
          <EnhancedProductCard
            product={product}
            onAddToCart={onAddToCart}
            onProductClick={onProductClick}
            onToggleWishlist={onToggleWishlist}
            isInWishlist={wishlist.includes(product.id)}
            onShowMessage={onShowMessage}
          />
        </motion.div>
      ))}
    </motion.div>
  );
};
