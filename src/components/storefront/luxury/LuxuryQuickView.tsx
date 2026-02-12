import { useState } from "react";
import { X, Heart, ShoppingCart, Minus, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useLuxuryTheme } from './LuxuryThemeContext';

export interface QuickViewProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  images: string[];
  description: string;
  sizes?: string[];
  colors?: Array<{ name: string; value: string }>;
  inStock: boolean;
}

interface LuxuryQuickViewProps {
  isOpen: boolean;
  onClose: () => void;
  product: QuickViewProduct | null;
  onAddToCart: (product: QuickViewProduct, quantity: number, size?: string, color?: string) => void;
  onAddToWishlist: (id: string) => void;
  onViewDetails: (id: string) => void;
}

export function LuxuryQuickView({
  isOpen,
  onClose,
  product,
  onAddToCart,
  onAddToWishlist,
  onViewDetails,
}: LuxuryQuickViewProps) {
  const { colors } = useLuxuryTheme();
  const [currentImage, setCurrentImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | undefined>();
  const [selectedColor, setSelectedColor] = useState<string | undefined>();

  if (!product) return null;

  const handleAddToCart = () => {
    onAddToCart(product, quantity, selectedSize, selectedColor);
    onClose();
  };

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % product.images.length);
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50"
            style={{ background: `${colors.background}CC`, backdropFilter: 'blur(8px)' }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-4xl md:max-h-[90vh] rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
            style={{ 
              background: colors.backgroundSecondary,
              border: `1px solid ${colors.border}`,
            }}
            dir="rtl"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
              style={{ 
                background: colors.backgroundTertiary,
                backdropFilter: 'blur(8px)',
              }}
            >
              <X className="w-5 h-5" style={{ color: colors.text }} />
            </button>

            <div className="flex-1 overflow-y-auto">
              <div className="grid md:grid-cols-2 gap-0">
                {/* Image Gallery */}
                <div className="relative aspect-square md:aspect-auto md:h-full" style={{ background: colors.backgroundTertiary }}>
                  <img
                    src={product.images[currentImage]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />

                  {/* Navigation Arrows */}
                  {product.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                        style={{ background: colors.backgroundSecondary, backdropFilter: 'blur(8px)' }}
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                        style={{ background: colors.backgroundSecondary, backdropFilter: 'blur(8px)' }}
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* Thumbnails */}
                  {product.images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {product.images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImage(index)}
                          className="w-2 h-2 rounded-full transition-all"
                          style={{
                            background: index === currentImage ? colors.primary : colors.textMuted,
                            width: index === currentImage ? '1.5rem' : '0.5rem',
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Discount Badge */}
                  {product.originalPrice && (
                    <span 
                      className="absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-bold"
                      style={{ background: colors.error, color: colors.primaryText }}
                    >
                      خصم {Math.round((1 - product.price / product.originalPrice) * 100)}%
                    </span>
                  )}
                </div>

                {/* Product Details */}
                <div className="p-6 md:p-8 flex flex-col" style={{ color: colors.text }}>
                  <h2 className="text-2xl font-bold mb-2">
                    {product.name}
                  </h2>

                  {/* Price */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl font-bold" style={{ color: colors.primary }}>
                      {product.price.toFixed(2)} ر.س
                    </span>
                    {product.originalPrice && (
                      <span className="text-lg line-through" style={{ color: colors.textMuted }}>
                        {product.originalPrice.toFixed(2)} ر.س
                      </span>
                    )}
                  </div>

                  <p className="mb-6 line-clamp-3" style={{ color: colors.textSecondary }}>
                    {product.description}
                  </p>

                  {/* Colors */}
                  {product.colors && product.colors.length > 0 && (
                    <div className="mb-6">
                      <p className="text-sm font-medium mb-3">اللون</p>
                      <div className="flex gap-2">
                        {product.colors.map((color) => (
                          <button
                            key={color.name}
                            onClick={() => setSelectedColor(color.name)}
                            className="w-10 h-10 rounded-full border-2 transition-all"
                            style={{ 
                              backgroundColor: color.value,
                              borderColor: selectedColor === color.name ? colors.primary : 'transparent',
                              transform: selectedColor === color.name ? 'scale(1.1)' : 'scale(1)',
                            }}
                            title={color.name}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sizes */}
                  {product.sizes && product.sizes.length > 0 && (
                    <div className="mb-6">
                      <p className="text-sm font-medium mb-3">المقاس</p>
                      <div className="flex flex-wrap gap-2">
                        {product.sizes.map((size) => (
                          <button
                            key={size}
                            onClick={() => setSelectedSize(size)}
                            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                            style={{ 
                              background: selectedSize === size ? colors.primary : 'transparent',
                              color: selectedSize === size ? colors.primaryText : colors.text,
                              border: `1px solid ${selectedSize === size ? colors.primary : colors.border}`,
                            }}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quantity */}
                  <div className="mb-6">
                    <p className="text-sm font-medium mb-3">الكمية</p>
                    <div 
                      className="inline-flex items-center rounded-lg"
                      style={{ border: `1px solid ${colors.border}` }}
                    >
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="p-3 transition-colors"
                        style={{ background: 'transparent' }}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-12 text-center font-medium">{quantity}</span>
                      <button
                        onClick={() => setQuantity((q) => q + 1)}
                        className="p-3 transition-colors"
                        style={{ background: 'transparent' }}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 mt-auto">
                    <Button
                      onClick={handleAddToCart}
                      disabled={!product.inStock}
                      className="flex-1 py-6"
                      style={{
                        background: colors.buttonPrimary,
                        color: colors.buttonText,
                      }}
                    >
                      <ShoppingCart className="w-5 h-5 ml-2" />
                      {product.inStock ? "أضف للسلة" : "غير متوفر"}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onAddToWishlist(product.id)}
                      className="w-14 h-14"
                      style={{
                        border: `1px solid ${colors.border}`,
                        color: colors.text,
                      }}
                    >
                      <Heart className="w-5 h-5" />
                    </Button>
                  </div>

                  {/* View Details Link */}
                  <button
                    onClick={() => {
                      onViewDetails(product.id);
                      onClose();
                    }}
                    className="text-center hover:underline mt-4 text-sm"
                    style={{ color: colors.accent }}
                  >
                    عرض التفاصيل الكاملة
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
