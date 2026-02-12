import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, 
  Heart, 
  Star, 
  Eye
} from 'lucide-react';

interface Product {
  id: string;
  title: string;
  description: string;
  price_sar: number;
  images?: any;
  image_urls?: string[];
  category: string;
  stock: number;
  view_count: number;
  average_rating?: number;
  total_reviews?: number;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  viewMode?: 'grid' | 'list';
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onAddToCart, 
  viewMode = 'grid' 
}) => {
  const imageUrl = Array.isArray(product.images) && product.images[0]?.url || 
                   Array.isArray(product.image_urls) && product.image_urls[0] || 
                   '/placeholder.svg';

  if (viewMode === 'list') {
    return (
      <Card className="border-0 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={imageUrl}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">{product.title}</h3>
              <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                {product.description}
              </p>
              <div className="flex items-center justify-between">
                <div className="text-lg font-bold text-primary">
                  {product.price_sar} ريال
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => onAddToCart(product)}>
                    أضف للسلة
                  </Button>
                  <Button size="sm" variant="outline">
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 group overflow-hidden">
      {/* صورة المنتج */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={imageUrl}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 right-3">
          <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
            <Eye className="h-3 w-3 ml-1" />
            {product.view_count || 0}
          </Badge>
        </div>
        {product.stock <= 5 && (
          <div className="absolute top-3 left-3">
            <Badge variant="destructive" className="bg-destructive/90 backdrop-blur-sm">
              باقي {product.stock}
            </Badge>
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
      </div>

      {/* تفاصيل المنتج */}
      <CardContent className="p-4">
        <h3 className="font-semibold mb-2 line-clamp-2">{product.title}</h3>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between mb-4">
          <div className="text-xl font-bold text-primary">{product.price_sar} ريال</div>
          {product.average_rating && product.average_rating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm">{product.average_rating.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({product.total_reviews})</span>
            </div>
          )}
        </div>

        {/* أزرار الإجراءات */}
        <div className="flex gap-2">
          <Button onClick={() => onAddToCart(product)} className="flex-1">
            <ShoppingCart className="h-4 w-4 ml-2" />
            أضف للسلة
          </Button>
          <Button size="icon" variant="outline" className="group/btn">
            <Heart className="h-4 w-4 group-hover/btn:text-destructive transition-colors" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
