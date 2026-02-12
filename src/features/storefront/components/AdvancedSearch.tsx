import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, X, Star, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface SearchFilters {
  query: string;
  priceRange: [number, number];
  categories: string[];
  rating: number | null;
  inStock: boolean;
  sortBy: 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'popular';
  colors: string[];
  sizes: string[];
}

interface AdvancedSearchProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  categories: string[];
  colors?: string[];
  sizes?: string[];
  maxPrice: number;
  totalResults?: number;
}

const sortOptions = [
  { value: 'popular', label: 'الأكثر مبيعاً' },
  { value: 'newest', label: 'الأحدث' },
  { value: 'price_asc', label: 'السعر: من الأقل للأعلى' },
  { value: 'price_desc', label: 'السعر: من الأعلى للأقل' },
  { value: 'rating', label: 'التقييم الأعلى' },
];

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  filters,
  onFiltersChange,
  categories,
  colors = [],
  sizes = [],
  maxPrice,
  totalResults
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.query) count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice) count++;
    if (filters.categories.length > 0) count++;
    if (filters.rating) count++;
    if (filters.inStock) count++;
    if (filters.colors.length > 0) count++;
    if (filters.sizes.length > 0) count++;
    return count;
  }, [filters, maxPrice]);

  const clearAllFilters = () => {
    onFiltersChange({
      query: '',
      priceRange: [0, maxPrice],
      categories: [],
      rating: null,
      inStock: false,
      sortBy: 'popular',
      colors: [],
      sizes: []
    });
  };

  const FiltersContent = () => (
    <div className="space-y-6">
      {/* Price Range */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 font-semibold">
          السعر
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4 space-y-4">
          <Slider
            value={filters.priceRange}
            onValueChange={(value) => updateFilter('priceRange', value as [number, number])}
            max={maxPrice}
            step={10}
            className="w-full"
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{filters.priceRange[0]} ر.س</span>
            <span>{filters.priceRange[1]} ر.س</span>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Categories */}
      {categories.length > 0 && (
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 font-semibold">
            الفئات
            <ChevronDown className="h-4 w-4" />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 space-y-2">
            {categories.map((category) => (
              <div key={category} className="flex items-center gap-2">
                <Checkbox
                  id={`cat-${category}`}
                  checked={filters.categories.includes(category)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      updateFilter('categories', [...filters.categories, category]);
                    } else {
                      updateFilter('categories', filters.categories.filter(c => c !== category));
                    }
                  }}
                />
                <Label htmlFor={`cat-${category}`} className="text-sm cursor-pointer">
                  {category}
                </Label>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Colors */}
      {colors.length > 0 && (
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 font-semibold">
            الألوان
            <ChevronDown className="h-4 w-4" />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    if (filters.colors.includes(color)) {
                      updateFilter('colors', filters.colors.filter(c => c !== color));
                    } else {
                      updateFilter('colors', [...filters.colors, color]);
                    }
                  }}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-full border transition-all',
                    filters.colors.includes(color)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border hover:border-primary'
                  )}
                >
                  {color}
                </button>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Sizes */}
      {sizes.length > 0 && (
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 font-semibold">
            المقاسات
            <ChevronDown className="h-4 w-4" />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    if (filters.sizes.includes(size)) {
                      updateFilter('sizes', filters.sizes.filter(s => s !== size));
                    } else {
                      updateFilter('sizes', [...filters.sizes, size]);
                    }
                  }}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-md border transition-all min-w-[40px]',
                    filters.sizes.includes(size)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border hover:border-primary'
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Rating */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 font-semibold">
          التقييم
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4 space-y-2">
          {[4, 3, 2, 1].map((rating) => (
            <button
              key={rating}
              onClick={() => updateFilter('rating', filters.rating === rating ? null : rating)}
              className={cn(
                'flex items-center gap-2 w-full p-2 rounded-lg transition-all',
                filters.rating === rating
                  ? 'bg-primary/10 border border-primary'
                  : 'hover:bg-muted'
              )}
            >
              <div className="flex items-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'h-4 w-4',
                      i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                    )}
                  />
                ))}
              </div>
              <span className="text-sm">وأعلى</span>
            </button>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* In Stock */}
      <div className="flex items-center gap-2 py-2">
        <Checkbox
          id="inStock"
          checked={filters.inStock}
          onCheckedChange={(checked) => updateFilter('inStock', checked as boolean)}
        />
        <Label htmlFor="inStock" className="cursor-pointer">
          المتوفر فقط
        </Label>
      </div>

      {/* Clear Filters */}
      {activeFiltersCount > 0 && (
        <Button variant="outline" className="w-full" onClick={clearAllFilters}>
          <X className="h-4 w-4 mr-2" />
          مسح كل الفلاتر ({activeFiltersCount})
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ابحث عن منتجات..."
            value={filters.query}
            onChange={(e) => updateFilter('query', e.target.value)}
            className="pr-10"
          />
          {filters.query && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={() => updateFilter('query', '')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Mobile Filter Button */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="lg:hidden relative">
              <SlidersHorizontal className="h-4 w-4" />
              {activeFiltersCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px]">
            <SheetHeader>
              <SheetTitle>فلترة المنتجات</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FiltersContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Sort & Results */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {totalResults !== undefined && (
            <span className="text-sm text-muted-foreground">
              {totalResults} نتيجة
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden sm:inline">ترتيب:</span>
          <select
            value={filters.sortBy}
            onChange={(e) => updateFilter('sortBy', e.target.value as SearchFilters['sortBy'])}
            className="text-sm bg-background border rounded-md px-3 py-1.5"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filters Tags */}
      <AnimatePresence>
        {activeFiltersCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2"
          >
            {filters.query && (
              <Badge variant="secondary" className="gap-1">
                بحث: {filters.query}
                <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter('query', '')} />
              </Badge>
            )}
            {(filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice) && (
              <Badge variant="secondary" className="gap-1">
                السعر: {filters.priceRange[0]} - {filters.priceRange[1]} ر.س
                <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter('priceRange', [0, maxPrice])} />
              </Badge>
            )}
            {filters.categories.map((cat) => (
              <Badge key={cat} variant="secondary" className="gap-1">
                {cat}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => updateFilter('categories', filters.categories.filter(c => c !== cat))}
                />
              </Badge>
            ))}
            {filters.colors.map((color) => (
              <Badge key={color} variant="secondary" className="gap-1">
                {color}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => updateFilter('colors', filters.colors.filter(c => c !== color))}
                />
              </Badge>
            ))}
            {filters.rating && (
              <Badge variant="secondary" className="gap-1">
                تقييم {filters.rating}+ نجوم
                <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter('rating', null)} />
              </Badge>
            )}
            {filters.inStock && (
              <Badge variant="secondary" className="gap-1">
                المتوفر فقط
                <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter('inStock', false)} />
              </Badge>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Filters Sidebar (to be used in parent component) */}
      <div className="hidden lg:block">
        {/* This is a placeholder - the actual sidebar should be rendered in the parent */}
      </div>
    </div>
  );
};

