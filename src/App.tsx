import { Suspense, lazy, useEffect, memo } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { SupabaseAuthProvider } from "@/contexts/SupabaseAuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { DarkModeProvider } from "@/shared/components/DarkModeProvider";

// Lazy load layouts and components
const DomainManager = lazy(() =>
  import("@/components/store/DomainManager").then((m) => ({
    default: m.default,
  }))
);

// Lazy load pages - Only keeping essential store, payment, invoice, and tracking pages
const HomePage = lazy(() => import("./pages/Index"));
const StorefrontPage = lazy(() => import("./pages/public-storefront/StorefrontPage"));
const ProductPage = lazy(() => import("./pages/ProductPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const OrderConfirmationPage = lazy(
  () => import("./pages/OrderConfirmationSimple")
);
const PaymentCallback = lazy(() =>
  import("./pages/PaymentCallback").then((m) => ({
    default: m.PaymentCallback,
  }))
);
const StoreAuth = lazy(() => import("./pages/StoreAuth"));
const PlatformAuthPage = lazy(() => import("./pages/PlatformAuthPage"));

// Isolated Store Components
const IsolatedStoreLayout = lazy(() =>
  import("@/components/store/IsolatedStoreLayout").then((m) => ({
    default: m.IsolatedStoreLayout,
  }))
);
const IsolatedStoreCart = lazy(() =>
  import("./pages/storefront/IsolatedStoreCart").then((m) => ({
    default: m.IsolatedStoreCart,
  }))
);
const StorefrontMyOrders = lazy(
  () => import("./pages/storefront/MyOrdersPage")
);
const StoreShopPage = lazy(() => import("./pages/storefront/StoreShopPage"));
const StoreOffersPage = lazy(() => import("./pages/storefront/StoreOffersPage"));
const OrderTrackingPageV2 = lazy(
  () => import("./pages/storefront/OrderTrackingPageV2")
);
const BolesaTrackingPage = lazy(() => import("./pages/BolesaTrackingPage"));
const WishlistPage = lazy(() => import("./pages/storefront/WishlistPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      networkMode: "online",
    },
    mutations: {
      retry: 1,
      networkMode: "online",
    },
  },
});

const LoadingFallback = memo(() => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
      <p className="text-muted-foreground">جاري التحميل...</p>
    </div>
  </div>
));
LoadingFallback.displayName = "LoadingFallback";

/** عند تغيير المسار نمرّر الصفحة لأعلى حتى تبدأ كل صفحة من الأعلى — إلا إذا كان الرابط يحتوي على هاش (مثل #deal-1) لفتح قسم معيّن */
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash && hash.startsWith("#deal-")) return; // صفحة العروض ستتولى التمرير إلى القسم
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, hash]);
  return null;
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseAuthProvider>
        <LanguageProvider>
          <DarkModeProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
                            <Suspense fallback={<LoadingFallback />}>
                              <DomainManager>
                                  <Routes>
                {/* Home page */}
                                    <Route
                                      path="/"
                                      element={<HomePage />}
                                    />

                {/* Platform auth - تسجيل الدخول / إنشاء حساب (تاجر أو مسوق) - MUST come before /:storeSlug */}
                                    <Route
                                      path="/auth"
                                      element={<PlatformAuthPage />}
                                    />

                {/* Tracking routes - MUST come before /:storeSlug */}
                                    <Route
                                      path="/tracking/bolesa"
                                      element={<BolesaTrackingPage />}
                                    />

                {/* Checkout and Payment */}
                                    <Route
                                      path="/checkout"
                                      element={<CheckoutPage />}
                                    />
                                    <Route
                                      path="/order/confirmation"
                                      element={<OrderConfirmationPage />}
                                    />
                                    <Route
                                      path="/payment/callback"
                                      element={<PaymentCallback />}
                                    />

                {/* Store Routes - Unified under /:storeSlug */}
                <Route
                  path="/:storeSlug"
                  element={<IsolatedStoreLayout />}
                >
                  <Route
                    index
                    element={<StorefrontPage />}
                  />
                  <Route
                    path="shop"
                    element={<StoreShopPage />}
                  />
                  <Route
                    path="offers"
                    element={<StoreOffersPage />}
                  />
                  <Route
                    path="p/:productId"
                    element={<ProductPage />}
                  />
                                      <Route
                                        path="wishlist"
                                        element={<WishlistPage />}
                                      />
                                      <Route
                                        path="cart"
                                        element={<IsolatedStoreCart />}
                                      />
                                      <Route
                                        path="checkout"
                                        element={<CheckoutPage />}
                                      />
                                      <Route
                                        path="orders"
                                        element={<StorefrontMyOrders />}
                                      />
                                      <Route
                                        path="auth"
                                        element={<StoreAuth />}
                                      />
                                      <Route
                                        path="track/:orderId"
                                        element={<OrderTrackingPageV2 />}
                                      />
                                    </Route>

                {/* Catch all - redirect to home */}
                                    <Route
                                      path="*"
                                      element={<Navigate to="/" replace />}
                                    />
                                  </Routes>
                              </DomainManager>
                            </Suspense>
            </BrowserRouter>
          </DarkModeProvider>
        </LanguageProvider>
      </SupabaseAuthProvider>
      </QueryClientProvider>
  );
};

export default App;
