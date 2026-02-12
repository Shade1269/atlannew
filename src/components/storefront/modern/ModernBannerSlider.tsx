import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { UnifiedButton } from '@/components/design-system';

interface StoreBanner {
  id: string;
  title: string;
  subtitle?: string | null;
  image_url: string;
  link_url?: string | null;
  link_type: 'product' | 'category' | 'external' | 'none';
}

interface ModernBannerSliderProps {
  banners: StoreBanner[];
  onBannerClick?: (banner: StoreBanner) => void;
}

export const ModernBannerSlider = ({ banners, onBannerClick }: ModernBannerSliderProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  // Auto-play functionality
  useEffect(() => {
    if (!banners || banners.length === 0) return;
    
    const timer = setInterval(() => {
      handleNext();
    }, 5000);

    return () => clearInterval(timer);
  }, [currentIndex, banners]);

  const handlePrevious = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
  };

  const handleBannerClick = () => {
    if (onBannerClick && banners[currentIndex]) {
      onBannerClick(banners[currentIndex]);
    }
  };

  if (!banners || banners.length === 0) return null;

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  return (
    <section className="relative w-full bg-background overflow-hidden mb-8">
      <div className="container mx-auto px-0">
        <div className="relative h-[400px] md:h-[500px] lg:h-[600px] rounded-2xl overflow-hidden">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              className="absolute inset-0 cursor-pointer"
              onClick={handleBannerClick}
            >
              {/* Banner Image */}
              <div className="relative w-full h-full">
                <img
                  src={banners[currentIndex].image_url}
                  alt={banners[currentIndex].title}
                  className="w-full h-full object-cover"
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 gradient-banner-overlay" />
                
                {/* Content */}
                <div className="absolute inset-0 flex items-end justify-start p-6 md:p-12 lg:p-16">
                  <div className="max-w-2xl space-y-3 md:space-y-4 text-right" dir="rtl">
                    <motion.h2
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground"
                    >
                      {banners[currentIndex].title}
                    </motion.h2>
                    
                    {banners[currentIndex].subtitle && (
                      <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-base md:text-xl lg:text-2xl text-muted-foreground"
                      >
                        {banners[currentIndex].subtitle}
                      </motion.p>
                    )}
                    
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <UnifiedButton 
                        variant="primary"
                        className="shadow-xl"
                      >
                        اكتشف المزيد
                      </UnifiedButton>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="absolute inset-0 flex items-center justify-between p-4 pointer-events-none">
            <UnifiedButton
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                handlePrevious();
              }}
              className="pointer-events-auto bg-background/80 backdrop-blur-sm hover:bg-background border-border/50 shadow-lg h-10 w-10 md:h-12 md:w-12"
            >
              <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
            </UnifiedButton>
            
            <UnifiedButton
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="pointer-events-auto bg-background/80 backdrop-blur-sm hover:bg-background border-border/50 shadow-lg h-10 w-10 md:h-12 md:w-12"
            >
              <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
            </UnifiedButton>
          </div>

          {/* Indicators */}
          <div className="absolute bottom-4 md:bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 pointer-events-none">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(index);
                  setDirection(index > currentIndex ? 1 : -1);
                }}
                className={`pointer-events-auto h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'w-8 bg-primary' 
                    : 'w-2 bg-background/60 hover:bg-background/80'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
