import React, { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  extractImagesFromVariant,
  uniqUrls,
  logImageCounts,
} from '@/lib/imageExtractors';

interface ProductImageCarouselProps {
  images: string[] | null;
  productTitle: string;
  variants?: any[]; // Add variants prop
  className?: string;
  /** ألوان الثيم لأسهم التنقل والعداد (النمط النهاري/الليلي) */
  themeArrowStyle?: { background: string; color: string };
}

export const ProductImageCarousel: React.FC<ProductImageCarouselProps> = ({
  images,
  productTitle,
  variants,
  className,
  themeArrowStyle,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);

  // Use only Firebase images - collect from product AND all variants
  const productImages = Array.isArray(images) ? images : [];
  
  const variants_array = Array.isArray(variants) ? variants : [];
  const variantImages = variants_array.flatMap(extractImagesFromVariant);
  
  const validImages = uniqUrls([...productImages, ...variantImages]);
  const hasMultipleImages = validImages.length > 1;

  logImageCounts(productImages, variants_array, "ProductImageCarousel");

  const nextImage = useCallback(() => {
    if (validImages.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % validImages.length);
  }, [validImages.length]);

  const prevImage = useCallback(() => {
    if (validImages.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
  }, [validImages.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!hasMultipleImages) return;
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setCurrentX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !hasMultipleImages) return;
    setCurrentX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!isDragging || !hasMultipleImages) return;
    setIsDragging(false);
    
    const deltaX = currentX - startX;
    const threshold = 50; // minimum distance for swipe

    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0) {
        prevImage();
      } else {
        nextImage();
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!hasMultipleImages) return;
    setIsDragging(true);
    setStartX(e.clientX);
    setCurrentX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !hasMultipleImages) return;
    setCurrentX(e.clientX);
  };

  const handleMouseUp = () => {
    if (!isDragging || !hasMultipleImages) return;
    setIsDragging(false);
    
    const deltaX = currentX - startX;
    const threshold = 50;

    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0) {
        prevImage();
      } else {
        nextImage();
      }
    }
  };

  if (validImages.length === 0) {
    return (
      <div className={cn("aspect-square bg-muted flex items-center justify-center rounded-lg", className)}>
        <Package className="h-12 w-12 text-muted-foreground" />
        <div className="absolute bottom-2 right-2 bg-foreground/50 text-background text-xs px-2 py-1 rounded">
          لا توجد صور
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn("relative aspect-square bg-muted overflow-hidden group rounded-lg", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Main Image */}
      <div className="relative w-full h-full">
        <img
          src={validImages[currentIndex]}
          alt={`${productTitle} - صورة ${currentIndex + 1}`}
          className="w-full h-full object-cover transition-transform duration-200"
          style={{
            transform: isDragging ? `translateX(${(currentX - startX) * 0.1}px)` : 'translateX(0)',
            userSelect: 'none'
          }}
          draggable={false}
          loading="lazy"
          onError={(e) => {
            console.error(`Failed to load image: ${validImages[currentIndex]}`);
            e.currentTarget.src = '/placeholder.svg';
          }}
        />
        
        {/* Navigation Arrows - تلتزم بالثيم عند تمرير themeArrowStyle */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute left-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full backdrop-blur-sm border border-border shadow-lg",
            !themeArrowStyle && "bg-foreground/70 hover:bg-foreground/90 text-background"
          )}
          style={themeArrowStyle ? { background: themeArrowStyle.background, color: themeArrowStyle.color } : undefined}
          disabled={!hasMultipleImages}
          onClick={(e) => {
            e.stopPropagation();
            prevImage();
          }}
          aria-label="الصورة السابقة"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full backdrop-blur-sm border border-border shadow-lg",
            !themeArrowStyle && "bg-foreground/70 hover:bg-foreground/90 text-background"
          )}
          style={themeArrowStyle ? { background: themeArrowStyle.background, color: themeArrowStyle.color } : undefined}
          disabled={!hasMultipleImages}
          onClick={(e) => {
            e.stopPropagation();
            nextImage();
          }}
          aria-label="الصورة التالية"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
        
        {/* Image Counter - يلتزم بالثيم عند تمرير themeArrowStyle */}
        <div
          className={cn("absolute top-3 right-3 text-xs px-2 py-1 rounded-full", !themeArrowStyle && "bg-foreground/50 text-background")}
          style={themeArrowStyle ? { background: themeArrowStyle.background, color: themeArrowStyle.color } : undefined}
        >
          {currentIndex + 1} / {validImages.length}
        </div>
        
        {/* Dots Indicator */}
        {hasMultipleImages && validImages.length <= 5 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {validImages.map((_, index) => (
              <button
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  index === currentIndex ? "bg-background scale-125" : "bg-background/50 hover:bg-background/80"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(index);
                }}
              />
            ))}
          </div>
        )}
        
        {/* Swipe Indicator */}
        <div className="absolute bottom-3 left-3 text-background/70 text-xs bg-foreground/30 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
          {hasMultipleImages ? '👈👉 اسحب للتنقل' : 'صورة واحدة'}
        </div>
      </div>
    </div>
  );
};

export default ProductImageCarousel;