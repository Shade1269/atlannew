import React, { useMemo, useState } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
import { useLuxuryTheme } from "@/components/storefront/luxury/LuxuryThemeContext";
import { LuxuryProductCard } from "@/components/storefront/luxury";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { parseFeaturedCategories } from "@/hooks/useStoreSettings";
import { StoreSubPageLayout } from "@/components/store/StoreSubPageLayout";
import { useIsolatedStoreCart } from "@/hooks/useIsolatedStoreCart";
import { useStoreProductModal } from "@/contexts/StoreProductModalContext";

interface Store {
  id: string;
  store_name: string;
  store_slug: string;
}

interface Product {
  id: string;
  title: string;
  price_sar: number;
  final_price?: number;
  image_urls: string[];
  category: string;
  average_rating?: number;
  total_reviews?: number;
}

const SORT_OPTIONS = [
  { value: "newest", labelAr: "الأحدث", labelEn: "Newest" },
  { value: "price-low", labelAr: "السعر: من الأقل", labelEn: "Price: Low to High" },
  { value: "price-high", labelAr: "السعر: من الأعلى", labelEn: "Price: High to Low" },
  { value: "name", labelAr: "الاسم", labelEn: "Name" },
  { value: "rating", labelAr: "التقييم", labelEn: "Rating" },
];

