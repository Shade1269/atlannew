import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { useLuxuryTheme } from './LuxuryThemeContext';

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  description?: string;
  ctaText: string;
  ctaLink: string;
  image?: string;
  video?: string;
  overlay?: 'dark' | 'light' | 'gradient';
  textPosition?: 'left' | 'center' | 'right';
}

interface HeroSliderProps {
  slides: HeroSlide[];
  autoPlay?: boolean;
  interval?: number;
  showControls?: boolean;
  showDots?: boolean;
  parallax?: boolean;
  onCtaClick: (link: string) => void;
}

export function HeroSlider({
  slides,
  autoPlay = true,
  interval = 6000,
  showControls = true,
  showDots = true,
  parallax = true,
  onCtaClick,
}: HeroSliderProps) {
  const { colors, isDark } = useLuxuryTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  // Parallax effect
  useEffect(() => {
    if (!parallax) return;
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [parallax]);

  // Auto play
  useEffect(() => {
    if (!autoPlay || isPaused || slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, interval);
    return () => clearInterval(timer);
  }, [autoPlay, isPaused, interval, slides.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const current = slides[currentIndex];

  return (
    <section 
      className="relative h-[70vh] md:h-[85vh] overflow-hidden transition-colors duration-500"
      style={{
        background: colors.background,
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      dir="rtl"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0"
        >
          {/* Background Media */}
          <div
            className="absolute inset-0"
            style={{
              transform: parallax ? `translateY(${scrollY * 0.3}px)` : 'none',
            }}
          >
            {current.video ? (
              <video
                src={current.video}
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover scale-110"
              />
            ) : current.image ? (
              <motion.img
                src={current.image}
                alt=""
                className="w-full h-full object-cover"
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 8, ease: 'linear' }}
                onError={(e) => {
                  console.error('Failed to load hero image:', current.image);
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div 
                className="w-full h-full"
                style={{
                  background: colors.gradientSection,
                }}
              />
            )}
          </div>

          {/* بدون أي غشاء — البانر مضيء تماماً */}
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="absolute inset-0 flex items-center">
        <div className="container mx-auto px-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              className={`max-w-2xl flex flex-col ${current.textPosition === 'center' ? 'items-center text-center mx-auto' : 'items-start text-right'}`}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
            {/* Subtitle */}
            <motion.span
              className="text-sm md:text-base tracking-[0.3em] uppercase mb-4 font-medium"
              style={{ color: colors.accent }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {current.subtitle}
            </motion.span>

            {/* Title */}
            <motion.h1
              className="text-4xl md:text-6xl lg:text-7xl mb-6 leading-tight font-bold"
              style={{
                fontFamily: "'Playfair Display', serif",
                color: colors.text,
              }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {current.title}
            </motion.h1>

            {/* Description */}
            {current.description && (
              <motion.p
                className="text-lg md:text-xl mb-8 max-w-lg"
                style={{ color: colors.textSecondary }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                {current.description}
              </motion.p>
            )}

            {/* CTA Button */}
            <motion.button
              onClick={() => onCtaClick(current.ctaLink)}
              className="group inline-flex items-center gap-3 px-8 py-4 text-sm font-bold tracking-wider uppercase rounded-sm transition-all"
              style={{
                background: colors.buttonPrimary,
                color: colors.primaryText,
                boxShadow: `0 15px 50px ${colors.shadowPrimary}`,
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              {current.ctaText}
              <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            </motion.button>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Controls */}
      {showControls && slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{
              background: isDark ? 'hsla(20, 12%, 10%, 0.6)' : 'hsla(40, 30%, 95%, 0.8)',
              border: `1px solid ${colors.borderHover}`,
              backdropFilter: 'blur(10px)',
            }}
          >
            <ChevronRight className="w-5 h-5" style={{ color: colors.accent }} />
          </button>
          <button
            onClick={nextSlide}
            className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{
              background: isDark ? 'hsla(20, 12%, 10%, 0.6)' : 'hsla(40, 30%, 95%, 0.8)',
              border: `1px solid ${colors.borderHover}`,
              backdropFilter: 'blur(10px)',
            }}
          >
            <ChevronLeft className="w-5 h-5" style={{ color: colors.accent }} />
          </button>
        </>
      )}

      {/* Dots & Play/Pause */}
      {showDots && slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
          {/* Play/Pause Button */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
            style={{
              background: isDark ? 'hsla(20, 12%, 10%, 0.6)' : 'hsla(40, 30%, 95%, 0.8)',
              border: `1px solid ${colors.borderHover}`,
            }}
          >
            {isPaused ? (
              <Play className="w-4 h-4" style={{ color: colors.accent }} />
            ) : (
              <Pause className="w-4 h-4" style={{ color: colors.accent }} />
            )}
          </button>

          {/* Dots */}
          <div className="flex items-center gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToSlide(idx)}
                className="relative h-1 rounded-full transition-all overflow-hidden"
                style={{
                  width: idx === currentIndex ? '40px' : '20px',
                  background: colors.accentMuted,
                }}
              >
                {idx === currentIndex && (
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ background: colors.primary }}
                    initial={{ scaleX: 0, originX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: interval / 1000, ease: 'linear' }}
                    key={`progress-${currentIndex}`}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
