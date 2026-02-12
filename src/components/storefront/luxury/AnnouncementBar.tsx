import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Gift, Truck, Clock, Percent } from 'lucide-react';
import { useLuxuryTheme } from './LuxuryThemeContext';

export interface Announcement {
  id: string;
  text: string;
  link?: string;
  icon?: 'gift' | 'truck' | 'clock' | 'percent';
  highlight?: boolean;
}

interface AnnouncementBarProps {
  announcements: Announcement[];
  autoRotate?: boolean;
  rotateInterval?: number;
  onClose?: () => void;
  closable?: boolean;
}

const iconMap = {
  gift: Gift,
  truck: Truck,
  clock: Clock,
  percent: Percent,
};

export function AnnouncementBar({
  announcements,
  autoRotate = true,
  rotateInterval = 4000,
  onClose,
  closable = true,
}: AnnouncementBarProps) {
  const { colors } = useLuxuryTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!autoRotate || isPaused || announcements.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, rotateInterval);

    return () => clearInterval(interval);
  }, [autoRotate, isPaused, announcements.length, rotateInterval]);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  const nextAnnouncement = () => {
    setCurrentIndex((prev) => (prev + 1) % announcements.length);
  };

  const prevAnnouncement = () => {
    setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
  };

  if (!isVisible || announcements.length === 0) return null;

  const current = announcements[currentIndex];
  const IconComponent = current.icon ? iconMap[current.icon] : null;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="relative overflow-hidden transition-colors duration-500"
      style={{
        backgroundImage: current.highlight
          ? 'linear-gradient(90deg, hsl(345, 70%, 45%), hsl(345, 70%, 55%), hsl(345, 70%, 45%))'
          : colors.topBarBg,
        backgroundSize: '200% 100%',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      dir="rtl"
    >
      {/* Animated Background */}
      <motion.div
        className="absolute inset-0"
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          backgroundImage: 'inherit',
          backgroundSize: '200% 100%',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
        }}
      />

      <div className="relative container mx-auto px-4">
        <div className="flex items-center justify-center py-2.5 gap-4">
          {/* Navigation - Right */}
          {announcements.length > 1 && (
            <button
              onClick={prevAnnouncement}
              className="p-1 hover:bg-black/10 rounded-full transition-colors"
            >
              <ChevronRight className="w-4 h-4" style={{ color: current.highlight ? 'white' : colors.topBarText }} />
            </button>
          )}

          {/* Content */}
          <div className="flex-1 flex items-center justify-center overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-2"
              >
                {IconComponent && (
                  <IconComponent 
                    className="w-4 h-4 flex-shrink-0" 
                    style={{ color: current.highlight ? 'white' : colors.topBarText }}
                  />
                )}
                {current.link ? (
                  <a
                    href={current.link}
                    className="text-xs md:text-sm font-medium hover:underline text-center"
                    style={{ color: current.highlight ? 'white' : colors.topBarText }}
                  >
                    {current.text}
                  </a>
                ) : (
                  <span
                    className="text-xs md:text-sm font-medium text-center"
                    style={{ color: current.highlight ? 'white' : colors.topBarText }}
                  >
                    {current.text}
                  </span>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation - Left */}
          {announcements.length > 1 && (
            <button
              onClick={nextAnnouncement}
              className="p-1 hover:bg-black/10 rounded-full transition-colors"
            >
              <ChevronLeft className="w-4 h-4" style={{ color: current.highlight ? 'white' : colors.topBarText }} />
            </button>
          )}

          {/* Dots Indicator */}
          {announcements.length > 1 && (
            <div className="hidden md:flex items-center gap-1.5 mr-4">
              {announcements.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className="w-1.5 h-1.5 rounded-full transition-all"
                  style={{
                    background: idx === currentIndex
                      ? colors.topBarText
                      : `${colors.topBarText}66`,
                    transform: idx === currentIndex ? 'scale(1.3)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          )}

          {/* Close Button */}
          {closable && (
            <button
              onClick={handleClose}
              className="p-1 hover:bg-black/10 rounded-full transition-colors ml-2"
            >
              <X className="w-4 h-4" style={{ color: current.highlight ? 'white' : colors.topBarText }} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
