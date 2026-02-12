import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UnifiedButton } from "@/components/design-system";
import { UnifiedBadge } from "@/components/design-system";
// لا نستخدم مكوّن Tabs — أزرار عادية لضمان تطبيق لون الثيم
import {
  X,
  Star,
  ShoppingCart,
  Heart,
  Share2,
  Package,
  CheckCircle,
} from "lucide-react";
import { ProductImageCarousel } from "@/features/commerce/components/ProductImageCarousel";
import {
  ProductVariantSelector,
  defaultColorHex,
} from "@/components/products/ProductVariantSelector";
import { ReviewsSection } from "@/components/reviews/ReviewsSection";
import { useState } from "react";
import { useLuxuryTheme } from "@/components/storefront/luxury/LuxuryThemeContext";

/** استخراج ثلاثية HSL لاستخدامها في متغيرات CSS (مثل Tailwind) */
function hslToTriplet(hsl: string): string {
  if (!hsl || !String(hsl).startsWith("hsl")) return "";
  const inner = String(hsl).replace(/^hsla?\(/, "").replace(/\)$/, "").split(",");
  return inner.slice(0, 3).map((s) => s.trim()).join(" ");
}

interface Product {
  id: string;
  title: string;
  description?: string;
  price_sar: number;
  image_urls?: string[];
  stock: number;
  category?: string;
  variants?: any[];
  final_price?: number;
  average_rating?: number;
  total_reviews?: number;
  discount_percentage?: number;
}

interface ModernProductModalProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onAddToCart: () => void;
  onToggleWishlist: (productId: string) => void;
  isInWishlist: boolean;
  selectedVariant: any;
  onVariantChange: (variantId: string | null) => void;
  variantError: string | null;
  storeId?: string;
  customerId?: string | null;
}

