import React, { useMemo, useEffect } from "react";
import { useParams, useOutletContext, Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { useLuxuryTheme } from "@/components/storefront/luxury/LuxuryThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { CountdownTimer, LuxuryProductCard } from "@/components/storefront/luxury";
import { useIsolatedStoreCart } from "@/hooks/useIsolatedStoreCart";
import { StoreSubPageLayout } from "@/components/store/StoreSubPageLayout";
import { useStoreProductModal } from "@/contexts/StoreProductModalContext";

interface Store {
  id: string;
  store_name: string;
  store_slug: string;
}

interface FlashDeal {
  id: string;
  title: string;
  end_date_iso: string;
  product_ids?: string[];
  product_discounts?: Record<string, number>;
  /** حد الكمية لكل منتج (اختياري): عند الوصول إليه ينتهي العرض لهذا الصنف */
  product_quantity_limits?: Record<string, number>;
  category_id?: string;
  link?: string;
  enabled?: boolean;
}

interface Product {
  id: string;
  title: string;
  price_sar: number;
  final_price?: number;
  image_urls: string[];
  category: string;
}

export default function StoreOffersPage() {
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const { store } = useOutletContext<{ store: Store }>();
  const { hash } = useLocation();
  const { colors, isDark } = useLuxuryTheme();
  const { language } = useLanguage();
  const { addToCart } = useIsolatedStoreCart(store?.id ?? "", storeSlug ?? "");
  const { openProductModal } = useStoreProductModal();

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

  const flashDeals = useMemo((): FlashDeal[] => {
    const raw = storeSettings?.flash_deals;
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((d: any) => d && d.enabled !== false)
      .map((d: any) => ({
        id: d.id || crypto.randomUUID(),
        title: d.title || (language === "ar" ? "عرض محدود" : "Limited offer"),
        end_date_iso: d.end_date_iso || new Date(Date.now() + 86400000).toISOString(),
        product_ids: d.product_ids,
        product_discounts: (d.product_discounts && typeof d.product_discounts === "object") ? d.product_discounts : {},
        product_quantity_limits: (d.product_quantity_limits && typeof d.product_quantity_limits === "object") ? d.product_quantity_limits : {},
        category_id: d.category_id,
        link: d.link,
        enabled: d.enabled !== false,
      }));
  }, [storeSettings?.flash_deals, language]);

  const allProductIds = useMemo(() => {
    const ids = new Set<string>();
    flashDeals.forEach((d) => {
      if (d.product_ids?.length) d.product_ids.forEach((id) => ids.add(id));
    });
    return Array.from(ids);
  }, [flashDeals]);

  const { data: productsById = [] } = useQuery({
    queryKey: ["affiliate-store-products-by-ids", store?.id, allProductIds],
    queryFn: async () => {
      if (!store?.id || allProductIds.length === 0) return [];
      const { data: ap, error } = await supabase
        .from("affiliate_products")
        .select("product_id, custom_price_sar, products(id, title, price_sar, image_urls, category)")
        .eq("affiliate_store_id", store.id)
        .eq("is_visible", true)
        .in("product_id", allProductIds);
      if (error) throw error;
      return (ap || [])
        .filter((i: any) => i.products?.id)
        .map((i: any) => ({
          id: i.products.id,
          title: i.products.title,
          price_sar: i.products.price_sar,
          final_price: i.custom_price_sar ?? i.products.price_sar,
          image_urls: i.products.image_urls || [],
          category: i.products.category || "",
        })) as Product[];
    },
    enabled: !!store?.id && allProductIds.length > 0,
  });

  const productsMap = useMemo(() => {
    const m = new Map<string, Product>();
    productsById.forEach((p) => m.set(p.id, p));
    return m;
  }, [productsById]);

  // عند فتح الصفحة برابط يحتوي على #deal-xxx نمرّر إلى قسم ذلك العرض (بعد رسم الأقسام)
  useEffect(() => {
    if (!hash || !hash.startsWith("#deal-") || flashDeals.length === 0) return;
    const id = hash.slice(1);
    const el = document.getElementById(id);
    if (el) {
      const t = setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 250);
      return () => clearTimeout(t);
    }
  }, [hash, flashDeals.length]);

  if (!store) return null;

  const formatEndDate = (iso: string) => {
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return language === "ar" ? "—" : "—";
      return d.toLocaleDateString(language === "ar" ? "ar-SA" : "en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return language === "ar" ? "—" : "—";
    }
  };

  return (
    <StoreSubPageLayout store={store} storeSlug={storeSlug ?? ""}>
      <div className="min-h-screen" style={{ background: isDark ? 'hsl(20, 14%, 4%)' : '#ffffff', color: colors.text }}>
        <div className="container mx-auto px-4 py-8">
          {flashDeals.length === 0 ? (
          <div className="text-center py-16 rounded-xl border" style={{ borderColor: colors.border, color: isDark ? colors.accent : colors.textMuted }}>
            {language === "ar" ? "لا توجد عروض حالية." : "No offers at the moment."}
          </div>
        ) : (
          <div className="space-y-12">
            {flashDeals.map((deal, dealIndex) => {
              const dealProducts = (deal.product_ids || [])
                .map((id) => productsMap.get(id))
                .filter(Boolean) as Product[];
              const getDealPrice = (p: Product) => {
                const base = p.final_price ?? p.price_sar;
                const discount = (deal.product_discounts || {})[p.id];
                if (discount != null && discount > 0) return Math.round(base * (1 - discount / 100));
                return base;
              };
              const endDate = new Date(deal.end_date_iso);
              return (
                <motion.section
                  key={deal.id}
                  id={`deal-${dealIndex}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border overflow-hidden scroll-mt-24"
                  style={{ borderColor: colors.border, background: colors.backgroundCard }}
                >
                  {/* رأس العرض: عنوان + عدّاد محسّن مع زر تسوق الآن في الأعلى */}
                  <div className="p-6 md:p-8 border-b" style={{ borderColor: colors.border }}>
                    <h2 className="text-xl md:text-2xl font-semibold mb-4" style={{ fontFamily: "'Playfair Display', serif", color: isDark ? '#ffffff' : colors.text }}>
                      {deal.title}
                    </h2>
                    <div className="flex flex-col gap-4">
                      <div className="min-h-[140px] flex flex-col justify-center">
                        <CountdownTimer
                          targetDate={endDate}
                          variant="default"
                          noFrame
                          onComplete={() => {}}
                          topContent={
                            <Link
                              to={`/${storeSlug}`}
                              className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold text-sm mb-4"
                              style={{
                                background: colors.primaryGradient || colors.primary,
                                color: colors.primaryText || "#fff",
                                boxShadow: colors.shadowPrimary ? `0 4px 14px ${colors.shadowPrimary}` : undefined,
                              }}
                            >
                              {language === "ar" ? "تسوق الآن" : "Shop Now"}
                            </Link>
                          }
                        />
                        <p className="text-sm mt-3" style={{ color: isDark ? colors.accent : colors.textMuted }}>
                          {language === "ar" ? "ينتهي العرض في: " : "Offer ends at: "}
                          <span style={{ color: isDark ? '#ffffff' : colors.text }}>{formatEndDate(deal.end_date_iso)}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* المنتجات بكارت الصنف + إضافة للسلة + رابط التفاصيل */}
                  <div className="p-4 md:p-6">
                    {dealProducts.length === 0 ? (
                      <p className="text-sm py-6" style={{ color: isDark ? colors.accent : colors.textMuted }}>
                        {language === "ar" ? "لم تُضف منتجات لهذا العرض بعد." : "No products in this offer yet."}
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                        {dealProducts.map((product, index) => {
                          const originalPrice = product.final_price ?? product.price_sar;
                          const finalPrice = getDealPrice(product);
                          return (
                            <div key={product.id} className="min-w-0">
                            <LuxuryProductCard
                              product={{
                                id: product.id,
                                title: product.title,
                                imageUrl: product.image_urls?.[0] || "",
                                price: finalPrice,
                                originalPrice: finalPrice < originalPrice ? originalPrice : undefined,
                                category: product.category,
                                isSale: finalPrice < originalPrice,
                              }}
                              index={index}
                              compact={false}
                              onProductClick={() => openProductModal(product.id)}
                              onAddToCart={() => {
                                addToCart(product.id, 1, finalPrice, product.title);
                              }}
                            />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.section>
              );
            })}
          </div>
        )}
        </div>
      </div>
    </StoreSubPageLayout>
  );
}
