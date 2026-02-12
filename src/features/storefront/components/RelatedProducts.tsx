import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Star, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

interface RelatedProductsProps {
  currentProductId: string;
  storeId: string;
  storeSlug: string;
  category?: string;
}

export const RelatedProducts: React.FC<RelatedProductsProps> = ({
  currentProductId,
  storeId,
  storeSlug,
  category
}) => {
  const navigate = useNavigate();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['related-products', storeId, currentProductId, category],
    queryFn: async () => {
      // جلب المنتجات المشابهة من نفس الفئة
      const { data: affiliateProducts, error } = await supabase
        .from('affiliate_products')
        .select(`
          product_id,
          products!inner (
            id,
            title,
            description,
            price_sar,
            image_urls,
            rating,
            reviews_count,
            category,
            is_active
          )
        `)
        .eq('affiliate_store_id', storeId)
        .eq('is_visible', true)
        .neq('product_id', currentProductId)
        .limit(8);

      if (error) throw error;

      // ترتيب حسب الفئة أولاً ثم عشوائياً
      const allProducts = (affiliateProducts || []).map(item => {
        const product = item.products as any;
        return {
          id: product.id,
          title: product.title,
          description: product.description,
          price_sar: product.price_sar,
          image_urls: product.image_urls,
          rating: product.rating,
          reviews_count: product.reviews_count,
          category: product.category,
          isSameCategory: category && product.category === category
        };
      });

      // ترتيب: نفس الفئة أولاً
      return allProducts.sort((a, b) => {
        if (a.isSameCategory && !b.isSameCategory) return -1;
        if (!a.isSameCategory && b.isSameCategory) return 1;
        return 0;
      }).slice(0, 4);
    },
    enabled: !!storeId && !!currentProductId
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-bold">منتجات مشابهة</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-square w-full" />
              <CardContent className="p-3 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">منتجات مشابهة</h3>
        <Button variant="ghost" size="sm" onClick={() => navigate(`/s/${storeSlug}`)}>
          عرض الكل
          <ArrowLeft className="h-4 w-4 mr-2" />
        </Button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow h-full"
              onClick={() => navigate(`/s/${storeSlug}/p/${product.id}`)}
            >
              <div className="aspect-square overflow-hidden relative">
                {product.image_urls?.[0] ? (
                  <img
                    src={product.image_urls[0]}
                    alt={product.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                {product.isSameCategory && (
                  <Badge className="absolute top-2 right-2 bg-primary/90">
                    نفس الفئة
                  </Badge>
                )}
              </div>
              <CardContent className="p-3 space-y-2">
                <h4 className="font-medium text-sm line-clamp-2">{product.title}</h4>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary">{product.price_sar} ر.س</span>
                  {product.rating && (
                    <div className="flex items-center gap-1 text-xs">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>{product.rating}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// منتجات "اشترى العملاء أيضاً"
interface FrequentlyBoughtProps {
  currentProductId: string;
  storeId: string;
  storeSlug: string;
  onAddToCart?: (productId: string) => void;
}

export const FrequentlyBoughtTogether: React.FC<FrequentlyBoughtProps> = ({
  currentProductId,
  storeId,
  storeSlug,
  onAddToCart
}) => {
  const navigate = useNavigate();

  // في الواقع هذا يحتاج تحليل بيانات الطلبات السابقة
  // حالياً نعرض منتجات عشوائية من نفس المتجر
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['frequently-bought', storeId, currentProductId],
    queryFn: async () => {
      const { data: affiliateProducts, error } = await supabase
        .from('affiliate_products')
        .select(`
          product_id,
          products!inner (
            id,
            title,
            price_sar,
            image_urls
          )
        `)
        .eq('affiliate_store_id', storeId)
        .eq('is_visible', true)
        .neq('product_id', currentProductId)
        .limit(3);

      if (error) throw error;

      return (affiliateProducts || []).map(item => {
        const product = item.products as any;
        return {
          id: product.id,
          title: product.title,
          price_sar: product.price_sar,
          image_urls: product.image_urls
        };
      });
    },
    enabled: !!storeId && !!currentProductId
  });

  if (isLoading || products.length === 0) return null;

  const totalPrice = products.reduce((sum, p) => sum + p.price_sar, 0);

  return (
    <Card className="p-4">
      <h3 className="font-bold mb-4">يشترى معاً</h3>
      
      <div className="flex items-center gap-4 flex-wrap">
        {products.map((product, index) => (
          <React.Fragment key={product.id}>
            <div 
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate(`/s/${storeSlug}/p/${product.id}`)}
            >
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted">
                {product.image_urls?.[0] ? (
                  <img
                    src={product.image_urls[0]}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium line-clamp-1">{product.title}</p>
                <p className="text-sm text-primary font-bold">{product.price_sar} ر.س</p>
              </div>
            </div>
            {index < products.length - 1 && (
              <span className="text-2xl text-muted-foreground">+</span>
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">السعر الإجمالي</p>
          <p className="text-xl font-bold text-primary">{totalPrice} ر.س</p>
        </div>
        <Button
          onClick={() => {
            products.forEach(p => onAddToCart?.(p.id));
          }}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          أضف الكل للسلة
        </Button>
      </div>
    </Card>
  );
};
