import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { LuxuryProductCard } from './FeaturedProducts';
import { useLuxuryTheme } from './LuxuryThemeContext';

// Types for tracking user behavior
export interface UserBehavior {
  viewedProducts: string[];
  viewedCategories: string[];
  addedToCart: string[];
  addedToWishlist: string[];
  searchQueries: string[];
  timeOnProducts: Record<string, number>;
  purchaseHistory: string[];
}

export interface RecommendedProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  rating: number;
  reviewCount: number;
  tags: string[];
}

interface AIRecommendationsProps {
  products: RecommendedProduct[];
  userBehavior: UserBehavior;
  title?: string;
  maxItems?: number;
  onProductClick: (id: string) => void;
  onAddToCart: (product: RecommendedProduct) => void;
  onAddToWishlist: (id: string) => void;
  variant?: 'horizontal' | 'grid' | 'compact';
}

// Simple AI scoring algorithm
function calculateRecommendationScore(
  product: RecommendedProduct,
  behavior: UserBehavior
): number {
  let score = 0;

  // Category match (viewed categories)
  if (behavior.viewedCategories.includes(product.category)) {
    score += 30;
  }

  // Tag matching with search queries
  behavior.searchQueries.forEach((query) => {
    const queryLower = query.toLowerCase();
    if (product.name.toLowerCase().includes(queryLower)) {
      score += 20;
    }
    product.tags.forEach((tag) => {
      if (tag.toLowerCase().includes(queryLower)) {
        score += 10;
      }
    });
  });

  // Not already viewed (novelty bonus)
  if (!behavior.viewedProducts.includes(product.id)) {
    score += 15;
  }

  // High rating bonus
  score += product.rating * 5;

  // Not in cart or wishlist (avoid redundant recommendations)
  if (behavior.addedToCart.includes(product.id)) {
    score -= 50;
  }
  if (behavior.addedToWishlist.includes(product.id)) {
    score -= 20;
  }

  // Price preference (based on purchase history average)
  // This would need price data from purchase history in real implementation

  return score;
}

export function AIRecommendations({
  products,
  userBehavior,
  title = 'منتجات مقترحة لك',
  maxItems = 6,
  onProductClick,
  onAddToCart,
  onAddToWishlist,
  variant = 'horizontal',
}: AIRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<RecommendedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate recommendations when behavior or products change
  useEffect(() => {
    setIsLoading(true);
    
    // Simulate AI processing delay
    const timer = setTimeout(() => {
      const scored = products.map((product) => ({
        product,
        score: calculateRecommendationScore(product, userBehavior),
      }));

      const sorted = scored
        .sort((a, b) => b.score - a.score)
        .slice(0, maxItems)
        .map((item) => item.product);

      setRecommendations(sorted);
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [products, userBehavior, maxItems]);

  const { colors, isDark } = useLuxuryTheme();

  if (recommendations.length === 0 && !isLoading) return null;

  const containerClass = variant === 'grid' 
    ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
    : variant === 'compact'
    ? 'flex gap-3 overflow-x-auto pb-2 scrollbar-hide'
    : 'flex gap-6 overflow-x-auto pb-4 scrollbar-hide';

  const sectionBg = isDark ? 'hsl(20, 14%, 4%)' : 'transparent';
  const productsAreaBg = isDark ? 'hsl(20, 14%, 4%)' : 'transparent';
  const titleColor = isDark ? '#ffffff' : colors.text;
  const subtitleColor = isDark ? colors.accent : colors.textMuted;

  return (
    <div className="py-8 px-4 md:px-6" dir="rtl" style={{ background: sectionBg }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center border"
            style={{ background: `${colors.accent}20`, borderColor: colors.accent }}
          >
            <Sparkles className="w-5 h-5" style={{ color: colors.accent }} />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: titleColor }}>
              {title}
            </h2>
            <p className="text-xs" style={{ color: subtitleColor }}>
              مدعوم بالذكاء الاصطناعي
            </p>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-sm" style={{ color: colors.accent }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles className="w-4 h-4" />
            </motion.div>
            جاري التحليل...
          </div>
        )}
      </div>

      {/* Products */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={containerClass}
            style={{ background: productsAreaBg }}
          >
            {Array.from({ length: maxItems }).map((_, i) => (
              <div
                key={i}
                className={`flex-shrink-0 ${variant === 'compact' ? 'w-32' : 'w-56'} animate-pulse`}
              >
                <div className="aspect-[3/4] rounded-xl mb-3" style={{ background: colors.backgroundTertiary || (isDark ? 'hsla(0,0%,100%,0.08)' : 'hsl(0,0%,90%)') }} />
                <div className="h-4 rounded mb-2 w-3/4" style={{ background: colors.backgroundTertiary || (isDark ? 'hsla(0,0%,100%,0.08)' : 'hsl(0,0%,90%)') }} />
                <div className="h-4 rounded w-1/2" style={{ background: colors.backgroundTertiary || (isDark ? 'hsla(0,0%,100%,0.08)' : 'hsl(0,0%,90%)') }} />
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="products"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={variant === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : containerClass}
            style={{ background: productsAreaBg }}
          >
            {recommendations.map((product, index) => (
              <div key={product.id} className={variant !== 'grid' ? 'flex-shrink-0 w-56' : ''}>
                <LuxuryProductCard
                  product={{
                    id: product.id,
                    title: product.name,
                    imageUrl: product.image,
                    price: product.price,
                    originalPrice: product.originalPrice,
                    category: product.category,
                    rating: product.rating,
                    reviewCount: product.reviewCount,
                  }}
                  index={index}
                  onProductClick={() => onProductClick(product.id)}
                  onAddToCart={() => onAddToCart(product)}
                  onAddToWishlist={() => onAddToWishlist(product.id)}
                  compact={variant === 'compact'}
                />
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Hook to track user behavior (to be used in the store)
export function useUserBehaviorTracker() {
  const [behavior, setBehavior] = useState<UserBehavior>({
    viewedProducts: [],
    viewedCategories: [],
    addedToCart: [],
    addedToWishlist: [],
    searchQueries: [],
    timeOnProducts: {},
    purchaseHistory: [],
  });

  const trackProductView = useCallback((productId: string, category: string) => {
    setBehavior((prev) => ({
      ...prev,
      viewedProducts: [...new Set([...prev.viewedProducts, productId])].slice(-50),
      viewedCategories: [...new Set([...prev.viewedCategories, category])].slice(-20),
    }));
  }, []);

  const trackAddToCart = useCallback((productId: string) => {
    setBehavior((prev) => ({
      ...prev,
      addedToCart: [...new Set([...prev.addedToCart, productId])],
    }));
  }, []);

  const trackAddToWishlist = useCallback((productId: string) => {
    setBehavior((prev) => ({
      ...prev,
      addedToWishlist: [...new Set([...prev.addedToWishlist, productId])],
    }));
  }, []);

  const trackSearch = useCallback((query: string) => {
    if (query.trim()) {
      setBehavior((prev) => ({
        ...prev,
        searchQueries: [...new Set([query, ...prev.searchQueries])].slice(0, 20),
      }));
    }
  }, []);

  const trackTimeOnProduct = useCallback((productId: string, seconds: number) => {
    setBehavior((prev) => ({
      ...prev,
      timeOnProducts: {
        ...prev.timeOnProducts,
        [productId]: (prev.timeOnProducts[productId] || 0) + seconds,
      },
    }));
  }, []);

  return {
    behavior,
    trackProductView,
    trackAddToCart,
    trackAddToWishlist,
    trackSearch,
    trackTimeOnProduct,
  };
}
