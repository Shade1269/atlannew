import React from 'react';
import { X, ShoppingCart, Star, Check, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCompare } from '../hooks/useCompare';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  title: string;
  description?: string;
  price_sar: number;
  image_urls?: string[];
  rating?: number;
  reviews_count?: number;
  stock_quantity?: number;
  category?: string;
  brand?: string;
}

interface CompareProductsProps {
  products: Product[];
  storeId: string;
  onAddToCart?: (productId: string) => void;
  onClose?: () => void;
}

export const CompareProducts: React.FC<CompareProductsProps> = ({
  products,
  storeId,
  onAddToCart,
  onClose
}) => {
  const { removeFromCompare, clearCompare } = useCompare(storeId);

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">لا توجد منتجات للمقارنة</p>
      </div>
    );
  }

  // جمع كل الخصائص الفريدة
  const allSpecs = ['السعر', 'التقييم', 'المخزون', 'الفئة'];

  const getSpecValue = (product: Product, spec: string) => {
    switch (spec) {
      case 'السعر':
        return `${product.price_sar} ر.س`;
      case 'التقييم':
        return product.rating ? (
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span>{product.rating}</span>
            {product.reviews_count && (
              <span className="text-muted-foreground text-xs">({product.reviews_count})</span>
            )}
          </div>
        ) : '-';
      case 'المخزون':
        return product.stock_quantity && product.stock_quantity > 0 ? (
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
            متوفر ({product.stock_quantity})
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
            غير متوفر
          </Badge>
        );
      case 'الفئة':
        return product.category || '-';
      default:
        return '-';
    }
  };

  const getBestValue = (spec: string): string | null => {
    if (spec === 'السعر') {
      const prices = products.map(p => p.price_sar);
      const minPrice = Math.min(...prices);
      return products.find(p => p.price_sar === minPrice)?.id || null;
    }
    if (spec === 'التقييم') {
      const ratings = products.map(p => p.rating || 0);
      const maxRating = Math.max(...ratings);
      if (maxRating === 0) return null;
      return products.find(p => p.rating === maxRating)?.id || null;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">مقارنة المنتجات ({products.length})</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={clearCompare}>
            مسح الكل
          </Button>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          {/* Products Row */}
          <thead>
            <tr>
              <th className="p-4 text-right bg-muted/50 min-w-[150px]"></th>
              {products.map((product) => (
                <th key={product.id} className="p-4 min-w-[200px] max-w-[250px]">
                  <Card className="overflow-hidden">
                    <div className="relative aspect-square">
                      {product.image_urls?.[0] ? (
                        <img
                          src={product.image_urls[0]}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 bg-background/80 hover:bg-background"
                        onClick={() => removeFromCompare(product.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardContent className="p-3 space-y-2">
                      <h3 className="font-semibold text-sm line-clamp-2">{product.title}</h3>
                      <p className="text-lg font-bold text-primary">{product.price_sar} ر.س</p>
                      {onAddToCart && (
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => onAddToCart(product.id)}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          أضف للسلة
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </th>
              ))}
            </tr>
          </thead>

          {/* Specs Rows */}
          <tbody>
            {allSpecs.map((spec, index) => {
              const bestProductId = getBestValue(spec);
              return (
                <tr key={spec} className={cn(index % 2 === 0 && 'bg-muted/30')}>
                  <td className="p-4 font-medium text-muted-foreground">{spec}</td>
                  {products.map((product) => (
                    <td
                      key={product.id}
                      className={cn(
                        'p-4 text-center',
                        bestProductId === product.id && 'bg-green-500/10'
                      )}
                    >
                      <div className="flex items-center justify-center gap-2">
                        {getSpecValue(product, spec)}
                        {bestProductId === product.id && (
                          <Check className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// زر إضافة للمقارنة
interface CompareButtonProps {
  productId: string;
  storeId: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const CompareButton: React.FC<CompareButtonProps> = ({
  productId,
  storeId,
  size = 'md',
  className
}) => {
  const { isInCompare, toggleCompare, compareCount } = useCompare(storeId);
  const isComparing = isInCompare(productId);
  const canAdd = compareCount < 4;

  return (
    <Button
      variant={isComparing ? 'default' : 'outline'}
      size={size === 'sm' ? 'sm' : 'default'}
      onClick={() => toggleCompare(productId)}
      disabled={!isComparing && !canAdd}
      className={cn(
        'gap-2 transition-all duration-300',
        isComparing && 'bg-blue-500 hover:bg-blue-600',
        className
      )}
    >
      {isComparing ? (
        <>
          <Check className="h-4 w-4" />
          في المقارنة
        </>
      ) : (
        <>
          <Minus className="h-4 w-4 rotate-90" />
          قارن
        </>
      )}
    </Button>
  );
};
