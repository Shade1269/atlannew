import { Heart, ShoppingCart, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useLuxuryTheme } from './LuxuryThemeContext';

export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  image: string;
  inStock: boolean;
}

interface LuxuryWishlistProps {
  items: WishlistItem[];
  onRemoveItem: (id: string) => void;
  onAddToCart: (item: WishlistItem) => void;
  onContinueShopping: () => void;
}

export function LuxuryWishlist({
  items,
  onRemoveItem,
  onAddToCart,
  onContinueShopping,
}: LuxuryWishlistProps) {
  const { colors } = useLuxuryTheme();
  
  return (
    <div className="min-h-screen py-12" dir="rtl" style={{ background: colors.background, color: colors.text }}>
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <Heart className="w-8 h-8" style={{ color: colors.primary, fill: colors.primary }} />
            <h1 className="text-3xl md:text-4xl font-bold">
              قائمة المفضلة
            </h1>
          </div>
          <p style={{ color: colors.textMuted }}>
            {items.length} منتج في قائمتك
          </p>
        </motion.div>

        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Heart className="w-20 h-20 mx-auto mb-6" style={{ color: colors.textMuted }} />
            <h2 className="text-2xl font-semibold mb-4">
              قائمة المفضلة فارغة
            </h2>
            <p className="mb-8" style={{ color: colors.textMuted }}>
              أضف منتجاتك المفضلة لتجدها هنا لاحقاً
            </p>
            <Button 
              onClick={onContinueShopping}
              style={{ background: colors.buttonPrimary, color: colors.buttonText }}
            >
              تصفح المنتجات
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.1 }}
                  className="group rounded-xl overflow-hidden transition-all duration-300"
                  style={{ 
                    background: colors.backgroundSecondary, 
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  {/* Image */}
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    
                    {/* Remove Button */}
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                      style={{ 
                        background: colors.backgroundSecondary,
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {/* Out of Stock Overlay */}
                    {!item.inStock && (
                      <div 
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ background: `${colors.background}99` }}
                      >
                        <span 
                          className="px-4 py-2 rounded-full text-sm font-medium"
                          style={{ background: colors.backgroundTertiary, color: colors.textMuted }}
                        >
                          غير متوفر
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold mb-2 line-clamp-2">
                      {item.name}
                    </h3>
                    <p className="font-bold text-lg mb-4" style={{ color: colors.primary }}>
                      {item.price.toFixed(2)} ر.س
                    </p>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => onAddToCart(item)}
                        disabled={!item.inStock}
                        className="flex-1"
                        size="sm"
                        style={{
                          background: colors.buttonPrimary,
                          color: colors.buttonText,
                        }}
                      >
                        <ShoppingCart className="w-4 h-4 ml-2" />
                        أضف للسلة
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRemoveItem(item.id)}
                        style={{
                          background: 'transparent',
                          border: `1px solid ${colors.border}`,
                          color: colors.error,
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
