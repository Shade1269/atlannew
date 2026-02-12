import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, Star, Share2, Truck, RefreshCw, ShieldCheck, Minus, Plus, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLuxuryTheme } from './LuxuryThemeContext';

interface Product {
  id: string;
  title: string;
  imageUrl: string;
  images?: string[];
  price: number;
  originalPrice?: number;
  category?: string;
  description?: string;
  sizes?: string[];
  colors?: { name: string; hex: string }[];
  rating?: number;
  reviewCount?: number;
  inStock?: boolean;
  isNew?: boolean;
  isSale?: boolean;
}

interface LuxuryProductDetailsProps {
  product: Product;
  onAddToCart: (quantity: number, color?: string, size?: string) => void;
  onAddToWishlist?: (product: Product) => void;
  onBack?: () => void;
  onBuyNow?: (quantity: number, color?: string, size?: string) => void;
  relatedProducts?: Product[];
  onRelatedProductClick?: (product: Product) => void;
}

export const LuxuryProductDetails: React.FC<LuxuryProductDetailsProps> = ({
  product,
  onAddToCart,
  onAddToWishlist,
  onBack,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onBuyNow: _onBuyNow,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  relatedProducts: _relatedProducts,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onRelatedProductClick: _onRelatedProductClick,
}) => {
  const { colors, isDark } = useLuxuryTheme();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const images = product.images || [product.imageUrl];
  const sizes = product.sizes || ['XS', 'S', 'M', 'L', 'XL'];
  const productColors = product.colors || [
    { name: 'ذهبي', hex: '#D4AF37' },
    { name: 'أسود', hex: '#1a1a1a' },
    { name: 'كريمي', hex: '#F5F5DC' },
  ];

  const features = [
    { icon: Truck, label: 'شحن مجاني', desc: 'للطلبات فوق 500 ر.س' },
    { icon: RefreshCw, label: 'إرجاع مجاني', desc: 'خلال 14 يوم' },
    { icon: ShieldCheck, label: 'ضمان الجودة', desc: '100% أصلي' },
  ];

  const handleAddToCart = () => {
    onAddToCart(quantity, selectedColor || undefined, selectedSize || undefined);
  };

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    onAddToWishlist?.(product);
  };

  return (
    <div 
      className="min-h-screen py-8 md:py-12 transition-colors duration-500"
      style={{ background: colors.background, color: colors.text }}
    >
      <div className="container mx-auto px-4 md:px-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-6" style={{ color: colors.textMuted }}>
          <button onClick={onBack} className="hover:opacity-100 transition-opacity"  style={{ color: colors.textSecondary }}>الرئيسية</button>
          <ChevronLeft className="w-4 h-4" />
          <span style={{ color: colors.textSecondary }}>{product.category || 'المنتجات'}</span>
          <ChevronLeft className="w-4 h-4" />
          <span style={{ color: colors.text }}>{product.title}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8 md:gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <motion.div 
              className="relative aspect-[3/4] rounded-2xl overflow-hidden"
              style={{ border: `1px solid ${colors.border}` }}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImageIndex}
                  src={images[currentImageIndex]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </AnimatePresence>

              {/* Badges */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                {product.isNew && (
                  <span 
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{ background: colors.primary, color: colors.primaryText }}
                  >
                    جديد
                  </span>
                )}
                {product.isSale && (
                  <span 
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{ background: colors.error, color: 'white' }}
                  >
                    خصم
                  </span>
                )}
              </div>

              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <motion.button
                    onClick={() => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full"
                    style={{ background: isDark ? 'hsla(0, 0%, 0%, 0.5)' : 'hsla(255, 255%, 255%, 0.9)', backdropFilter: 'blur(8px)' }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <ChevronLeft className="w-5 h-5" style={{ color: colors.text }} />
                  </motion.button>
                  <motion.button
                    onClick={() => setCurrentImageIndex((prev) => (prev + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full"
                    style={{ background: isDark ? 'hsla(0, 0%, 0%, 0.5)' : 'hsla(255, 255%, 255%, 0.9)', backdropFilter: 'blur(8px)' }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <ChevronRight className="w-5 h-5" style={{ color: colors.text }} />
                  </motion.button>
                </>
              )}

              {/* Wishlist Button */}
              <motion.button
                onClick={handleWishlist}
                className="absolute top-4 left-4 p-3 rounded-full"
                style={{ 
                  background: isDark ? 'hsla(0, 0%, 0%, 0.4)' : 'hsla(255, 255%, 255%, 0.9)', 
                  backdropFilter: 'blur(8px)',
                  border: `1px solid ${colors.border}`,
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Heart 
                  className="w-5 h-5" 
                  fill={isWishlisted ? colors.error : 'none'}
                  stroke={isWishlisted ? colors.error : colors.text}
                />
              </motion.button>
            </motion.div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img, index) => (
                  <motion.button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className="w-20 h-24 rounded-lg overflow-hidden flex-shrink-0"
                    style={{ 
                      border: index === currentImageIndex 
                        ? `2px solid ${colors.accent}` 
                        : `1px solid ${colors.border}`,
                      opacity: index === currentImageIndex ? 1 : 0.6,
                    }}
                    whileHover={{ opacity: 1 }}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Title & Rating */}
            <div>
              <p className="text-sm mb-2" style={{ color: colors.accent }}>
                {product.category}
              </p>
              <h1 
                className="text-3xl md:text-4xl mb-4"
                style={{ fontFamily: "'Playfair Display', serif", color: colors.text }}
              >
                {product.title}
              </h1>

              {product.rating && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4"
                        fill={i < Math.floor(product.rating!) ? colors.accent : 'transparent'}
                        stroke={colors.accent}
                      />
                    ))}
                  </div>
                  <span className="text-sm" style={{ color: colors.textMuted }}>
                    ({product.reviewCount} تقييم)
                  </span>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-4">
              <span 
                className="text-3xl font-bold"
                style={{ color: colors.accent }}
              >
                {product.price} ر.س
              </span>
              {product.originalPrice && (
                <>
                  <span className="text-xl line-through" style={{ color: colors.textMuted }}>
                    {product.originalPrice} ر.س
                  </span>
                  <span 
                    className="px-2 py-1 rounded-lg text-sm font-medium"
                    style={{ background: `${colors.error}20`, color: colors.error }}
                  >
                    -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                  </span>
                </>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-sm leading-relaxed" style={{ color: colors.textSecondary }}>
                {product.description}
              </p>
            )}

            {/* Color Selection */}
            <div>
              <p className="text-sm font-medium mb-3" style={{ color: colors.text }}>اللون: {selectedColor || 'اختاري'}</p>
              <div className="flex gap-3">
                {productColors.map((color) => (
                  <motion.button
                    key={color.name}
                    onClick={() => setSelectedColor(color.name)}
                    className="relative w-10 h-10 rounded-full"
                    style={{ 
                      background: color.hex,
                      border: selectedColor === color.name 
                        ? `3px solid ${colors.accent}` 
                        : `2px solid ${colors.border}`,
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {selectedColor === color.name && (
                      <Check 
                        className="absolute inset-0 m-auto w-5 h-5" 
                        style={{ color: color.hex === '#1a1a1a' ? 'white' : 'black' }}
                      />
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Size Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium" style={{ color: colors.text }}>المقاس: {selectedSize || 'اختاري'}</p>
                <button className="text-xs underline" style={{ color: colors.textMuted }}>دليل المقاسات</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <motion.button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className="min-w-[48px] px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
                    style={{ 
                      background: selectedSize === size 
                        ? colors.primary 
                        : colors.buttonSecondary,
                      color: selectedSize === size 
                        ? colors.primaryText 
                        : colors.textSecondary,
                      border: selectedSize === size 
                        ? `1px solid ${colors.primary}` 
                        : `1px solid ${colors.border}`,
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {size}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <p className="text-sm font-medium mb-3" style={{ color: colors.text }}>الكمية</p>
              <div 
                className="inline-flex items-center rounded-xl overflow-hidden"
                style={{ border: `1px solid ${colors.border}` }}
              >
                <motion.button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-3"
                  style={{ background: colors.buttonSecondary }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Minus className="w-4 h-4" />
                </motion.button>
                <span className="px-6 text-lg font-medium">{quantity}</span>
                <motion.button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-3"
                  style={{ background: colors.buttonSecondary }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Plus className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <motion.button
                onClick={handleAddToCart}
                className="flex-1 py-4 rounded-xl flex items-center justify-center gap-3 font-medium text-lg"
                style={{
                  background: colors.primaryGradient,
                  color: colors.primaryText,
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ShoppingBag className="w-5 h-5" />
                أضيفي للسلة
              </motion.button>
              <motion.button
                onClick={handleWishlist}
                className="p-4 rounded-xl"
                style={{ 
                  background: colors.buttonSecondary,
                  border: `1px solid ${colors.border}`,
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Heart 
                  className="w-6 h-6"
                  fill={isWishlisted ? colors.error : 'none'}
                  stroke={isWishlisted ? colors.error : colors.text}
                />
              </motion.button>
              <motion.button
                className="p-4 rounded-xl"
                style={{ 
                  background: colors.buttonSecondary,
                  border: `1px solid ${colors.border}`,
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Share2 className="w-6 h-6" style={{ color: colors.text }} />
              </motion.button>
            </div>

            {/* Features */}
            <div 
              className="grid grid-cols-3 gap-4 pt-6"
              style={{ borderTop: `1px solid ${colors.border}` }}
            >
              {features.map((feature, index) => (
                <div key={index} className="text-center">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2"
                    style={{ background: colors.accentMuted }}
                  >
                    <feature.icon className="w-5 h-5" style={{ color: colors.accent }} />
                  </div>
                  <p className="text-xs font-medium" style={{ color: colors.text }}>{feature.label}</p>
                  <p className="text-[10px]" style={{ color: colors.textMuted }}>{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