// Desktop Filters Sidebar Component
export const FiltersSidebar: React.FC<Omit<AdvancedSearchProps, 'totalResults'>> = (props) => {
  const { filters, onFiltersChange, categories, colors = [], sizes = [], maxPrice } = props;

  const updateFilter = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="space-y-6 p-4 bg-card rounded-lg border">
      <h3 className="font-semibold text-lg">تصفية النتائج</h3>
      
      {/* Price Range */}
      <div className="space-y-4">
        <h4 className="font-medium">السعر</h4>
        <Slider
          value={filters.priceRange}
          onValueChange={(value) => updateFilter('priceRange', value as [number, number])}
          max={maxPrice}
          step={10}
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{filters.priceRange[0]} ر.س</span>
          <span>{filters.priceRange[1]} ر.س</span>
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">الفئات</h4>
          {categories.map((category) => (
            <div key={category} className="flex items-center gap-2">
              <Checkbox
                id={`sidebar-cat-${category}`}
                checked={filters.categories.includes(category)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    updateFilter('categories', [...filters.categories, category]);
                  } else {
                    updateFilter('categories', filters.categories.filter(c => c !== category));
                  }
                }}
              />
              <Label htmlFor={`sidebar-cat-${category}`} className="text-sm cursor-pointer">
                {category}
              </Label>
            </div>
          ))}
        </div>
      )}

      {/* Colors */}
      {colors.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">الألوان</h4>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => {
                  if (filters.colors.includes(color)) {
                    updateFilter('colors', filters.colors.filter(c => c !== color));
                  } else {
                    updateFilter('colors', [...filters.colors, color]);
                  }
                }}
                className={cn(
                  'px-3 py-1 text-xs rounded-full border transition-all',
                  filters.colors.includes(color)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-border hover:border-primary'
                )}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sizes */}
      {sizes.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">المقاسات</h4>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => (
              <button
                key={size}
                onClick={() => {
                  if (filters.sizes.includes(size)) {
                    updateFilter('sizes', filters.sizes.filter(s => s !== size));
                  } else {
                    updateFilter('sizes', [...filters.sizes, size]);
                  }
                }}
                className={cn(
                  'px-3 py-1 text-xs rounded-md border transition-all min-w-[36px]',
                  filters.sizes.includes(size)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-border hover:border-primary'
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Rating */}
      <div className="space-y-2">
        <h4 className="font-medium">التقييم</h4>
        {[4, 3, 2, 1].map((rating) => (
          <button
            key={rating}
            onClick={() => updateFilter('rating', filters.rating === rating ? null : rating)}
            className={cn(
              'flex items-center gap-2 w-full p-2 rounded-lg transition-all text-sm',
              filters.rating === rating
                ? 'bg-primary/10 border border-primary'
                : 'hover:bg-muted'
            )}
          >
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    'h-3 w-3',
                    i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                  )}
                />
              ))}
            </div>
            <span>وأعلى</span>
          </button>
        ))}
      </div>

      {/* In Stock */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="sidebar-inStock"
          checked={filters.inStock}
          onCheckedChange={(checked) => updateFilter('inStock', checked as boolean)}
        />
        <Label htmlFor="sidebar-inStock" className="text-sm cursor-pointer">
          المتوفر فقط
        </Label>
      </div>
    </div>
  );
};