export default function StoreShopPage() {
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const { store } = useOutletContext<{ store: Store }>();
  const { colors, isDark } = useLuxuryTheme();
  const { language } = useLanguage();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priceMin, setPriceMin] = useState<number>(0);
  const [priceMax, setPriceMax] = useState<number>(5000);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const { addToCart } = useIsolatedStoreCart(store?.id ?? "", storeSlug ?? "");
  const { openProductModal } = useStoreProductModal();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["affiliate-store-products", store?.id],
    queryFn: async () => {
      if (!store?.id) return [];
      const { data: affiliateProducts, error } = await supabase
        .from("affiliate_products")
        .select("product_id, custom_price_sar, products(id, title, price_sar, image_urls, category)")
        .eq("affiliate_store_id", store.id)
        .eq("is_visible", true);
      if (error) throw error;
      return (affiliateProducts || [])
        .filter((i: any) => i.products?.id)
        .map((i: any) => ({
          id: i.products.id,
          title: i.products.title,
          price_sar: i.products.price_sar,
          final_price: i.custom_price_sar || i.products.price_sar,
          image_urls: i.products.image_urls || [],
          category: i.products.category || "",
          average_rating: 0,
          total_reviews: 0,
        })) as Product[];
    },
    enabled: !!store?.id,
  });

  const { data: storeSettings } = useQuery({
    queryKey: ["affiliate-store-settings", store?.id],
    queryFn: async () => {
      if (!store?.id) return null;
      const { data, error } = await supabase
        .from("affiliate_store_settings")
        .select("*")
        .eq("store_id", store.id)
        .maybeSingle();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!store?.id,
  });

  const categories = useMemo(() => {
    const fromFeatured = parseFeaturedCategories(storeSettings?.featured_categories);
    const fromProducts = Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[];
    const names = new Set(fromFeatured.map((c) => c.name));
    fromProducts.forEach((n) => names.add(n));
    return Array.from(names).sort();
  }, [storeSettings?.featured_categories, products]);

  const filteredAndSorted = useMemo(() => {
    let list = products.filter((p) => {
      const price = p.final_price ?? p.price_sar;
      const matchCat = categoryFilter === "all" || p.category === categoryFilter;
      const matchPrice = price >= priceMin && price <= priceMax;
      const matchSearch =
        !searchQuery ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchPrice && matchSearch;
    });
    const sort = sortBy;
    list = [...list].sort((a, b) => {
      const pa = a.final_price ?? a.price_sar;
      const pb = b.final_price ?? b.price_sar;
      if (sort === "price-low") return pa - pb;
      if (sort === "price-high") return pb - pa;
      if (sort === "name") return a.title.localeCompare(b.title);
      if (sort === "rating") return (b.average_rating ?? 0) - (a.average_rating ?? 0);
      return 0;
    });
    return list;
  }, [products, categoryFilter, priceMin, priceMax, searchQuery, sortBy]);

  if (!store) return null;

  return (
    <StoreSubPageLayout store={store} storeSlug={storeSlug ?? ""} pageTitle={language === "ar" ? "عرض الكل" : "Shop All"}>
      <div className="min-h-screen" style={{ background: isDark ? 'hsl(20, 14%, 4%)' : '#ffffff', color: colors.text }}>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-8" style={{ fontFamily: "'Playfair Display', serif", color: isDark ? '#ffffff' : colors.text }}>
            {language === "ar" ? "عرض الكل" : "Shop All"}
          </h1>

          {/* فلترة حسب بيانات الصفحة */}
          <div className="mb-8 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder={language === "ar" ? "بحث..." : "Search..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 min-w-[200px] rounded-lg border px-4 py-2 text-sm"
              style={{
                background: colors.backgroundInput,
                borderColor: colors.border,
                color: colors.text,
              }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              style={{ borderColor: colors.border, color: colors.text }}
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              {language === "ar" ? "فلاتر" : "Filters"}
            </Button>
            <select
              aria-label={language === "ar" ? "ترتيب النتائج" : "Sort results"}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm"
              style={{
                background: colors.backgroundInput,
                borderColor: colors.border,
                color: colors.text,
              }}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {language === "ar" ? o.labelAr : o.labelEn}
                </option>
              ))}
            </select>
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="rounded-xl border p-4 flex flex-wrap gap-6"
              style={{ borderColor: colors.border, background: colors.backgroundCard }}
            >
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: isDark ? colors.accent : colors.textMuted }}>
                  {language === "ar" ? "الفئة" : "Category"}
                </label>
                <select
                  aria-label={language === "ar" ? "الفئة" : "Category"}
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="rounded-lg border px-3 py-2 text-sm min-w-[160px]"
                  style={{
                    background: colors.backgroundInput,
                    borderColor: colors.border,
                    color: colors.text,
                  }}
                >
                  <option value="all">{language === "ar" ? "الكل" : "All"}</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: isDark ? colors.accent : colors.textMuted }}>
                  {language === "ar" ? "السعر من (ر.س)" : "Price from (SAR)"}
                </label>
                <input
                  type="number"
                  min={0}
                  aria-label={language === "ar" ? "السعر من (ر.س)" : "Price from (SAR)"}
                  value={priceMin}
                  onChange={(e) => setPriceMin(Number(e.target.value) || 0)}
                  className="rounded-lg border px-3 py-2 text-sm w-28"
                  style={{
                    background: colors.backgroundInput,
                    borderColor: colors.border,
                    color: colors.text,
                  }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: isDark ? colors.accent : colors.textMuted }}>
                  {language === "ar" ? "السعر إلى (ر.س)" : "Price to (SAR)"}
                </label>
                <input
                  type="number"
                  min={0}
                  aria-label={language === "ar" ? "السعر إلى (ر.س)" : "Price to (SAR)"}
                  value={priceMax}
                  onChange={(e) => setPriceMax(Number(e.target.value) || 5000)}
                  className="rounded-lg border px-3 py-2 text-sm w-28"
                  style={{
                    background: colors.backgroundInput,
                    borderColor: colors.border,
                    color: colors.text,
                  }}
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCategoryFilter("all");
                  setPriceMin(0);
                  setPriceMax(5000);
                  setSearchQuery("");
                }}
                style={{ color: isDark ? colors.accent : colors.textMuted }}
              >
                <X className="w-4 h-4 mr-1" />
                {language === "ar" ? "مسح الفلاتر" : "Clear"}
              </Button>
            </motion.div>
          )}
        </div>

        <p className="text-sm mb-6" style={{ color: isDark ? colors.accent : colors.textMuted }}>
          {filteredAndSorted.length} {language === "ar" ? "منتج" : "products"}
        </p>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="aspect-[3/4] rounded-xl animate-pulse"
                style={{ background: colors.backgroundTertiary }}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {filteredAndSorted.map((product, index) => (
              <div key={product.id} className="min-w-0">
              <LuxuryProductCard
                product={{
                  id: product.id,
                  title: product.title,
                  imageUrl: product.image_urls?.[0] || "",
                  price: product.final_price ?? product.price_sar,
                  originalPrice: product.price_sar !== (product.final_price ?? product.price_sar) ? product.price_sar : undefined,
                  category: product.category,
                  rating: product.average_rating,
                  reviewCount: product.total_reviews,
                  isSale: false,
                }}
                index={index}
                compact={false}
                onProductClick={() => openProductModal(product.id)}
                onAddToCart={() => {
                  const price = product.final_price ?? product.price_sar;
                  addToCart(product.id, 1, price, product.title);
                }}
              />
              </div>
            ))}
          </div>
        )}

        {!isLoading && filteredAndSorted.length === 0 && (
          <div className="text-center py-16" style={{ color: isDark ? colors.accent : colors.textMuted }}>
            {language === "ar" ? "لا توجد منتجات تطابق الفلاتر." : "No products match the filters."}
          </div>
        )}
        </div>
      </div>
    </StoreSubPageLayout>
  );
}
