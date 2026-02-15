import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useFastAuth } from "@/hooks/useFastAuth";
import { useAffiliateStore } from "@/hooks/useAffiliateStore";
import { useDarkMode } from "@/shared/components/DarkModeProvider";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageDarkModeToggle } from "@/components/common/LanguageDarkModeToggle";
import { UnifiedButton } from "@/components/design-system";
import {
  LogIn,
  User,
  Languages,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  Store,
  ChevronDown,
  Settings,
  LayoutDashboard,
  Bell,
  HelpCircle,
  MessageCircle,
  Check,
} from "lucide-react";
import { RegistrationTypeModal } from "./RegistrationTypeModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
// CSS-based animations for better performance (removed framer-motion)

interface HomeHeaderProps {
  onNavigate?: (path: string) => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useFastAuth();
  const { store: affiliateStore } = useAffiliateStore();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { toggleLanguage, language, t } = useLanguage();
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 20);
      if (y > 80) {
        setHeaderVisible(y <= lastScrollY.current);
      } else {
        setHeaderVisible(true);
      }
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getUserDisplayName = () => {
    if (profile?.full_name) return profile.full_name;
    if (user?.email) return user.email.split("@")[0];
    return t("guest");
  };

  const getUserInitial = () => {
    const name = getUserDisplayName();
    return name.charAt(0).toUpperCase();
  };

  const getRoleName = (role?: string) => {
    switch (role) {
      case "merchant":
        return t("merchantRole");
      case "affiliate":
        return t("affiliateRole");
      case "admin":
        return t("adminRole");
      default:
        return t("userRole");
    }
  };

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-background/90 dark:bg-background/90 backdrop-blur-xl shadow-lg shadow-black/5"
            : "bg-transparent dark:bg-transparent backdrop-blur-none"
        } ${!headerVisible ? "-translate-y-full" : "translate-y-0"}`}
      >
        <div className="container mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <div
              className="flex items-center gap-3 cursor-pointer group hover:scale-[1.02] active:scale-[0.98] transition-transform"
              onClick={() => navigate("/")}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-accent rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                  <Store className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg lg:text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {t("platformName")}
                </h1>
                <p className="text-xs text-muted-foreground hidden lg:block">
                  للأزياء والموضة
                </p>
              </div>
            </div>

            {/* My Store Button for Affiliates */}
            {user && profile?.role === "affiliate" && (
              <div className="hidden lg:flex items-center">
                <UnifiedButton
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Navigate to store if exists, otherwise to setup
                    if (affiliateStore?.store_slug) {
                      window.open(`/${affiliateStore.store_slug}`, "_blank");
                    } else {
                      navigate("/affiliate/store/setup");
                    }
                  }}
                  className="gap-2"
                >
                  <Store className="w-4 h-4" />
                  {t("myStore")}
                </UnifiedButton>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Language & Dark Mode Toggle - Always visible */}
              <LanguageDarkModeToggle
                variant="icon"
                size="sm"
                showInMobile={true}
              />

              {/* User Menu or Login */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/50 transition-all group hover:scale-[1.02] active:scale-[0.98]">
                      <Avatar className="h-8 w-8 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                        <AvatarImage src={profile?.avatar_url ?? undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-semibold">
                          {getUserInitial()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden lg:flex flex-col items-start">
                        <span className="text-sm font-medium text-foreground">
                          {getUserDisplayName()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {getRoleName(profile?.role)}
                        </span>
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground hidden lg:block" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 p-2">
                    <DropdownMenuLabel className="p-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={profile?.avatar_url ?? undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                            {getUserInitial()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">
                            {t("welcome")}
                          </span>
                          <span className="text-sm font-semibold">
                            {getUserDisplayName()}
                          </span>
                          <Badge
                            variant="secondary"
                            className="w-fit mt-1 text-xs"
                          >
                            {getRoleName(profile?.role)}
                          </Badge>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    {profile?.role === "affiliate" && (
                      <DropdownMenuItem
                        onClick={() => {
                          if (affiliateStore?.store_slug) {
                            window.open(
                              `/${affiliateStore.store_slug}`,
                              "_blank",
                            );
                          } else {
                            navigate("/affiliate/store/setup");
                          }
                        }}
                        className="cursor-pointer"
                      >
                        <Store className="ml-2 h-4 w-4" />
                        {t("myStore")}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        if (profile?.role === "admin")
                          navigate("/admin/dashboard");
                        else if (profile?.role === "affiliate")
                          navigate("/affiliate");
                        else if (profile?.role === "merchant")
                          navigate("/merchant");
                        else navigate("/");
                      }}
                      className="cursor-pointer"
                    >
                      <LayoutDashboard className="ml-2 h-4 w-4" />
                      {t("dashboard")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate("/profile")}
                      className="cursor-pointer"
                    >
                      <User className="ml-2 h-4 w-4" />
                      {t("profile")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate("/settings")}
                      className="cursor-pointer"
                    >
                      <Settings className="ml-2 h-4 w-4" />
                      {t("settings")}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      <Bell className="ml-2 h-4 w-4" />
                      {t("notifications")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate("/atlantis/chat")}
                      className="cursor-pointer"
                    >
                      <MessageCircle className="ml-2 h-4 w-4" />
                      {t("chat")}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      <HelpCircle className="ml-2 h-4 w-4" />
                      {t("help")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                      <LogOut className="ml-2 h-4 w-4" />
                      {t("signOut")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-2">
                  <UnifiedButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRegistrationModal(true)}
                    className="hidden md:flex"
                  >
                    {t("register")}
                  </UnifiedButton>
                  <UnifiedButton
                    variant="primary"
                    size="sm"
                    onClick={() => navigate("/auth")}
                    className="gap-2"
                  >
                    <LogIn className="h-4 w-4" />
                    <span className="hidden md:inline">{t("login")}</span>
                    <span className="md:hidden">{t("signIn")}</span>
                  </UnifiedButton>
                </div>
              )}

              {/* Mobile Menu Button */}
              <UnifiedButton
                variant="ghost"
                size="icon-sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden"
                aria-label={mobileMenuOpen ? t("closeMenu") : t("openMenu")}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Menu className="h-5 w-5" aria-hidden="true" />
                )}
              </UnifiedButton>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-border py-4 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Language Toggle - Mobile */}
              <div className="w-full">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-full flex items-center justify-between gap-3 text-right px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors">
                      <div className="flex items-center gap-3">
                        <Languages className="w-4 h-4" />
                        <span>{t("toggleLanguage")}</span>
                      </div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        {language === "ar" ? "🇸🇦" : "🇺🇸"}{" "}
                        {language === "ar" ? "العربية" : "English"}
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[150px]">
                    <div className="px-2 py-1.5 text-xs text-muted-foreground border-b">
                      {t("language")}
                    </div>
                    <DropdownMenuItem
                      onClick={() => {
                        if (language !== "ar") {
                          toggleLanguage();
                        }
                        setMobileMenuOpen(false);
                      }}
                      className="cursor-pointer flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <span>🇸🇦</span>
                        <span>العربية</span>
                      </span>
                      {language === "ar" && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        if (language !== "en") {
                          toggleLanguage();
                        }
                        setMobileMenuOpen(false);
                      }}
                      className="cursor-pointer flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <span>🇺🇸</span>
                        <span>English</span>
                      </span>
                      {language === "en" && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Dark Mode Toggle - Mobile */}
              <button
                onClick={() => {
                  toggleDarkMode();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-between gap-3 text-right px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isDarkMode ? (
                    <Sun className="w-4 h-4" />
                  ) : (
                    <Moon className="w-4 h-4" />
                  )}
                  <span>{isDarkMode ? t("lightMode") : t("darkMode")}</span>
                </div>
              </button>

              {/* Divider */}
              <div className="my-2 border-t border-border" />

              {user && profile?.role === "affiliate" && (
                <button
                  onClick={() => {
                    if (affiliateStore?.store_slug) {
                      window.open(`/${affiliateStore.store_slug}`, "_blank");
                    } else {
                      navigate("/affiliate/store/setup");
                    }
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 text-right px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  <Store className="w-4 h-4" />
                  {t("myStore")}
                </button>
              )}
              {!user && (
                <>
                  <button
                    onClick={() => {
                      setShowRegistrationModal(true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-right px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    {t("register")}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Registration Type Modal */}
      <RegistrationTypeModal
        open={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        onSelectType={(type) => {
          setShowRegistrationModal(false);
          navigate("/auth", { state: { registrationType: type } });
        }}
      />
    </>
  );
};
