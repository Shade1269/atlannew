import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Heart, Search, Menu, X, User, Phone, Truck, Scale, Award, Package, SlidersHorizontal, Grid, List, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLuxuryTheme } from './LuxuryThemeContext';

export interface HeaderConfig {
  show_top_bar?: boolean;
  top_bar_phone?: string;
  show_search?: boolean;
  show_cart?: boolean;
  show_wishlist?: boolean;
  show_compare?: boolean;
  show_login?: boolean;
  show_view_toggle?: boolean;
  show_filter?: boolean;
  show_orders?: boolean;
  show_loyalty?: boolean;
}

interface EcommerceHeaderProps {
  storeName: string;
  logoUrl?: string;
  cartCount?: number;
  wishlistCount?: number;
  compareCount?: number;
  isAuthenticated?: boolean;
  onCartClick?: () => void;
  onWishlistClick?: () => void;
  onSearchClick?: () => void;
  onAccountClick?: () => void;
  onLogoClick?: () => void;
  onAdvancedSearchClick?: () => void;
  onCompareClick?: () => void;
  onLoyaltyClick?: () => void;
  onOrdersClick?: () => void;
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  viewMode?: 'grid' | 'list';
  onSearchChange?: (query: string) => void;
  searchQuery?: string;
  /** من إعدادات المتجر: إظهار/إخفاء أقسام الهيدر */
  headerConfig?: HeaderConfig | null;
}

const categories = [
  { name: 'الجديد', href: '#new', featured: true },
  { name: 'فساتين سهرة', href: '#evening' },
  { name: 'عبايات', href: '#abayas' },
  { name: 'فساتين زفاف', href: '#wedding' },
  { name: 'كوكتيل', href: '#cocktail' },
  { name: 'تخفيضات', href: '#sale', sale: true },
];

