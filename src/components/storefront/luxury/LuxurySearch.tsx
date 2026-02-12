import { useState } from "react";
import { Search, SlidersHorizontal, X, ChevronDown, Grid3X3, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { useLuxuryTheme } from './LuxuryThemeContext';

export interface SearchProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  rating: number;
}

export interface SearchFilters {
  categories: string[];
  priceRange: { min: number; max: number };
  sortBy: string;
}

interface LuxurySearchProps {
  products: SearchProduct[];
  categories: string[];
  onProductClick: (id: string) => void;
  onAddToCart: (product: SearchProduct) => void;
}

export function LuxurySearch({
  products,
  categories,
  onProductClick,
  onAddToCart,
}: LuxurySearchProps) {
  const { colors } = useLuxuryTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 5000 });
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(product.category);
    const matchesPrice = product.price >= priceRange.min && product.price <= priceRange.max;
    return matchesSearch && matchesCategory && matchesPrice;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-asc":
        return a.price - b.price;
      case "price-desc":
        return b.price - a.price;
      case "rating":
        return b.rating - a.rating;
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen py-8" dir="rtl" style={{ background: colors.background, color: colors.text }}>
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Search Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="relative max-w-2xl mx-auto mb-6">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: colors.textMuted }} />
            <Input
              type="text"
              placeholder="ابحث عن منتجات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-12 py-6 text-lg"
              style={{ 
                background: colors.backgroundSecondary, 
                border: `1px solid ${colors.border}`,
                color: colors.text,
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute left-4 top-1/2 -translate-y-1/2"
              >
                <X className="w-5 h-5" style={{ color: colors.textMuted }} />
              </button>
            )}
          </div>

          {/* Toolbar */}
          <div 
            className="flex flex-wrap items-center justify-between gap-4 pb-4"
            style={{ borderBottom: `1px solid ${colors.border}` }}
          >
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
                style={{ 
                  background: 'transparent',
                  border: `1px solid ${colors.border}`,
                  color: colors.text,
                }}
              >
                <SlidersHorizontal className="w-4 h-4" />
                الفلاتر
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
              </Button>
              
              <span className="text-sm" style={{ color: colors.textMuted }}>
                {sortedProducts.length} منتج
              </span>
            </div>

            <div className="flex items-center gap-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg px-4 py-2 text-sm outline-none"
                style={{ 
                  background: colors.backgroundSecondary, 
                  border: `1px solid ${colors.border}`,
                  color: colors.text,
                }}
              >
                <option value="newest">الأحدث</option>
                <option value="price-asc">السعر: من الأقل للأعلى</option>
                <option value="price-desc">السعر: من الأعلى للأقل</option>
                <option value="rating">الأعلى تقييماً</option>
              </select>

              <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${colors.border}` }}>
                <button
                  onClick={() => setViewMode("grid")}
                  className="p-2"
                  style={{ 
                    background: viewMode === "grid" ? colors.primary : colors.backgroundSecondary,
                    color: viewMode === "grid" ? colors.primaryText : colors.text,
                  }}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className="p-2"
                  style={{ 
                    background: viewMode === "list" ? colors.primary : colors.backgroundSecondary,
                    color: viewMode === "list" ? colors.primaryText : colors.text,
                  }}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-8"
            >
              <div 
                className="rounded-xl p-6"
                style={{ 
                  background: colors.backgroundSecondary, 
                  border: `1px solid ${colors.border}`,
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Categories */}
                  <div>
                    <h3 className="font-semibold mb-3">التصنيفات</h3>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((category) => (
                        <button
                          key={category}
                          onClick={() => {
                            setSelectedCategories((prev) =>
                              prev.includes(category)
                                ? prev.filter((c) => c !== category)
                                : [...prev, category]
                            );
                          }}
                          className="px-4 py-2 rounded-full text-sm transition-colors"
                          style={{ 
                            background: selectedCategories.includes(category) ? colors.primary : colors.backgroundTertiary,
                            color: selectedCategories.includes(category) ? colors.primaryText : colors.textSecondary,
                          }}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Range */}
                  <div>
                    <h3 className="font-semibold mb-3">نطاق السعر</h3>
                    <div className="flex items-center gap-4">
                      <Input
                        type="number"
                        placeholder="من"
                        value={priceRange.min}
                        onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
                        style={{ 
                          background: colors.background,
                          border: `1px solid ${colors.border}`,
                          color: colors.text,
                        }}
                      />
                      <span style={{ color: colors.textMuted }}>-</span>
                      <Input
                        type="number"
                        placeholder="إلى"
                        value={priceRange.max}
                        onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
                        style={{ 
                          background: colors.background,
                          border: `1px solid ${colors.border}`,
                          color: colors.text,
                        }}
                      />
                    </div>
                  </div>

                  {/* Clear Filters */}
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedCategories([]);
                        setPriceRange({ min: 0, max: 5000 });
                        setSortBy("newest");
                      }}
                      className="w-full"
                      style={{ 
                        background: 'transparent',
                        border: `1px solid ${colors.border}`,
                        color: colors.text,
                      }}
                    >
                      مسح الفلاتر
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        {sortedProducts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Search className="w-20 h-20 mx-auto mb-6" style={{ color: colors.textMuted }} />
            <h2 className="text-2xl font-semibold mb-4">
              لا توجد نتائج
            </h2>
            <p style={{ color: colors.textMuted }}>
              جرب تغيير كلمات البحث أو الفلاتر
            </p>
          </motion.div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                : "space-y-4"
            }
          >
            {sortedProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onProductClick(product.id)}
                className={`group rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${
                  viewMode === "list" ? "flex" : ""
                }`}
                style={{ 
                  background: colors.backgroundSecondary, 
                  border: `1px solid ${colors.border}`,
                }}
              >
                <div className={`relative ${viewMode === "list" ? "w-48 h-48" : "aspect-[3/4]"} overflow-hidden`}>
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {product.originalPrice && (
                    <span 
                      className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-bold"
                      style={{ background: colors.error, color: colors.primaryText }}
                    >
                      خصم {Math.round((1 - product.price / product.originalPrice) * 100)}%
                    </span>
                  )}
                </div>
                <div className={`p-4 ${viewMode === "list" ? "flex-1 flex flex-col justify-center" : ""}`}>
                  <p className="text-xs mb-1" style={{ color: colors.textMuted }}>{product.category}</p>
                  <h3 className="font-semibold mb-2 line-clamp-2">{product.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="font-bold" style={{ color: colors.primary }}>{product.price.toFixed(2)} ر.س</span>
                    {product.originalPrice && (
                      <span className="line-through text-sm" style={{ color: colors.textMuted }}>
                        {product.originalPrice.toFixed(2)} ر.س
                      </span>
                    )}
                  </div>
                  {viewMode === "list" && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart(product);
                      }}
                      className="mt-4"
                      size="sm"
                      style={{
                        background: colors.buttonPrimary,
                        color: colors.buttonText,
                      }}
                    >
                      أضف للسلة
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
