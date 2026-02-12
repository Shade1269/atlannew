import { useState, useEffect } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { useLuxuryTheme } from './LuxuryThemeContext';

interface ScrollProgressProps {
  height?: number;
  showPercentage?: boolean;
  position?: 'top' | 'bottom';
}

export function ScrollProgress({
  height = 3,
  showPercentage = false,
  position = 'top',
}: ScrollProgressProps) {
  const { colors } = useLuxuryTheme();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const [percentage, setPercentage] = useState(0);

  useEffect(() => {
    return scrollYProgress.onChange((latest) => {
      setPercentage(Math.round(latest * 100));
    });
  }, [scrollYProgress]);

  return (
    <>
      {/* Progress Bar */}
      <motion.div
        className="fixed left-0 right-0 z-[100] origin-left"
        style={{
          [position]: 0,
          height,
          scaleX,
          background: `linear-gradient(90deg, ${colors.primary}, ${colors.accent})`,
          boxShadow: `0 0 10px ${colors.primary}`,
        }}
      />

      {/* Percentage Indicator */}
      {showPercentage && percentage > 0 && percentage < 100 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed z-[100] bottom-6 left-6 w-12 h-12 rounded-full flex items-center justify-center text-xs font-bold"
          style={{
            background: colors.backgroundSecondary,
            border: `2px solid ${colors.primary}`,
            color: colors.primary,
            backdropFilter: 'blur(10px)',
          }}
        >
          {percentage}%
        </motion.div>
      )}
    </>
  );
}