export const ModernProductModal = ({
  product,
  open,
  onClose,
  onAddToCart,
  onToggleWishlist,
  isInWishlist,
  selectedVariant: _selectedVariant,
  onVariantChange,
  variantError,
  storeId: _storeId,
  customerId,
}: ModernProductModalProps) => {
  const { colors, isDark } = useLuxuryTheme();
  const [activeTab, setActiveTab] = useState<string>("details");

  if (!product) return null;
  // النمط النهاري: خلفية بيضاء بالكامل؛ الليلي: خلفيات داكنة
  const bg = isDark ? "hsl(20, 14%, 4%)" : "#ffffff";
  const cardBg = isDark ? "hsl(20, 12%, 8%)" : "#ffffff";
  const textPrimary = isDark ? "#ffffff" : (colors.text ?? "hsl(var(--foreground))");
  const textSecondary = isDark ? "rgba(255,255,255,0.85)" : (colors.textSecondary ?? "hsl(var(--muted-foreground))");
  const textMuted = isDark
    ? "rgba(255,255,255,0.7)"
    : (colors.textMuted ?? "hsl(var(--muted-foreground))");
  const borderColor = isDark
    ? "hsla(40, 30%, 40%, 0.25)"
    : (colors.border ?? colors.borderAccent ?? "hsl(var(--border))");
  // خلفية قائمة التبويبات في النهاري: بيضاء مع حدود ثيم
  const tabsListBg = isDark ? "hsla(20,12%,12%,0.8)" : "#ffffff";

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.title,
        text: product.description,
        url: window.location.href,
      });
    }
  };

  // إغلاق الـ modal إذا لم يكن هناك منتج
  if (!product) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent
        hideCloseButton
        className="max-w-6xl max-h-[90vh] overflow-y-auto p-0 border"
        style={{ background: bg, borderColor }}
      >
        <div className="grid md:grid-cols-2 gap-0">
          {/* Image Section */}
          <div className="relative p-6 md:p-8" style={{ background: cardBg }}>
            <UnifiedButton
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="absolute top-4 left-4 z-10 rounded-full p-2"
              style={{
                background: "rgba(220, 38, 38, 0.12)",
                color: "#dc2626",
              }}
              aria-label="إغلاق"
            >
              <X className="h-5 w-5" />
            </UnifiedButton>

            {/* Badges */}
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
              {product.discount_percentage &&
                product.discount_percentage > 0 && (
                  <UnifiedBadge variant="error" className="shadow-lg font-bold">
                    {product.discount_percentage}% خصم
                  </UnifiedBadge>
                )}
              {product.stock === 0 && (
                <UnifiedBadge variant="secondary" className="shadow-lg">
                  نفد المخزون
                </UnifiedBadge>
              )}
            </div>

            <ProductImageCarousel
              images={product.image_urls ?? null}
              productTitle={product.title}
              variants={product.variants}
              themeArrowStyle={{
                background: colors.primary,
                color: colors.primaryText ?? "#fff",
              }}
            />
          </div>

          {/* Content Section - خلفية بيضاء في النهاري، ألوان الثيم للنصوص والأزرار */}
          <div
            className="p-6 md:p-8 space-y-6 modal-product-theme"
            style={{
              color: textPrimary,
              background: bg,
              borderLeft: isDark ? undefined : `1px solid ${borderColor}`,
            }}
          >
            <DialogHeader>
              <div className="space-y-3">
                <DialogTitle
                  className="text-2xl md:text-3xl font-bold leading-tight"
                  style={{ color: textPrimary }}
                >
                  {product.title}
                </DialogTitle>

                {/* Rating */}
                {product.average_rating && product.average_rating > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-5 w-5 ${
                            star <= Math.round(product.average_rating || 0)
                              ? "fill-warning text-warning"
                              : "fill-muted text-muted"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm" style={{ color: textMuted }}>
                      (
                      {(product.total_reviews ?? 0) > 0
                        ? `${product.total_reviews} تقييم`
                        : "لا يوجد تقييمات"}
                      )
                    </span>
                  </div>
                )}

                {/* Price */}
                <div className="flex items-baseline gap-3">
                  <span
                    className="text-4xl font-bold"
                    style={{ color: colors.primary ?? colors.accent }}
                  >
                    {(product.final_price || product.price_sar).toFixed(0)}
                  </span>
                  <span className="text-lg" style={{ color: textMuted }}>
                    ريال
                  </span>
                  {product.discount_percentage &&
                    product.discount_percentage > 0 && (
                      <span
                        className="text-lg line-through"
                        style={{ color: textMuted }}
                      >
                        {product.price_sar.toFixed(0)} ريال
                      </span>
                    )}
                </div>
              </div>
            </DialogHeader>

            {/* أزرار التبويب — أزرار عادية بلون الثيم مباشرة */}
            <div>
              {/* شريط الأزرار */}
              <div className="grid grid-cols-2 gap-0 overflow-hidden rounded-xl"
                style={{ border: `1.5px solid ${borderColor}` }}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab("details")}
                  className="px-4 py-3 text-sm font-semibold transition-all duration-200"
                  style={{
                    backgroundColor: activeTab === "details"
                      ? colors.primary
                      : isDark ? "hsla(20,12%,12%,0.9)" : "#f8f8f8",
                    color: activeTab === "details"
                      ? (colors.primaryText ?? "#fff")
                      : isDark ? "rgba(255,255,255,0.6)" : textMuted,
                    borderLeft: `1px solid ${borderColor}`,
                  }}
                >
                  التفاصيل
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("description")}
                  className="px-4 py-3 text-sm font-semibold transition-all duration-200"
                  style={{
                    backgroundColor: activeTab === "description"
                      ? colors.primary
                      : isDark ? "hsla(20,12%,12%,0.9)" : "#f8f8f8",
                    color: activeTab === "description"
                      ? (colors.primaryText ?? "#fff")
                      : isDark ? "rgba(255,255,255,0.6)" : textMuted,
                  }}
                >
                  الوصف
                </button>
              </div>

              {/* محتوى التفاصيل */}
              {activeTab === "details" && (
              <div
                className="space-y-4 mt-4 p-4 rounded-lg min-h-[120px]"
                dir="rtl"
                style={{
                  background: isDark ? cardBg : "#ffffff",
                  border: `1px solid ${borderColor}`,
                }}
              >
                <div className="flex items-center gap-2 text-sm flex-wrap">
                  <Package
                    className="h-5 w-5 shrink-0"
                    style={{ color: colors.accent }}
                  />
                  <span style={{ color: textMuted }}>الفئة:</span>
                  <UnifiedBadge variant="outline">
                    {product.category || "—"}
                  </UnifiedBadge>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-5 w-5 text-success shrink-0" />
                  <span style={{ color: textMuted }}>
                    {product.stock > 0
                      ? `متوفر: ${product.stock} قطعة`
                      : "نفد المخزون"}
                  </span>
                </div>
                {product.variants &&
                  product.variants.length > 0 &&
                  (() => {
                    const sizeToSym: Record<string, string> = {
                      xs: "XS",
                      s: "S",
                      m: "M",
                      l: "L",
                      xl: "XL",
                      xxl: "XXL",
                      صغير: "S",
                      مديم: "M",
                      مدیم: "M",
                      كبير: "L",
                      متوسط: "M",
                      small: "S",
                      medium: "M",
                      large: "L",
                    };
                    const toSym = (s: string) =>
                      sizeToSym[s?.trim().toLowerCase()] ??
                      sizeToSym[s?.trim()] ??
                      s;
                    const colorToHex: Record<string, string> = {
                      ...defaultColorHex,
                    };
                    (product.variants as any[]).forEach((v: any) => {
                      if (v.color && v.color_code)
                        colorToHex[v.color] = v.color_code;
                    });
                    const sizes = [
                      ...new Set(
                        (product.variants as any[])
                          .map((v: any) => v.size)
                          .filter(Boolean),
                      ),
                    ] as string[];
                    const colorsList = [
                      ...new Set(
                        (product.variants as any[])
                          .map((v: any) => v.color)
                          .filter(Boolean),
                      ),
                    ] as string[];
                    if (sizes.length > 0 || colorsList.length > 0) {
                      return (
                        <div
                          className="space-y-2 pt-2 border-t"
                          style={{ borderColor }}
                        >
                          {colorsList.length > 0 && (
                            <div className="flex items-center gap-2 text-sm flex-wrap">
                              <span style={{ color: textMuted }}>
                                الألوان المتاحة:
                              </span>
                              <div className="flex flex-wrap gap-2 items-center">
                                {colorsList.map((colorName) => {
                                  const hex = colorToHex[colorName] ?? "#888";
                                  const isLight =
                                    hex === "#ffffff" ||
                                    hex === "#f5f5dc" ||
                                    hex.toLowerCase() === "#fff";
                                  return (
                                    <span
                                      key={colorName}
                                      title={colorName}
                                      className="w-6 h-6 rounded-full shrink-0 border-2"
                                      style={{
                                        backgroundColor: hex,
                                        borderColor: isLight
                                          ? "rgba(0,0,0,0.2)"
                                          : "rgba(255,255,255,0.25)",
                                      }}
                                      aria-label={colorName}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          {sizes.length > 0 && (
                            <div className="flex items-center gap-2 text-sm flex-wrap">
                              <span style={{ color: textMuted }}>
                                المقاسات المتاحة:
                              </span>
                              <span
                                className="font-medium"
                                style={{ color: textPrimary }}
                              >
                                {sizes.map(toSym).join(", ")}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })()}
                {product.description && product.description.trim() && (
                  <div className="pt-2 border-t" style={{ borderColor }}>
                    <p
                      className="text-sm leading-relaxed text-right"
                      style={{ color: textMuted }}
                    >
                      {product.description.trim().slice(0, 300)}
                      {product.description.length > 300 ? "..." : ""}
                    </p>
                  </div>
                )}
              </div>
              )}

              {/* محتوى الوصف */}
              {activeTab === "description" && (
              <div
                className="space-y-4 mt-4 p-4 rounded-lg min-h-[120px]"
                style={{
                  background: isDark ? cardBg : "#ffffff",
                  border: `1px solid ${borderColor}`,
                }}
              >
                {product.description && product.description.trim() ? (
                  <p
                    className="leading-relaxed text-right whitespace-pre-line"
                    style={{ color: textMuted }}
                  >
                    {product.description}
                  </p>
                ) : (
                  <p className="text-right" style={{ color: textMuted }}>
                    لا يوجد وصف للمنتج.
                  </p>
                )}
              </div>
              )}
            </div>

            {product.variants && product.variants.length > 0 && (
              <div className="space-y-3">
                <h4
                  className="font-semibold text-right"
                  style={{ color: colors.primary ?? colors.accent }}
                >
                  اختر المواصفات:
                </h4>
                <ProductVariantSelector
                  variants={product.variants}
                  onVariantChange={(variant) =>
                    onVariantChange(variant?.id || null)
                  }
                  colorAsCircles
                  sizeAsSymbols
                  labelColor={textPrimary}
                  accentColor={colors.primary ?? colors.accent}
                  summaryBg={isDark ? "hsla(20,12%,12%,0.8)" : "#ffffff"}
                  summaryTextColor={textMuted}
                  hideStockInSummary
                />
                {variantError && (
                  <p className="text-sm text-destructive text-right">
                    {variantError}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-3 pt-4 border-t" style={{ borderColor }}>
              <UnifiedButton
                onClick={onAddToCart}
                disabled={product.stock === 0}
                variant="hero"
                className="w-full h-12 text-lg shadow-lg"
                size="lg"
                style={{
                  background: colors.primaryGradient || colors.primary,
                  color: colors.primaryText || "#fff",
                }}
              >
                <ShoppingCart className="h-5 w-5 ml-2" />
                {product.stock === 0 ? "نفد المخزون" : "أضف للسلة"}
              </UnifiedButton>

              <div className="grid grid-cols-2 gap-3">
                <UnifiedButton
                  variant="outline"
                  onClick={() => onToggleWishlist(product.id)}
                  className={`h-12 ${isInWishlist ? "bg-destructive/10 text-destructive border-destructive" : ""}`}
                  style={
                    isInWishlist
                      ? undefined
                      : { borderColor, color: colors.primary ?? colors.accent }
                  }
                >
                  <Heart
                    className={`h-5 w-5 ml-2 ${isInWishlist ? "fill-current" : ""}`}
                  />
                  {isInWishlist ? "مضاف للمفضلة" : "أضف للمفضلة"}
                </UnifiedButton>

                <UnifiedButton
                  variant="outline"
                  onClick={handleShare}
                  className="h-12"
                  style={{ borderColor, color: colors.primary ?? colors.accent }}
                >
                  <Share2 className="h-5 w-5 ml-2" />
                  مشاركة
                </UnifiedButton>
              </div>
            </div>

            {/* Reviews */}
            {customerId && (
              <div className="pt-6 border-t" style={{ borderColor }}>
                <ReviewsSection
                  productId={product.id}
                  currentUserId={customerId}
                />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
