import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronLeft, Sparkles } from 'lucide-react';
import { useLuxuryTheme } from './LuxuryThemeContext';

export interface MenuCategory {
  id: string;
  name: string;
  href: string;
  featured?: boolean;
  sale?: boolean;
  subcategories?: Array<{
    id: string;
    name: string;
    href: string;
    image?: string;
  }>;
  featuredProducts?: Array<{
    id: string;
    name: string;
    image: string;
    price: number;
    href: string;
  }>;
  banner?: {
    title: string;
    subtitle: string;
    image: string;
    href: string;
  };
}

interface MegaMenuProps {
  categories: MenuCategory[];
  onCategoryClick: (href: string) => void;
  onProductClick: (id: string) => void;
}

export function MegaMenu({ categories, onCategoryClick, onProductClick }: MegaMenuProps) {
  const { colors } = useLuxuryTheme();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  return (
    <nav 
      className="relative z-40 transition-colors duration-500" 
      dir="rtl"
      style={{
        background: colors.backgroundSecondary,
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      <div className="flex items-center justify-center gap-1 py-2">
        {categories.map((category) => (
          <div
            key={category.id}
            className="relative"
            onMouseEnter={() => setActiveCategory(category.id)}
            onMouseLeave={() => setActiveCategory(null)}
          >
            {/* Menu Item */}
            <button
              onClick={() => onCategoryClick(category.href)}
              className="group flex items-center gap-1.5 px-4 py-3 text-sm tracking-wide transition-colors rounded-lg"
              style={{
                color: category.sale
                  ? colors.error
                  : category.featured
                  ? colors.accent
                  : colors.textSecondary,
              }}
            >
              {category.name}
              {category.featured && (
                <span
                  className="px-1.5 py-0.5 text-[9px] rounded-full font-bold"
                  style={{
                    background: colors.primary,
                    color: colors.primaryText,
                  }}
                >
                  NEW
                </span>
              )}
              {category.subcategories && category.subcategories.length > 0 && (
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${
                    activeCategory === category.id ? 'rotate-180' : ''
                  }`}
                  style={{ opacity: 0.6 }}
                />
              )}
            </button>

            {/* Mega Menu Dropdown */}
            <AnimatePresence>
              {activeCategory === category.id && category.subcategories && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full right-0 pt-2 z-50"
                  style={{ minWidth: category.banner ? '700px' : '400px' }}
                >
                  <div
                    className="rounded-xl overflow-hidden shadow-2xl"
                    style={{
                      background: colors.backgroundCard,
                      border: `1px solid ${colors.border}`,
                      backdropFilter: 'blur(20px)',
                    }}
                  >
                    <div className="flex">
                      {/* Subcategories */}
                      <div className="flex-1 p-6">
                        <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                          {category.subcategories.map((sub) => (
                            <button
                              key={sub.id}
                              onClick={() => onCategoryClick(sub.href)}
                              className="group flex items-center gap-3 py-2 px-3 rounded-lg transition-colors text-right"
                              style={{
                                background: 'transparent',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = colors.accentMuted;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                              }}
                            >
                              {sub.image && (
                                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                                  <img
                                    src={sub.image}
                                    alt={sub.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                  />
                                </div>
                              )}
                              <span
                                className="text-sm transition-colors"
                                style={{ color: colors.textSecondary }}
                              >
                                {sub.name}
                              </span>
                              <ChevronLeft 
                                className="w-4 h-4 opacity-0 group-hover:opacity-60 -translate-x-2 group-hover:translate-x-0 transition-all" 
                                style={{ color: colors.accent }}
                              />
                            </button>
                          ))}
                        </div>

                        {/* Featured Products */}
                        {category.featuredProducts && category.featuredProducts.length > 0 && (
                          <div className="mt-6 pt-6" style={{ borderTop: `1px solid ${colors.border}` }}>
                            <h4
                              className="text-xs uppercase tracking-wider mb-4 flex items-center gap-2"
                              style={{ color: colors.accent }}
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              منتجات مميزة
                            </h4>
                            <div className="flex gap-4">
                              {category.featuredProducts.slice(0, 3).map((product) => (
                                <button
                                  key={product.id}
                                  onClick={() => onProductClick(product.id)}
                                  className="group flex-1"
                                >
                                  <div className="aspect-[3/4] rounded-lg overflow-hidden mb-2">
                                    <img
                                      src={product.image}
                                      alt={product.name}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    />
                                  </div>
                                  <p
                                    className="text-xs line-clamp-1 transition-colors"
                                    style={{ color: colors.textSecondary }}
                                  >
                                    {product.name}
                                  </p>
                                  <p
                                    className="text-xs font-semibold"
                                    style={{ color: colors.accent }}
                                  >
                                    {product.price} ر.س
                                  </p>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Banner */}
                      {category.banner && (
                        <div className="w-64 relative overflow-hidden">
                          <img
                            src={category.banner.image}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          <div
                            className="absolute inset-0"
                            style={{
                              background: colors.gradientOverlay,
                            }}
                          />
                          <div className="relative h-full flex flex-col justify-end p-6">
                            <h5
                              className="text-lg font-semibold mb-1"
                              style={{
                                fontFamily: "'Playfair Display', serif",
                                color: colors.text,
                              }}
                            >
                              {category.banner.title}
                            </h5>
                            <p className="text-xs mb-3" style={{ color: colors.textMuted }}>
                              {category.banner.subtitle}
                            </p>
                            <button
                              onClick={() => onCategoryClick(category.banner!.href)}
                              className="self-start px-4 py-2 text-xs font-medium rounded-full transition-colors"
                              style={{
                                background: colors.primary,
                                color: colors.primaryText,
                              }}
                            >
                              تسوقي الآن
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </nav>
  );
}
