import React from "react";
import { motion } from "framer-motion";
import {
  MessageCircle,
  Package,
  Users,
  Store,
  ExternalLink,
  AlertCircle,
  Crown,
} from "lucide-react";
import { HomeFeatureCard } from "@/components/home";
import { UnifiedButton } from "@/components/design-system";

interface HomeFeatureGridProps {
  userRole?: string;
  affiliateStore?: any;
  affiliateStoreLoading: boolean;
  onNavigate: (path: string) => void;
}

export const HomeFeatureGrid: React.FC<HomeFeatureGridProps> = ({
  userRole,
  affiliateStore,
  affiliateStoreLoading,
  onNavigate,
}) => {
  const isAffiliate = userRole === "affiliate" || userRole === "marketer";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
      {/* Atlantis System */}
      <HomeFeatureCard
        title="نظام أتلانتس"
        description="انضم للتحالفات، تنافس واكسب المكافآت"
        icon={Crown}
        buttonText="دخول أتلانتس"
        buttonVariant="primary"
        onClick={() => onNavigate("/atlantis")}
        badge={{ color: "premium", pulse: true }}
      >
        <div className="text-xs text-premium font-medium">
          🏆 تحالفات • نقاط • مكافآت
        </div>
      </HomeFeatureCard>

      {/* Chat Feature */}
      <HomeFeatureCard
        title="دردشة العملاء"
        description="تواصل مع فريق الدعم والعملاء في الوقت الفعلي"
        icon={MessageCircle}
        buttonText="بدء المحادثة"
        buttonVariant="primary"
        onClick={() => onNavigate("/atlantis/chat")}
        badge={{ color: "success", pulse: true }}
      />

      {/* Products Catalog */}
      <HomeFeatureCard
        title="كتالوج المنتجات"
        description="استكشف مجموعة واسعة من المنتجات المتنوعة"
        icon={Package}
        buttonText="تصفح المنتجات"
        buttonVariant="primary"
        onClick={() => onNavigate("/products")}
      >
        <div className="text-xs text-secondary font-medium">
          🔥 منتجات جديدة كل يوم
        </div>
      </HomeFeatureCard>

      {/* Store/Community Card */}
      {isAffiliate ? (
        <AffiliateStoreCard
          store={affiliateStore}
          isLoading={affiliateStoreLoading}
          onNavigate={onNavigate}
        />
      ) : (
        <CommunityCard onNavigate={onNavigate} />
      )}
    </div>
  );
};

const AffiliateStoreCard: React.FC<{
  store: any;
  isLoading: boolean;
  onNavigate: (path: string) => void;
}> = ({ store, isLoading, onNavigate }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card dark:bg-card rounded-xl border border-border p-6 hover:border-primary/50 shadow-anaqati hover:shadow-anaqati-hover transition-all duration-300"
    >
      {/* Icon */}
      <div className="w-14 h-14 rounded-xl bg-secondary/20 flex items-center justify-center mb-5">
        <Store className="w-7 h-7 text-secondary" />
      </div>

      <h3 className="text-xl font-semibold text-foreground mb-2">
        متجري الإلكتروني
      </h3>
      <p className="text-muted-foreground text-sm leading-relaxed mb-5">
        {isLoading
          ? "جاري التحميل..."
          : store
          ? "اذهب لمتجرك وشارك منتجاتك"
          : "أنشئ متجرك الإلكتروني"}
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : store ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-success bg-success/10 px-3 py-2 rounded-lg">
            <Store className="w-4 h-4" />
            <span>المتجر نشط</span>
          </div>
          <div className="flex gap-2">
            <UnifiedButton
              variant="outline"
              size="sm"
              className="flex-1 border-2 bg-transparent text-primary hover:bg-primary/15 dark:border-[hsl(24,96%,52%)] dark:text-[hsl(24,96%,52%)] dark:hover:bg-[hsl(24,96%,52%)]/20"
              onClick={() => window.open(`/${store.store_slug}`, "_blank")}
            >
              <ExternalLink className="w-4 h-4 ml-2" />
              متجري
            </UnifiedButton>
            <UnifiedButton
              variant="primary"
              size="sm"
              className="flex-1 bg-primary text-white hover:bg-primary/90 dark:bg-[hsl(24,96%,52%)] dark:text-white dark:hover:bg-[hsl(24,96%,55%)]"
              onClick={() => onNavigate("/products")}
            >
              <Package className="w-4 h-4 ml-2" />
              تصفح المنتجات
            </UnifiedButton>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-warning bg-warning/10 px-3 py-2 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            <span>لم ينشأ بعد</span>
          </div>
          <div className="flex gap-2">
            <UnifiedButton
              variant="outline"
              size="sm"
              className="flex-1 border-2 bg-transparent text-primary hover:bg-primary/15 dark:border-[hsl(24,96%,52%)] dark:text-[hsl(24,96%,52%)] dark:hover:bg-[hsl(24,96%,52%)]/20"
              onClick={() => onNavigate("/affiliate/store/setup")}
            >
              متجري
            </UnifiedButton>
            <UnifiedButton
              variant="primary"
              size="sm"
              className="flex-1 bg-primary text-white hover:bg-primary/90 dark:bg-[hsl(24,96%,52%)] dark:text-white dark:hover:bg-[hsl(24,96%,55%)]"
              onClick={() => onNavigate("/products")}
            >
              <Package className="w-4 h-4 ml-2" />
              تصفح المنتجات
            </UnifiedButton>
          </div>
        </div>
      )}
    </motion.div>
  );
};

const CommunityCard: React.FC<{ onNavigate: (path: string) => void }> = ({
  onNavigate,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card dark:bg-card rounded-xl border border-border p-6 hover:border-primary/50 shadow-anaqati hover:shadow-anaqati-hover transition-all duration-300 cursor-pointer"
      onClick={() => onNavigate("/atlantis")}
    >
      {/* Icon */}
      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
        <Users className="w-7 h-7 text-primary" />
      </div>

      <h3 className="text-xl font-semibold text-foreground mb-2">
        مجتمع أتلانتس
      </h3>
      <p className="text-muted-foreground text-sm leading-relaxed mb-5">
        انضم لمجتمع نشط من المستخدمين والتجار
      </p>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <div className="text-lg font-semibold text-foreground">7</div>
          <div className="text-xs text-muted-foreground">متاجر</div>
        </div>
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <div className="text-lg font-semibold text-foreground">4</div>
          <div className="text-xs text-muted-foreground">تجار</div>
        </div>
      </div>
    </motion.div>
  );
};

export default HomeFeatureGrid;
