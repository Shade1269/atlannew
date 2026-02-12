import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, ChevronLeft } from 'lucide-react';
import { useLuxuryTheme } from './LuxuryThemeContext';

interface Product {
  id: string;
  title: string;
  imageUrl: string;
  price: number;
  originalPrice?: number;
  category?: string;
  rating?: number;
  reviewCount?: number;
  isNew?: boolean;
  isSale?: boolean;
  isBestseller?: boolean;
}

interface FeaturedProductsProps {
  products: Product[];
  title?: string;
  subtitle?: string;
  onProductClick?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onAddToWishlist?: (product: Product) => void;
  onAddToCompare?: (product: Product) => void;
  compareList?: string[];
  wishlistIds?: string[];
  /** رابط صفحة "عرض الكل" (مثلاً /store-slug/shop) */
  showAllHref?: string;
}

export interface LuxuryProductCardProduct {
  id: string;
  title: string;
  imageUrl: string;
  price: number;
  originalPrice?: number;
  category?: string;
  rating?: number;
  reviewCount?: number;
  isNew?: boolean;
  isSale?: boolean;
  isBestseller?: boolean;
}

export const LuxuryProductCard: React.FC<{
  product: LuxuryProductCardProduct;
  index?: number;
  onProductClick?: (product: LuxuryProductCardProduct) => void;
  onAddToCart?: (product: LuxuryProductCardProduct) => void;
  onAddToWishlist?: (product: LuxuryProductCardProduct) => void;
  onAddToCompare?: (product: LuxuryProductCardProduct) => void;
  isInCompare?: boolean;
  isInWishlist?: boolean;
  /** عند true لا تظهر أزرار المفضلة/المقارنة/عرض سريع ولا زر أضيفي للسلة (لصفحة عرض الكل) */
  compact?: boolean;
}> = ({ product, index = 0, onProductClick, onAddToCart, onAddToWishlist, onAddToCompare, isInCompare, isInWishlist, compact }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { colors, isDark } = useLuxuryTheme();

  const discount = product.originalPrice && product.originalPrice > product.price
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  return (
    <motion.div
      className="group"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        onClick={() => onProductClick?.(product)}
        className="relative rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-xl border"
        style={{
          background: colors.backgroundCard,
          borderColor: colors.border,
        }}
      >
        <div className="relative aspect-[3/4] overflow-hidden">
          <img
            src={product.imageUrl}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {discount > 0 && (
            <div
              className="absolute top-2 right-2 px-2 py-1 rounded-full text-[10px] font-bold"
              style={{ background: colors.error, color: 'white' }}
            >
              -{discount}%
            </div>
          )}
          {!compact && (
            <div className="absolute bottom-2 left-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCart?.(product);
                }}
                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-colors"
                style={{
                  background: colors.primaryGradient || colors.primary,
                  color: colors.primaryText || '#fff',
                }}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                أضف
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToWishlist?.(product);
                }}
                className="p-2 rounded-lg transition-colors"
                style={{
                  background: isDark ? 'hsla(0,0%,100%,0.15)' : 'hsla(0,0%,0%,0.06)',
                }}
              >
                <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-current' : ''}`} style={{ color: isInWishlist ? colors.error : colors.textMuted }} />
              </button>
            </div>
          )}
        </div>
        {!compact && (
          <div className="p-3">
            <p className="text-xs mb-1" style={{ color: isDark ? colors.accent : colors.textMuted }}>
              {product.category || 'أزياء'}
            </p>
            <h3 className="text-sm font-medium mb-2 line-clamp-2 transition-colors" style={{ color: isDark ? '#ffffff' : colors.text }}>
              {product.title}
            </h3>
            <div className="flex items-center gap-2">
              <span className="font-bold" style={{ color: colors.primary }}>
                {product.price.toLocaleString()} ر.س
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xs line-through" style={{ color: isDark ? colors.accent : colors.textMuted }}>
                  {product.originalPrice.toLocaleString()} ر.س
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const ProductCard = LuxuryProductCard;

export const FeaturedProducts: React.FC<FeaturedProductsProps> = ({
  products,
  title = 'منتجات مميزة',
  subtitle,
  onProductClick,
  onAddToCart,
  onAddToWishlist,
  onAddToCompare,
  compareList = [],
  wishlistIds = [],
  showAllHref,
}) => {
  const { colors, isDark } = useLuxuryTheme();

  const hasHeader = !!title;
  return (
    <section 
      className="py-16 md:py-24 transition-colors duration-500"
      style={{
        background: hasHeader 
          ? (isDark ? 'linear-gradient(180deg, hsl(20, 12%, 7%) 0%, hsl(20, 12%, 6%) 100%)' : '#ffffff')
          : 'transparent',
      }}
    >
      <div className="container mx-auto px-4 md:px-6">
        {hasHeader && (
        <motion.div 
          className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 md:mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div>
            <p 
              className="text-xs tracking-[0.4em] uppercase mb-2"
              style={{ color: colors.accent }}
            >
              مختارات لك
            </p>
            <h2 
              className="text-2xl md:text-4xl"
              style={{ fontFamily: "'Playfair Display', serif", color: isDark ? '#ffffff' : colors.text }}
            >
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm mt-2 max-w-md" style={{ color: isDark ? colors.accent : colors.textMuted }}>
                {subtitle}
              </p>
            )}
          </div>
          
          {showAllHref ? (
            <Link to={showAllHref}>
              <motion.span
                className="text-sm tracking-wide px-6 py-3 rounded-lg flex items-center gap-2 inline-flex border"
                style={{
                  borderColor: isDark ? 'rgba(255,255,255,0.5)' : colors.border,
                  color: isDark ? '#ffffff' : colors.textSecondary,
                }}
                whileHover={{
                  borderColor: colors.borderHover,
                  boxShadow: `0 0 30px ${isDark ? 'hsla(38, 80%, 50%, 0.1)' : 'hsla(20, 70%, 35%, 0.1)'}`,
                }}
              >
                عرض الكل
                <ChevronLeft className="w-4 h-4" />
              </motion.span>
            </Link>
          ) : (
            <motion.a
              href="#collection"
              className="text-sm tracking-wide px-6 py-3 rounded-lg flex items-center gap-2"
              style={{
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.5)' : colors.border}`,
                color: isDark ? '#ffffff' : colors.textSecondary,
              }}
              whileHover={{
                borderColor: colors.borderHover,
                boxShadow: `0 0 30px ${isDark ? 'hsla(38, 80%, 50%, 0.1)' : 'hsla(20, 70%, 35%, 0.1)'}`,
              }}
            >
              عرض الكل
              <ChevronLeft className="w-4 h-4" />
            </motion.a>
          )}
        </motion.div>
        )}

        {/* Products Grid — نفس حجم كارت "منتجات مقترحة لك" (عرض أساسي 14rem) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {products.map((product, index) => (
            <div key={product.id} className="min-w-0">
            <ProductCard
              product={product}
              index={index}
              onProductClick={onProductClick}
              onAddToCart={onAddToCart}
              onAddToWishlist={onAddToWishlist}
              onAddToCompare={onAddToCompare}
              isInCompare={compareList.includes(product.id)}
              isInWishlist={wishlistIds.includes(product.id)}
            />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
