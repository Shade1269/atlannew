import React, { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsolatedStoreCart } from "@/hooks/useIsolatedStoreCart";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { parseFeaturedCategories, type StoreSettings } from "@/hooks/useStoreSettings";
import {
  TwoTopAnnouncementBars,
  AnnouncementBar,
  EcommerceHeader,
  EcommerceFooter,
  MegaMenu,
  ScrollProgress,
} from "@/components/storefront/luxury";
import { useLuxuryTheme } from "@/components/storefront/luxury/LuxuryThemeContext";
import { ModernShoppingCart } from "@/components/storefront/modern/ModernShoppingCart";
import { CustomerAuthModal } from "@/components/storefront/CustomerAuthModal";
import { useWishlist, useCompare } from "@/features/storefront";

export interface StoreSubPageLayoutStore {
  id: string;
  store_name: string;
  store_slug: string;
  logo_url?: string | null;
}

interface StoreSubPageLayoutProps {
  store: StoreSubPageLayoutStore;
  storeSlug: string;
  children: React.ReactNode;
  /** عنوان الصفحة (مثل "العروض" أو "عرض الكل") - اختياري */
  pageTitle?: string;
}

export function StoreSubPageLayout({
  store,
  storeSlug,
  children,
  pageTitle: _pageTitle,
}: StoreSubPageLayoutProps) {
  const navigate = useNavigate();
  const { language, direction } = useLanguage();
  const [showCart, setShowCart] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { isAuthenticated } = useCustomerAuth();
  const { colors, isDark } = useLuxuryTheme();
  const {
    cart: isolatedCart,
    updateQuantity: updateCartQuantity,
    removeFromCart: removeFromCart,
  } = useIsolatedStoreCart(store.id, storeSlug);
  const { getWishlistProductIds } = useWishlist(store.id);
  const { compareList } = useCompare(store.id);
  const wishlist = getWishlistProductIds();

  const { data: storeSettings } = useQuery({
    queryKey: ["affiliate-store-settings", store.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_store_settings")
        .select("*")
        .eq("store_id", store.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error && error.code !== "PGRST116") throw error;
      return data as StoreSettings | null;
    },
    enabled: !!store.id,
  });

  const bars = useMemo(() => {
    const raw = storeSettings
      ? (storeSettings.top_announcement_bars ?? (storeSettings as any).topAnnouncementBars)
      : null;
    let list: any[] = [];
    if (raw != null) {
      if (typeof raw === "string") {
        try {
          list = JSON.parse(raw);
        } catch {
          list = [];
        }
      } else if (Array.isArray(raw)) {
        list = raw;
      } else if (typeof raw === "object" && raw !== null) {
        list = Object.values(raw);
      }
    }
    const defaultBars = [
      { visible: true, lines: [{ id: "1", text: "", visible: true }], bg_color: "#dc2626", text_color: "#ffffff" },
      { visible: true, lines: [{ id: "1", text: "", visible: true }], bg_color: "#2563eb", text_color: "#ffffff" },
    ];
    return Array.isArray(list) && list.length > 0 ? list : defaultBars;
  }, [storeSettings]);

  const announcements = useMemo(() => {
    if (
      storeSettings?.announcements &&
      Array.isArray(storeSettings.announcements) &&
      (storeSettings.announcements as any[]).length > 0
    ) {
      return (storeSettings.announcements as any[]).map((ann: any, idx: number) => ({
        id: String(idx + 1),
        text: ann.text || "",
        icon: ["gift", "truck", "clock", "percent"].includes(ann.icon)
          ? ann.icon
          : undefined,
        highlight: ann.highlight || false,
      }));
    }
    return [];
  }, [storeSettings?.announcements]);

  const featuredCategories = useMemo(
    () => parseFeaturedCategories(storeSettings?.featured_categories),
    [storeSettings?.featured_categories]
  );

  const megaMenuCategories = useMemo(
    () =>
      featuredCategories
        .filter((c) => c.isActive !== false)
        .map((cat, idx) => ({
          id: cat.id || `cat-${idx}`,
          name: cat.name,
          href: "#",
          subcategories: [],
        })),
    [featuredCategories]
  );

  const cartTotal = isolatedCart?.total ?? 0;
  const pageBg = isDark ? "hsl(20, 14%, 4%)" : "#ffffff";

  return (
    <div
      className="min-h-screen"
      style={{ background: pageBg, color: colors.text }}
    >
      <ScrollProgress />
      {/* الشريطان العلويان */}
      <TwoTopAnnouncementBars bars={bars} dir={direction} />

      {announcements.length > 0 && (
        <AnnouncementBar
          announcements={announcements}
          autoRotate
          rotateInterval={4000}
        />
      )}

      {/* الهيدر بأيقوناته */}
      <EcommerceHeader
        storeName={store.store_name}
        logoUrl={store.logo_url ?? undefined}
        cartCount={isolatedCart?.items?.length ?? 0}
        wishlistCount={wishlist.length}
        compareCount={compareList.length}
        isAuthenticated={!!isAuthenticated}
        onCartClick={() => setShowCart(true)}
        onLogoClick={() => navigate(`/${storeSlug}`)}
        onAdvancedSearchClick={() => {}}
        onCompareClick={() => {}}
        onLoyaltyClick={() => {}}
        onOrdersClick={() => setShowOrders(true)}
        onAccountClick={() => !isAuthenticated && setShowAuthModal(true)}
        onViewModeChange={(m) => setViewMode(m)}
        viewMode={viewMode}
        onSearchChange={(q) => setSearchQuery(q)}
        searchQuery={searchQuery}
        headerConfig={(storeSettings?.header_config as any) ?? undefined}
      />

      {megaMenuCategories.length > 0 && (
        <MegaMenu
          categories={megaMenuCategories}
          onCategoryClick={(href) => {
            const name = megaMenuCategories.find((c) => c.href === href)?.name;
            if (name) navigate(`/${storeSlug}/shop?category=${encodeURIComponent(name)}`);
          }}
          onProductClick={() => {}}
        />
      )}

      {/* المحتوى الداخلي مع زر العودة صغير في أعلى الصفحة */}
      <main className="container mx-auto px-4 pt-2">
        <Link
          to={`/${storeSlug}`}
          className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-opacity hover:opacity-90 mb-4"
          style={{
            borderColor: isDark ? colors.accent : "var(--luxury-accent, #b45309)",
            color: isDark ? colors.accent : "var(--luxury-accent, #b45309)",
            background: "transparent",
          }}
        >
          <span aria-hidden>←</span>
          {language === "ar" ? "العودة للمتجر" : "Back to store"}
        </Link>
        {children}
      </main>

      {/* الفوتر */}
      <EcommerceFooter
        storeName={store.store_name}
        logoUrl={store.logo_url ?? undefined}
        settings={
          storeSettings
            ? {
                footer_phone: (storeSettings as any).footer_phone,
                footer_address: (storeSettings as any).footer_address,
                footer_description: (storeSettings as any).footer_description,
                store_email: storeSettings.store_email,
                whatsapp_number: storeSettings.whatsapp_number,
                social_links: storeSettings.social_links as any,
              }
            : null
        }
      />

      <ModernShoppingCart
        open={showCart}
        onClose={() => setShowCart(false)}
        items={isolatedCart?.items ?? []}
        total={cartTotal}
        onUpdateQuantity={updateCartQuantity}
        onRemoveItem={removeFromCart}
        onCheckout={() => {
          setShowCart(false);
          navigate(`/${storeSlug}/checkout`);
        }}
      />

      <CustomerAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        storeId={store.id}
        storeSlug={storeSlug}
        storeName={store.store_name}
      />

      {showOrders && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowOrders(false)}
        >
          <div
            className="bg-background rounded-lg p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm text-muted-foreground mb-4">
              {language === "ar" ? "طلباتي" : "My orders"}
            </p>
            <button
              type="button"
              onClick={() => {
                setShowOrders(false);
                navigate(`/${storeSlug}/orders`);
              }}
              className="text-primary underline"
            >
              {language === "ar" ? "فتح صفحة الطلبات" : "Open orders page"}
            </button>
            <button
              type="button"
              onClick={() => setShowOrders(false)}
              className="ml-4 text-muted-foreground"
            >
              {language === "ar" ? "إغلاق" : "Close"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
