import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import {
  Heart,
  Star,
  ShoppingCart,
  Plus,
  Minus,
  Palette,
  Ruler,
  Check,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface ProductVariant {
  id: string;
  product_id: string;
  size?: string | null;
  color?: string | null;
  color_code?: string | null;
  available_stock: number;
  current_stock: number;
  selling_price?: number;
  variant_name?: string;
  is_active: boolean;
}

interface Product {
  id: string;
  title: string;
  description: string;
  price_sar: number;
  image_urls: string[];
  stock: number;
  category: string;
  variants?: ProductVariant[];
  final_price?: number;
  average_rating?: number;
  total_reviews?: number;
  discount_percentage?: number;
}

interface EnhancedProductCardProps {
  product: Product;
  onAddToCart: (product: Product, quantity?: number) => void;
  onProductClick: (product: Product) => void;
  onToggleWishlist: (productId: string) => void;
  isInWishlist: boolean;
  onShowMessage?: (
    message: string,
    type?: "success" | "error" | "info"
  ) => void;
}

export const EnhancedProductCard = ({
  product,
  onAddToCart,
  onProductClick,
  onToggleWishlist,
  isInWishlist,
  onShowMessage,
}: EnhancedProductCardProps) => {
  const { language } = useLanguage();
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isHovered, setIsHovered] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  const hasDiscount =
    product.discount_percentage && product.discount_percentage > 0;
  const isOutOfStock = product.stock === 0;
  const hasVariants = product.variants && product.variants.length > 0;

  // استخراج الألوان المتاحة
  const availableColors = useMemo(() => {
    if (!product.variants) return [];
    const colors = new Map<string, string>();
    product.variants.forEach((v: ProductVariant) => {
      if (v.color && v.is_active && v.available_stock > 0) {
        colors.set(v.color, v.color_code || getColorCode(v.color));
      }
    });
    return Array.from(colors.entries());
  }, [product.variants]);

  // استخراج المقاسات المتاحة
  const availableSizes = useMemo(() => {
    if (!product.variants) return [];
    const sizes = new Set<string>();
    product.variants.forEach((v: ProductVariant) => {
      if (v.size && v.is_active && v.available_stock > 0) {
        if (!selectedColor || v.color === selectedColor) {
          sizes.add(v.size);
        }
      }
    });
    return Array.from(sizes);
  }, [product.variants, selectedColor]);

  // تحويل اسم اللون إلى كود
  function getColorCode(colorName: string): string {
    const colorMap: Record<string, string> = {
      أحمر: "#DC2626",
      red: "#DC2626",
      أزرق: "#2563EB",
      blue: "#2563EB",
      أخضر: "#16A34A",
      green: "#16A34A",
      أسود: "#171717",
      black: "#171717",
      أبيض: "#FAFAFA",
      white: "#FAFAFA",
      رمادي: "#6B7280",
      gray: "#6B7280",
      grey: "#6B7280",
      بني: "#92400E",
      brown: "#92400E",
      أصفر: "#EAB308",
      yellow: "#EAB308",
      وردي: "#EC4899",
      pink: "#EC4899",
      برتقالي: "#EA580C",
      orange: "#EA580C",
      بنفسجي: "#7C3AED",
      purple: "#7C3AED",
      ذهبي: "#D4AF37",
      gold: "#D4AF37",
      فضي: "#A1A1AA",
      silver: "#A1A1AA",
      بيج: "#D4C4A8",
      beige: "#D4C4A8",
      كحلي: "#1E3A5F",
      navy: "#1E3A5F",
    };
    return (
      colorMap[colorName.toLowerCase()] || colorMap[colorName] || "#9CA3AF"
    );
  }

  const getSelectedVariant = () => {
    if (!hasVariants) return null;
    return product.variants?.find(
      (v: ProductVariant) =>
        v.color === selectedColor &&
        v.size === selectedSize &&
        v.is_active &&
        v.available_stock > 0
    );
  };

  const handleAddToCart = (e?: React.MouseEvent) => {
    e?.stopPropagation();

    if (hasVariants && !getSelectedVariant()) {
      const missing: string[] = [];
      if (!selectedColor && availableColors.length > 0) {
        missing.push(language === "ar" ? "اللون" : "Color");
      }
      if (!selectedSize && availableSizes.length > 0) {
        missing.push(language === "ar" ? "المقاس" : "Size");
      }

      const message =
        language === "ar"
          ? `يرجى اختيار ${missing.join(" و ")} قبل الإضافة للسلة`
          : `Please select ${missing.join(" and ")} before adding to cart`;

      if (onShowMessage) {
        onShowMessage(message, "error");
      }
      return;
    }
    onAddToCart(product, quantity);
  };

  const handleQuantityChange = (delta: number) => {
    const maxStock = getSelectedVariant()?.available_stock || product.stock;
    const newQuantity = Math.max(1, Math.min(maxStock, quantity + delta));
    setQuantity(newQuantity);
  };

  // حساب نسبة التوفير
  const savings = hasDiscount
    ? Math.round(product.price_sar - (product.final_price || product.price_sar))
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setImageIndex(0);
      }}
    >
      <div className="group h-full flex flex-col bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 overflow-hidden hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-2xl transition-all duration-300">
        {/* صورة المنتج - أكبر */}
        <div
          className="relative w-full aspect-[4/3.5] bg-gray-100 dark:bg-gray-800 cursor-pointer overflow-hidden"
          onClick={() => onProductClick(product)}
        >
          <img
            src={
              product.image_urls?.[imageIndex] ||
              product.image_urls?.[0] ||
              "/placeholder.svg"
            }
            alt={product.title}
            className={cn(
              "w-full h-full object-cover transition-transform duration-500",
              isHovered && "scale-110"
            )}
            loading="lazy"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* شارة الخصم */}
          {hasDiscount && (
            <div className="absolute top-3 right-3 bg-gradient-to-br from-[#D4AF37] to-[#B8941F] dark:from-[#FFD700] dark:to-[#E0C000] text-white dark:text-black text-xs font-bold px-2.5 py-1.5 rounded-lg shadow-lg">
              -{product.discount_percentage}%
            </div>
          )}

          {/* نفد المخزون */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/95 flex items-center justify-center">
              <span className="bg-red-500 text-white text-sm font-medium px-4 py-2 rounded-lg">
                {language === "ar" ? "نفد المخزون" : "Out of Stock"}
              </span>
            </div>
          )}

          {/* زر المفضلة */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(product.id);
            }}
            className={cn(
              "absolute top-3 left-3 w-9 h-9 rounded-full flex items-center justify-center transition-all backdrop-blur-md shadow-lg",
              isInWishlist
                ? "bg-red-500 text-white"
                : "bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20"
            )}
            aria-label={language === "ar" ? "المفضلة" : "Wishlist"}
            title={language === "ar" ? "المفضلة" : "Wishlist"}
          >
            <Heart className={cn("h-4 w-4", isInWishlist && "fill-current")} />
          </button>

          {/* نقاط الصور */}
          {product.image_urls && product.image_urls.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/50 backdrop-blur-sm px-2.5 py-1.5 rounded-full">
              {product.image_urls.slice(0, 5).map((_, idx) => (
                <button
                  key={idx}
                  onMouseEnter={() => setImageIndex(idx)}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all",
                    imageIndex === idx ? "bg-white w-4" : "bg-white/50"
                  )}
                  aria-label={`${language === "ar" ? "صورة" : "Image"} ${
                    idx + 1
                  }`}
                  title={`${language === "ar" ? "صورة" : "Image"} ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* محتوى الكارت */}
        <div className="flex-1 flex flex-col p-3 sm:p-4 gap-2">
          {/* الفئة */}
          {product.category && (
            <span className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">
              {product.category}
            </span>
          )}

          {/* العنوان */}
          <h3
            className="text-sm sm:text-base font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            onClick={() => onProductClick(product)}
          >
            {product.title}
          </h3>

          {/* التقييم */}
          {product.average_rating && product.average_rating > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      "h-3.5 w-3.5",
                      star <= Math.round(product.average_rating || 0)
                        ? "fill-amber-400 text-amber-400"
                        : "fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700"
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ({product.total_reviews || 0})
              </span>
            </div>
          )}

          {/* السعر - تنسيق احترافي */}
          <div className="space-y-0.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">
                {(product.final_price || product.price_sar).toFixed(0)}
              </span>
              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
                {language === "ar" ? "ر.س" : "SAR"}
              </span>
            </div>
            {hasDiscount && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-400 dark:text-gray-500 line-through">
                  {product.price_sar.toFixed(0)}
                </span>
                <span className="text-green-600 dark:text-green-500 font-semibold">
                  {language === "ar"
                    ? `وفر ${savings} ر.س`
                    : `Save ${savings} SAR`}
                </span>
              </div>
            )}
          </div>

          {/* الألوان - الدائرة بنفس اللون */}
          {availableColors.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Palette className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
              {availableColors.slice(0, 5).map(([colorName, colorCode]) => (
                <button
                  key={colorName}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedColor(colorName);
                    setSelectedSize(null);
                  }}
                  className={cn(
                    "w-5 h-5 rounded-full border-2 transition-all",
                    selectedColor === colorName
                      ? "ring-2 ring-blue-500 ring-offset-1 scale-110"
                      : "hover:scale-105"
                  )}
                  style={{
                    backgroundColor: colorCode,
                    borderColor:
                      colorCode === "#FAFAFA" || colorCode === "#FFFFFF"
                        ? "#D4D4D8"
                        : colorCode,
                  }}
                  title={colorName}
                  aria-label={`${
                    language === "ar" ? "اختر اللون" : "Select color"
                  }: ${colorName}`}
                />
              ))}
            </div>
          )}

          {/* المقاسات */}
          {availableSizes.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Ruler className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
              {availableSizes.slice(0, 4).map((size) => (
                <button
                  key={size}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSize(size);
                  }}
                  className={cn(
                    "px-2.5 py-1 text-[10px] sm:text-xs font-medium rounded-md border transition-all",
                    selectedSize === size
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                      : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-400"
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          )}

          {/* المخزون */}
          {product.stock > 0 && product.stock <= 5 && (
            <p className="text-xs text-orange-600 dark:text-orange-500 font-semibold">
              {language === "ar"
                ? `باقي ${product.stock} فقط!`
                : `Only ${product.stock} left!`}
            </p>
          )}

          {/* الكمية والإضافة للسلة */}
          <div className="flex items-center gap-3 mt-auto pt-3 border-t border-gray-200 dark:border-gray-700">
            {/* زر الإضافة للسلة - خلفية ذهبية */}
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: isOutOfStock
                  ? "#6b7280"
                  : "linear-gradient(to right, #D4AF37, #B8941F)",
                color: isOutOfStock ? "#9ca3af" : "#000000",
                border: "none",
              }}
            >
              {isOutOfStock ? (
                <>
                  <Package className="h-4 w-4" />
                  <span>{language === "ar" ? "غير متوفر" : "Unavailable"}</span>
                </>
              ) : hasVariants && !getSelectedVariant() ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>
                    {language === "ar" ? "اختر الخيارات" : "Select Options"}
                  </span>
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4" />
                  <span>{language === "ar" ? "أضف للسلة" : "Add to Cart"}</span>
                </>
              )}
            </button>

            {/* عداد الكمية - خلفية ذهبية */}
            <div
              className="flex items-center rounded-xl overflow-hidden shadow-lg"
              style={{
                background: "linear-gradient(to right, #D4AF37, #B8941F)",
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuantityChange(1);
                }}
                disabled={
                  quantity >=
                  (getSelectedVariant()?.available_stock || product.stock)
                }
                className="p-2.5 hover:bg-black/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                style={{ color: "#000000" }}
                aria-label={
                  language === "ar" ? "زيادة الكمية" : "Increase quantity"
                }
                title={language === "ar" ? "زيادة الكمية" : "Increase quantity"}
              >
                <Plus className="h-4 w-4" />
              </button>
              <span
                className="px-3 py-1.5 text-sm font-bold min-w-[2rem] text-center"
                style={{
                  color: "#000000",
                  backgroundColor: "rgba(255,255,255,0.2)",
                }}
              >
                {quantity}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuantityChange(-1);
                }}
                disabled={quantity <= 1}
                className="p-2.5 hover:bg-black/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                style={{ color: "#000000" }}
                aria-label={
                  language === "ar" ? "تقليل الكمية" : "Decrease quantity"
                }
                title={language === "ar" ? "تقليل الكمية" : "Decrease quantity"}
              >
                <Minus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