export const EcommerceHeader: React.FC<EcommerceHeaderProps> = ({
  storeName,
  logoUrl,
  cartCount = 0,
  wishlistCount = 0,
  compareCount = 0,
  isAuthenticated = false,
  onCartClick,
  onWishlistClick,
  onAccountClick,
  onLogoClick,
  onAdvancedSearchClick,
  onCompareClick,
  onLoyaltyClick,
  onOrdersClick,
  onViewModeChange,
  viewMode = 'grid',
  onSearchChange,
  searchQuery = '',
  headerConfig,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { colors, isDark, mode: themeMode, toggleMode: toggleThemeMode } = useLuxuryTheme();
  const headerText = isDark ? '#ffffff' : colors.text;
  const headerTextMuted = isDark ? 'rgba(255,255,255,0.85)' : colors.textMuted;
  const headerTextSecondary = isDark ? 'rgba(255,255,255,0.9)' : colors.textSecondary;
  const h = headerConfig || {};
  const topBarPhone = h.top_bar_phone?.trim() || '';
  const showTopBar = h.show_top_bar === true && topBarPhone.length > 0;
  const showSearch = h.show_search !== false;
  const showCart = h.show_cart !== false;
  const showWishlist = h.show_wishlist !== false;
  const showCompare = h.show_compare !== false;
  const showLogin = h.show_login !== false;
  const showViewToggle = h.show_view_toggle !== false;
  const showFilter = h.show_filter !== false;
  const showOrders = h.show_orders !== false;
  const showLoyalty = h.show_loyalty !== false;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Top Bar - يظهر حسب header_config.show_top_bar */}
      {/* الشريط العلوي في الهيدر — يظهر فقط عند تفعيله في الإعدادات مع رقم هاتف (لا نص ثابت من الكود) */}
      {showTopBar && (
        <div 
          className="hidden md:block py-2 transition-colors duration-500"
          style={{
            background: isDark ? 'hsl(20, 14%, 6%)' : colors.topBarBg,
            color: isDark ? '#ffffff' : colors.topBarText,
          }}
        >
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-center text-xs font-medium">
              <a href={`tel:${topBarPhone}`} className="flex items-center gap-2 hover:opacity-90">
                <Phone className="w-3.5 h-3.5" />
                {topBarPhone}
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Main Header - في الوضع الليلي خلفية داكنة ونص أبيض دائماً */}
      <motion.header
        className={cn(
          "sticky top-0 z-50 transition-all duration-300",
        )}
        style={{
          background: isDark ? 'hsl(20, 14%, 4%)' : (scrolled ? colors.headerBgScrolled : colors.headerBg),
          backdropFilter: scrolled && !isDark ? 'blur(20px)' : 'none',
          borderBottom: `1px solid ${isDark ? 'hsla(40, 30%, 40%, 0.25)' : colors.border}`,
          color: isDark ? '#ffffff' : colors.text,
        }}
      >
        <div className="container mx-auto px-4 md:px-6">
          {/* Upper Header Row */}
          <div className="flex items-center justify-between py-4 lg:py-5">
            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 -ml-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Logo */}
            <motion.div 
              className="flex items-center gap-3 cursor-pointer"
              whileHover={{ scale: 1.02 }}
              onClick={onLogoClick}
            >
              {logoUrl && (
                <img 
                  src={logoUrl} 
                  alt={storeName}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover"
                  style={{ border: `2px solid ${isDark ? 'hsla(38, 70%, 50%, 0.3)' : 'hsla(20, 70%, 40%, 0.3)'}` }}
                />
              )}
              <div className="hidden sm:block">
                <h1 
                  className="text-xl md:text-2xl tracking-wide"
                  style={{ 
                    fontFamily: "'Playfair Display', serif",
                    color: headerText,
                  }}
                >
                  {storeName}
                </h1>
              </div>
            </motion.div>

            {/* Search Bar - Desktop */}
            <div className="hidden lg:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="ابحثي عن فستان أحلامك..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    className="w-full px-5 py-3 pr-12 rounded-lg text-sm outline-none transition-colors duration-300"
                    style={{
                      background: colors.backgroundInput,
                      border: `1px solid ${colors.borderInput}`,
                      color: headerText,
                    }}
                  />
                  <Search 
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: headerTextMuted }}
                  />
                </div>
                {/* Advanced Search Button */}
                <motion.button
                  onClick={onAdvancedSearchClick}
                  className="p-3 rounded-lg transition-colors"
                  style={{
                    background: colors.accentMuted,
                    color: colors.accent,
                    border: `1px solid ${colors.border}`,
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="بحث متقدم"
                >
                  <SlidersHorizontal className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 md:gap-2">
              {/* تبديل النمط — تطبيق فوري على الـ DOM ثم تحديث الـ state لاحقاً (بدون تجمّد) */}
              <motion.button
                type="button"
                onClick={toggleThemeMode}
                className="p-2.5 rounded-lg transition-colors"
                style={{
                  background: colors.accentMuted,
                  color: colors.accent,
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={themeMode === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'}
                aria-label={themeMode === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'}
              >
                {themeMode === 'dark' ? (
                  <Sun className="w-5 h-5" aria-hidden />
                ) : (
                  <Moon className="w-5 h-5" aria-hidden />
                )}
              </motion.button>

              {/* Mobile Search */}
              <motion.button
                onClick={() => setSearchOpen(true)}
                className="lg:hidden p-2.5"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Search className="w-5 h-5" style={{ color: headerTextMuted }} />
              </motion.button>

              {/* View Mode Toggle - Desktop */}
              <div className="hidden lg:flex items-center gap-1 p-1 rounded-lg" style={{ background: colors.accentMuted }}>
                <motion.button
                  onClick={() => onViewModeChange?.('grid')}
                  className="p-2 rounded-md transition-colors"
                  style={{
                    background: viewMode === 'grid' ? colors.primary : 'transparent',
                    color: viewMode === 'grid' ? colors.primaryText : headerTextMuted,
                  }}
                  whileTap={{ scale: 0.95 }}
                  title="عرض شبكي"
                >
                  <Grid className="w-4 h-4" />
                </motion.button>
                <motion.button
                  onClick={() => onViewModeChange?.('list')}
                  className="p-2 rounded-md transition-colors"
                  style={{
                    background: viewMode === 'list' ? colors.primary : 'transparent',
                    color: viewMode === 'list' ? colors.primaryText : headerTextMuted,
                  }}
                  whileTap={{ scale: 0.95 }}
                  title="عرض قائمة"
                >
                  <List className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Compare Products */}
              {compareCount > 0 && (
                <motion.button
                  onClick={onCompareClick}
                  className="relative p-2.5 rounded-lg"
                  style={{ background: colors.infoBg, color: colors.info }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  title="مقارنة المنتجات"
                >
                  <Scale className="w-5 h-5" />
                  <span 
                    className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
                    style={{ background: colors.info, color: 'white' }}
                  >
                    {compareCount}
                  </span>
                </motion.button>
              )}

              {/* Loyalty Points - Only for authenticated users */}
              {showLoyalty && isAuthenticated && (
                <motion.button
                  onClick={onLoyaltyClick}
                  className="hidden md:flex items-center gap-1 p-2.5 rounded-lg"
                  style={{ background: colors.warningBg, color: colors.warning }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="نقاط الولاء"
                >
                  <Award className="w-5 h-5" />
                </motion.button>
              )}

              {/* Orders - Only for authenticated users */}
              {showOrders && isAuthenticated && (
                <motion.button
                  onClick={onOrdersClick}
                  className="hidden md:flex items-center gap-1 p-2.5 rounded-lg transition-colors"
                  style={{ color: headerTextMuted }}
                  whileHover={{ scale: 1.05, color: colors.accent }}
                  whileTap={{ scale: 0.95 }}
                  title="طلباتي"
                >
                  <Package className="w-5 h-5" />
                </motion.button>
              )}

              {/* Account */}
              {showLogin && (
                <motion.button
                  onClick={onAccountClick}
                  className="hidden md:flex items-center gap-2 p-2.5 rounded-lg transition-colors"
                  style={{ color: headerTextMuted }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <User className="w-5 h-5" />
                  <span className="text-sm">{isAuthenticated ? 'حسابي' : 'دخول'}</span>
                </motion.button>
              )}
              
              {/* Wishlist */}
              {showWishlist && (
              <motion.button
                onClick={onWishlistClick}
                className="relative p-2.5"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Heart className="w-5 h-5" style={{ color: headerTextMuted }} />
                {wishlistCount > 0 && (
                  <span 
                    className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
                    style={{ 
                      background: colors.error,
                      color: 'white',
                    }}
                  >
                    {wishlistCount}
                  </span>
                )}
              </motion.button>
              )}

              {/* Cart */}
              {showCart && (
              <motion.button
                onClick={onCartClick}
                className="relative p-2.5 flex items-center gap-2 rounded-lg"
                style={{
                  background: colors.primaryGradient,
                  color: colors.primaryText,
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ShoppingBag className="w-5 h-5" />
                <span className="hidden md:inline text-sm font-medium">
                  السلة{cartCount > 0 ? ` (${cartCount})` : ''}
                </span>
                {cartCount > 0 && (
                  <span 
                    className="md:hidden absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
                    style={{ 
                      background: isDark ? 'hsl(20, 15%, 10%)' : colors.background,
                      color: colors.primary,
                    }}
                  >
                    {cartCount}
                  </span>
                )}
              </motion.button>
              )}
            </div>
          </div>

          {/* Navigation Row - Desktop */}
          <nav className="hidden lg:flex items-center justify-center gap-1 pb-4">
            {categories.map((cat) => (
              <motion.a
                key={cat.name}
                href={cat.href}
                className={cn(
                  "px-5 py-2.5 text-sm tracking-wide transition-colors rounded-lg",
                  cat.featured && "font-medium",
                )}
                style={{
                  color: cat.sale 
                    ? colors.error 
                    : cat.featured 
                      ? colors.accent 
                      : headerTextSecondary,
                }}
                whileHover={{ 
                  backgroundColor: colors.accentMuted,
                  color: colors.accent,
                }}
              >
                {cat.name}
                {cat.featured && (
                  <span 
                    className="ml-2 px-2 py-0.5 text-[10px] rounded-full"
                    style={{
                      background: colors.primary,
                      color: colors.primaryText,
                    }}
                  >
                    NEW
                  </span>
                )}
              </motion.a>
            ))}
          </nav>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden overflow-hidden"
              style={{ 
                background: colors.backgroundSecondary,
                borderTop: `1px solid ${colors.border}`,
              }}
            >
              <nav className="container mx-auto px-4 py-4 flex flex-col">
                {categories.map((cat) => (
                  <a
                    key={cat.name}
                    href={cat.href}
                    className="py-3 text-base"
                    style={{
                      color: cat.sale ? colors.error : headerText,
                      borderBottom: `1px solid ${colors.border}`,
                    }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {cat.name}
                  </a>
                ))}
                
                {/* Mobile-only actions */}
                <div className="pt-4 space-y-2">
                  <button 
                    onClick={() => { onAccountClick?.(); setMobileMenuOpen(false); }}
                    className="w-full py-3 text-base flex items-center gap-3 rounded-lg px-3"
                    style={{ background: colors.accentMuted, color: headerText }}
                  >
                    <User className="w-5 h-5" style={{ color: colors.primary }} />
                    {isAuthenticated ? 'حسابي' : 'تسجيل الدخول'}
                  </button>
                  
                  {isAuthenticated && (
                    <>
                      <button 
                        onClick={() => { onOrdersClick?.(); setMobileMenuOpen(false); }}
                        className="w-full py-3 text-base flex items-center gap-3 rounded-lg px-3"
                        style={{ background: colors.accentMuted, color: headerText }}
                      >
                        <Package className="w-5 h-5" style={{ color: colors.info }} />
                        طلباتي
                      </button>
                      
                      <button 
                        onClick={() => { onLoyaltyClick?.(); setMobileMenuOpen(false); }}
                        className="w-full py-3 text-base flex items-center gap-3 rounded-lg px-3"
                        style={{ background: colors.warningBg, color: headerText }}
                      >
                        <Award className="w-5 h-5" style={{ color: colors.warning }} />
                        نقاط الولاء
                      </button>
                    </>
                  )}
                  
                  {compareCount > 0 && (
                    <button 
                        onClick={() => { onCompareClick?.(); setMobileMenuOpen(false); }}
                        className="w-full py-3 text-base flex items-center gap-3 rounded-lg px-3"
                        style={{ background: colors.infoBg, color: headerText }}
                      >
                      <Scale className="w-5 h-5" style={{ color: colors.info }} />
                      المقارنة ({compareCount})
                    </button>
                  )}
                  
                  <button 
                    onClick={() => { onAdvancedSearchClick?.(); setMobileMenuOpen(false); }}
                    className="w-full py-3 text-base flex items-center gap-3 rounded-lg px-3"
                    style={{ background: colors.accentMuted, color: colors.text }}
                  >
                    <SlidersHorizontal className="w-5 h-5" style={{ color: colors.accent }} />
                    بحث متقدم
                  </button>
                  
                  {/* View mode toggle for mobile */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => onViewModeChange?.('grid')}
                      className="flex-1 py-3 flex items-center justify-center gap-2 rounded-lg"
                      style={{
                        background: viewMode === 'grid' ? colors.primary : colors.accentMuted,
                        color: viewMode === 'grid' ? colors.primaryText : headerText,
                      }}
                    >
                      <Grid className="w-5 h-5" />
                      شبكي
                    </button>
                    <button
                      onClick={() => onViewModeChange?.('list')}
                      className="flex-1 py-3 flex items-center justify-center gap-2 rounded-lg"
                      style={{
                        background: viewMode === 'list' ? colors.primary : colors.accentMuted,
                        color: viewMode === 'list' ? colors.primaryText : headerText,
                      }}
                    >
                      <List className="w-5 h-5" />
                      قائمة
                    </button>
                  </div>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Mobile Search Overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] lg:hidden"
            style={{ background: colors.backgroundOverlay }}
          >
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="ابحثي عن منتج..."
                    autoFocus
                    className="w-full px-4 py-3 pr-10 rounded-lg text-sm outline-none"
                    style={{
                      background: colors.backgroundTertiary,
                      border: `1px solid ${colors.borderInput}`,
                      color: headerText,
                    }}
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: headerTextMuted }} />
                </div>
                <button
                  onClick={() => setSearchOpen(false)}
                  className="p-2"
                  type="button"
                  aria-label="إغلاق البحث"
                  title="إغلاق البحث"
                >
                  <X className="w-6 h-6" style={{ color: headerText }} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
