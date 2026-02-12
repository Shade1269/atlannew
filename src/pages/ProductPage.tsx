import React, { useState } from "react";
import { useParams, useOutletContext, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Star,
  Heart,
  ShoppingBag,
  Share2,
  ChevronLeft,
} from "lucide-react";
import { useLuxuryTheme } from "@/components/storefront/luxury/LuxuryThemeContext";
import { ProductVariantSelector } from "@/components/products/ProductVariantSelector";
import type { ProductVariant } from "@/components/products/ProductVariantSelector";
import { Button } from "@/components/ui/button";
import { useIsolatedStoreCart } from "@/hooks/useIsolatedStoreCart";
import { useLanguage } from "@/contexts/LanguageContext";
import styles from "./ProductPage.module.css";

interface Store {
  id: string;
  store_name: string;
  store_slug: string;
}

export default function ProductPage() {
  const { productId, storeSlug } = useParams<{ productId: string; storeSlug: string }>();
  const { store } = useOutletContext<{ store: Store }>();
  const navigate = useNavigate();
  const { colors, isDark } = useLuxuryTheme();
  const { language } = useLanguage();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);

  const { addToCart } = useIsolatedStoreCart(store?.id ?? "", storeSlug ?? "");

  const { data: productData, isLoading, error } = useQuery({
    queryKey: ["store-product", store?.id, productId],
    queryFn: async () => {
      if (!store?.id || !productId) return null;
      const { data: ap, error: apErr } = await supabase
        .from("affiliate_products")
        .select(
          `
          product_id,
          custom_price_sar,
          products (
            id,
            title,
            description,
            price_sar,
            image_urls,
            category,
            stock,
            product_variants (
              id,
              color,
              size,
              current_stock,
              available_stock,
              selling_price
            )
          )
        `
        )
        .eq("affiliate_store_id", store.id)
        .eq("product_id", productId)
        .eq("is_visible", true)
        .maybeSingle();
      if (apErr) throw apErr;
      const product = (ap as any)?.products;
      if (!product?.id) return null;
      const customPrice = (ap as any)?.custom_price_sar;
      let variantsRaw = product.product_variants || [];
      if (variantsRaw.length === 0) {
        const { data: vRows } = await supabase
          .from("product_variants")
          .select("id, color, size, current_stock, available_stock, selling_price")
          .eq("product_id", product.id);
        variantsRaw = vRows || [];
      }
      const variants: ProductVariant[] = variantsRaw.map((v: any) => ({
        id: v.id,
        color: v.color,
        size: v.size,
        color_code: v.color_code ?? null,
        available_stock: v.available_stock ?? v.current_stock ?? 0,
        selling_price: v.selling_price ?? product.price_sar,
      }));
      return {
        id: product.id,
        title: product.title,
        description: product.description,
        price_sar: product.price_sar,
        final_price: customPrice ?? product.price_sar,
        image_urls: product.image_urls || [],
        category: product.category,
        stock: product.stock ?? 0,
        variants,
      };
    },
    enabled: !!store?.id && !!productId,
  });

  const images = productData?.image_urls?.length
    ? productData.image_urls
    : ["https://placehold.co/600x800?text=صورة+المنتج"];
  const displayPrice = selectedVariant?.selling_price ?? productData?.final_price ?? productData?.price_sar ?? 0;
  const displayStock = selectedVariant != null ? selectedVariant.available_stock : productData?.stock ?? 0;

  const pageBg = isDark ? "hsl(20, 14%, 4%)" : "#ffffff";
  const textPrimary = isDark ? "#ffffff" : colors.text;
  const textSecondary = isDark ? colors.accent : colors.textSecondary;
  const textMuted = isDark ? colors.accent : colors.textMuted;
  const cardBg = isDark ? "hsl(20, 12%, 8%)" : colors.backgroundCard;
  const borderColor = isDark ? "hsla(40, 30%, 40%, 0.25)" : colors.border;

  const handleAddToCart = () => {
    if (!productData) return;
    const selectedVariants: Record<string, string> = {};
    if (selectedVariant?.size) selectedVariants.size = selectedVariant.size;
    if (selectedVariant?.color) selectedVariants.color = selectedVariant.color;
    addToCart(
      productData.id,
      quantity,
      displayPrice,
      productData.title,
      Object.keys(selectedVariants).length ? selectedVariants : undefined
    );
  };

  if (isLoading || !store) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (error || !productData) {
    return (
      <div className={styles.container}>
        <p>{language === "ar" ? "المنتج غير متوفر." : "Product not available."}</p>
        <Button variant="outline" onClick={() => navigate(`/${storeSlug}`)}>
          {language === "ar" ? "العودة للمتجر" : "Back to store"}
        </Button>
      </div>
    );
  }

  return (
    <div
      className={styles.page}
      dir="rtl"
    >
      <div className="container mx-auto px-4 md:px-6">
        <nav className={styles.nav}>
          <Link to={`/${storeSlug}`} className={styles.navLink}>
            {language === "ar" ? "المتجر" : "Store"}
          </Link>
          <ChevronLeft className="w-4 h-4" />
          <span>{productData.category || ""}</span>
          <ChevronLeft className="w-4 h-4" />
          <span className="line-clamp-1">{productData.title}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8 md:gap-12">
          {/* معرض الصور */}
          <div className={styles.imageGallery}>
            <motion.div
              className={styles.imageLarge}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImageIndex}
                  src={images[currentImageIndex]}
                  alt={productData.title}
                  className="w-full h-full object-cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />
              </AnimatePresence>
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label={language === "ar" ? "الصورة السابقة" : "Previous image"}
                    onClick={() => setCurrentImageIndex((i) => (i - 1 + images.length) % images.length)}
                    className={`${styles.imageButton} ${styles.imageButtonPrev}`}
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                  <button
                    type="button"
                    aria-label={language === "ar" ? "الصورة التالية" : "Next image"}
                    onClick={() => setCurrentImageIndex((i) => (i + 1) % images.length)}
                    className={`${styles.imageButton} ${styles.imageButtonNext}`}
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                </>
              )}
            </motion.div>
            {images.length > 1 && (
              <div className={styles.imageThumbnails}>
                {images.map((src: string, i: number) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={language === "ar" ? `صورة ${i + 1}` : `Image ${i + 1}`}
                    onClick={() => setCurrentImageIndex(i)}
                    className={`${styles.imageThumbnail} ${currentImageIndex === i ? styles.imageThumbnailActive : ''}`}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* التفاصيل */}
          <div className={styles.details}>
            <div className={styles.productHeader}>
              <p className={styles.category}>
                {productData.category || ""}
              </p>
              <h1
                className={styles.title}
              >
                {productData.title}
              </h1>
            </div>

            <div className={styles.priceContainer}>
              <span className={styles.price}>
                {displayPrice.toLocaleString()} ر.س
              </span>
              {productData.price_sar > displayPrice && (
                <span className={styles.originalPrice}>
                  {productData.price_sar.toLocaleString()} ر.س
                </span>
              )}
            </div>

            {/* وصف المنتج */}
            {productData.description && (
              <div className={styles.descriptionBox}>
                <h3 className={styles.descriptionTitle}>
                  {language === "ar" ? "وصف المنتج" : "Product description"}
                </h3>
                <p className={styles.descriptionText}>
                  {productData.description}
                </p>
              </div>
            )}

            {/* الألوان والمقاسات — نعرض القسم دائماً مع توضيح إن لم توجد متغيرات */}
            <div className={styles.variantSection}>
              <h3 className={styles.variantTitle}>
                {language === "ar" ? "اللون والمقاس" : "Color & size"}
              </h3>
              {productData.variants && productData.variants.length > 0 ? (
                <ProductVariantSelector
                  variants={productData.variants}
                  onVariantChange={setSelectedVariant}
                  colorAsCircles
                  labelColor={textPrimary}
                  summaryBg={isDark ? "hsla(20,12%,12%,0.8)" : undefined}
                  summaryTextColor={textSecondary}
                />
              ) : (
                <p className={styles.variantEmpty} style={{ color: textMuted }}>
                  {language === "ar" ? "لا توجد خيارات لون أو مقاس لهذا المنتج." : "No color or size options for this product."}
                </p>
              )}
            </div>

            <div className={styles.quantitySection}>
              <label className={styles.quantityLabel}>
                {language === "ar" ? "الكمية" : "Quantity"}
              </label>
              <div className={styles.quantityControls}>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  -
                </Button>
                <span className={styles.quantityInput}>{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity((q) => q + 1)}
                >
                  +
                </Button>
              </div>
            </div>

            <div className={styles.actionButtons}>
              <Button
                className={styles.addToCartButton}
                onClick={handleAddToCart}
                disabled={displayStock === 0}
              >
                <ShoppingBag className="w-5 h-5 ml-2" />
                {displayStock === 0
                  ? (language === "ar" ? "نفد المخزون" : "Out of stock")
                  : (language === "ar" ? "أضف للسلة" : "Add to cart")}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className={styles.iconButton}
              >
                <Heart className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className={styles.iconButton}
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: productData.title,
                      url: window.location.href,
                    });
                  }
                }}
              >
                <Share2 className="w-5 h-5" />
              </Button>
            </div>

            {displayStock > 0 && (
              <p className={styles.stockInfo}>
                {language === "ar" ? "متوفر في المخزون" : "In stock"}: {displayStock}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
