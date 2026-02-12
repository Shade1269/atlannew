import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpLeft, Clock } from 'lucide-react';
import { useLuxuryTheme } from './LuxuryThemeContext';

interface PromoBannerProps {
  title?: string;
  subtitle?: string;
  discount?: string;
  ctaText?: string;
  onCtaClick?: () => void;
  endDate?: Date;
}

export const PromoBanner: React.FC<PromoBannerProps> = ({
  title = 'عرض الأسبوع',
  subtitle = 'خصومات حصرية على مجموعة مختارة',
  discount = '30%',
  ctaText = 'تسوقي الآن',
  onCtaClick,
}) => {
  const { colors, isDark } = useLuxuryTheme();

  return (
    <section className="py-8 md:py-12">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          className="relative overflow-hidden rounded-2xl p-8 md:p-12 transition-colors duration-500"
          style={{
            background: colors.gradientPromo,
            border: `1px solid ${colors.border}`,
          }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {/* Decorative Elements */}
          <div 
            className="absolute top-0 right-0 w-64 h-64 rounded-full"
            style={{
              background: isDark 
                ? 'radial-gradient(circle, hsla(38, 70%, 45%, 0.15) 0%, transparent 70%)'
                : 'radial-gradient(circle, hsla(20, 60%, 40%, 0.12) 0%, transparent 70%)',
              filter: 'blur(40px)',
              transform: 'translate(30%, -30%)',
            }}
          />
          <div 
            className="absolute bottom-0 left-0 w-48 h-48 rounded-full"
            style={{
              background: isDark
                ? 'radial-gradient(circle, hsla(25, 50%, 30%, 0.2) 0%, transparent 70%)'
                : 'radial-gradient(circle, hsla(38, 50%, 50%, 0.15) 0%, transparent 70%)',
              filter: 'blur(30px)',
              transform: 'translate(-30%, 30%)',
            }}
          />

          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Content */}
            <div className="text-center md:text-right">
              <motion.div 
                className="inline-flex items-center gap-2 mb-4"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Clock className="w-4 h-4" style={{ color: colors.accent }} />
                <span 
                  className="text-xs tracking-widest uppercase"
                  style={{ color: colors.accent }}
                >
                  عرض محدود
                </span>
              </motion.div>

              <h3 
                className="text-2xl md:text-3xl lg:text-4xl mb-3"
                style={{ fontFamily: "'Playfair Display', serif", color: isDark ? '#ffffff' : colors.text }}
              >
                {title}
              </h3>
              
              <p className="text-sm md:text-base max-w-md" style={{ color: isDark ? colors.accent : colors.textMuted }}>
                {subtitle}
              </p>
            </div>

            {/* Discount Badge */}
            <motion.div
              className="flex items-center gap-6"
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="text-center">
                <p 
                  className="text-5xl md:text-6xl lg:text-7xl font-bold"
                  style={{ 
                    fontFamily: "'Playfair Display', serif",
                    color: isDark ? '#ffffff' : colors.accent,
                    textShadow: isDark 
                      ? '0 0 60px hsla(38, 90%, 50%, 0.3)'
                      : '0 0 40px hsla(20, 70%, 40%, 0.2)',
                  }}
                >
                  {discount}
                </p>
                <p 
                  className="text-sm tracking-widest uppercase mt-1"
                  style={{ color: colors.accent }}
                >
                  خصم
                </p>
              </div>

              <motion.button
                onClick={onCtaClick}
                className="px-8 py-4 text-sm font-medium tracking-wide flex items-center gap-2 rounded-lg"
                style={{
                  background: colors.primaryGradient,
                  color: colors.primaryText,
                  boxShadow: `0 10px 40px ${colors.shadowPrimary}`,
                }}
                whileHover={{ scale: 1.05, boxShadow: `0 15px 50px ${colors.shadowPrimary}` }}
                whileTap={{ scale: 0.98 }}
              >
                {ctaText}
                <ArrowUpLeft className="w-4 h-4" />
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
