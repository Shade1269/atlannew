import { ChevronLeft, ChevronRight, Heart, ShoppingCart } from "lucide-react";
import { useState, useRef } from "react";
import { motion } from "framer-motion";

export interface RelatedProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviewCount: number;
}

interface LuxuryRelatedProductsProps {
  title?: string;
  products: RelatedProduct[];
  onProductClick: (id: string) => void;
  onAddToCart: (product: RelatedProduct) => void;
  onAddToWishlist: (id: string) => void;
}

export function LuxuryRelatedProducts({
  title = "منتجات قد تعجبك",
  products,
  onProductClick,
  onAddToCart,
  onAddToWishlist,
}: LuxuryRelatedProductsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === "right" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (products.length === 0) return null;

  return (
    <div className="py-12" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        
        {/* Navigation Arrows */}
        <div className="flex gap-2">
          <button
            onClick={() => scroll("left")}
            disabled={!showLeftArrow}
            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${
              showLeftArrow
                ? "border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                : "border-muted text-muted cursor-not-allowed"
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll("right")}
            disabled={!showRightArrow}
            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${
              showRightArrow
                ? "border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                : "border-muted text-muted cursor-not-allowed"
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Products Carousel */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-6 overflow-x-auto scrollbar-hide pb-4"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex-shrink-0 w-64 group"
            style={{ scrollSnapAlign: "start" }}
          >
            <div
              onClick={() => onProductClick(product.id)}
              className="bg-card rounded-xl overflow-hidden border border-border hover:border-primary/50 cursor-pointer transition-all"
            >
              {/* Image */}
              <div className="relative aspect-[3/4] overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Discount Badge */}
                {product.originalPrice && (
                  <span className="absolute top-3 right-3 bg-destructive text-destructive-foreground px-2 py-1 rounded-full text-xs font-bold">
                    خصم {Math.round((1 - product.price / product.originalPrice) * 100)}%
                  </span>
                )}

                {/* Quick Actions */}
                <div className="absolute top-3 left-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToWishlist(product.id);
                    }}
                    className="w-9 h-9 bg-background/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <Heart className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart(product);
                    }}
                    className="w-9 h-9 bg-background/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {product.name}
                </h3>
                
                {/* Rating */}
                <div className="flex items-center gap-1 mb-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= product.rating
                            ? "text-primary fill-primary"
                            : "text-muted"
                        }`}
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    ({product.reviewCount})
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-center gap-2">
                  <span className="text-primary font-bold">
                    {product.price.toFixed(2)} ر.س
                  </span>
                  {product.originalPrice && (
                    <span className="text-muted-foreground line-through text-sm">
                      {product.originalPrice.toFixed(2)} ر.س
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
