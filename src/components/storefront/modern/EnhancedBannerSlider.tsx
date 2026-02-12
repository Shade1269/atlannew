import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { UnifiedButton } from '@/components/design-system';

interface StoreBanner {
  id: string;
  title: string;
  subtitle?: string | null;
  image_url: string;
  link_url?: string | null;
  link_type: 'product' | 'category' | 'external' | 'none';
}

interface EnhancedBannerSliderProps {
  banners: StoreBanner[];
  onBannerClick?: (banner: StoreBanner) => void;
}

export const EnhancedBannerSlider = ({ banners, onBannerClick }: EnhancedBannerSliderProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const handleNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
  }, [banners.length]);

  const handlePrevious = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  }, [banners.length]);

  // Auto-play with pause on hover
  useEffect(() => {
    if (!banners || banners.length <= 1 || isPaused) return;
    
    const timer = setInterval(handleNext, 5000);
    return () => clearInterval(timer);
  }, [currentIndex, banners, isPaused, handleNext]);

  const handleBannerClick = () => {
    if (onBannerClick && banners[currentIndex]) {
      onBannerClick(banners[currentIndex]);
    }
  };

  if (!banners || banners.length === 0) return null;

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.95
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.95
    })
  };

  const textVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.15, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const }
    })
  };

  return (
    <section 
      className="relative w-full bg-background overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="container mx-auto px-0">
        {/* Main Slider */}
        <div className="relative h-[280px] sm:h-[380px] md:h-[450px] lg:h-[550px] rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.3 },
                scale: { duration: 0.3 }
              }}
              className="absolute inset-0 cursor-pointer"
              onClick={handleBannerClick}
            >
              {/* Banner Image with Parallax Effect */}
              <motion.div 
                className="relative w-full h-full"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.4 }}
              >
                <img
                  src={banners[currentIndex].image_url}
                  alt={banners[currentIndex].title}
                  className="w-full h-full object-cover"
                  loading={currentIndex === 0 ? "eager" : "lazy"}
                />
                
                {/* Enhanced Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-transparent rtl:bg-gradient-to-l" />
                
                {/* Decorative Elements */}
                <div className="absolute top-4 left-4 md:top-8 md:left-8">
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, duration: 0.3 }}
                    className="bg-primary/20 backdrop-blur-sm rounded-full p-2 md:p-3"
                  >
                    <Sparkles className="w-4 h-4 md:w-6 md:h-6 text-primary" />
                  </motion.div>
                </div>
                
                {/* Content */}
                <div className="absolute inset-0 flex items-end justify-start p-4 sm:p-6 md:p-10 lg:p-14">
                  <div className="max-w-2xl space-y-2 sm:space-y-3 md:space-y-4 text-right" dir="rtl">
                    <motion.h2
                      custom={0}
                      variants={textVariants}
                      initial="hidden"
                      animate="visible"
                      className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight"
                    >
                      {banners[currentIndex].title}
                    </motion.h2>
                    
                    {banners[currentIndex].subtitle && (
                      <motion.p
                        custom={1}
                        variants={textVariants}
                        initial="hidden"
                        animate="visible"
                        className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-lg"
                      >
                        {banners[currentIndex].subtitle}
                      </motion.p>
                    )}
                    
                    <motion.div
                      custom={2}
                      variants={textVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <UnifiedButton 
                        variant="primary"
                        size="lg"
                        className="shadow-xl hover:shadow-2xl transition-shadow text-sm sm:text-base"
                      >
                        تسوّقي الآن
                      </UnifiedButton>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons - Hidden on mobile, visible on larger screens */}
          {banners.length > 1 && (
            <div className="hidden sm:flex absolute inset-0 items-center justify-between p-2 md:p-4 pointer-events-none">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <UnifiedButton
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevious();
                  }}
                  className="pointer-events-auto bg-background/90 backdrop-blur-md hover:bg-background border-border/30 shadow-xl h-10 w-10 md:h-12 md:w-12 rounded-full"
                >
                  <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
                </UnifiedButton>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <UnifiedButton
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  className="pointer-events-auto bg-background/90 backdrop-blur-md hover:bg-background border-border/30 shadow-xl h-10 w-10 md:h-12 md:w-12 rounded-full"
                >
                  <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
                </UnifiedButton>
              </motion.div>
            </div>
          )}

          {/* Enhanced Indicators */}
          {banners.length > 1 && (
            <div className="absolute bottom-3 sm:bottom-4 md:bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 md:gap-3 pointer-events-none">
              {banners.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(index);
                    setDirection(index > currentIndex ? 1 : -1);
                  }}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  className={`pointer-events-auto rounded-full transition-all duration-300 ${
                    index === currentIndex 
                      ? 'w-8 sm:w-10 h-2 sm:h-2.5 bg-primary shadow-lg' 
                      : 'w-2 sm:w-2.5 h-2 sm:h-2.5 bg-foreground/30 hover:bg-foreground/50'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Progress Bar */}
          {banners.length > 1 && !isPaused && (
            <motion.div 
              className="absolute bottom-0 left-0 h-1 bg-primary/80"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 5, ease: 'linear' }}
              key={currentIndex}
            />
          )}
        </div>
      </div>
    </section>
  );
};
