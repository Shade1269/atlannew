import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';

interface LuxuryHeroProps {
  storeName: string;
  avatarUrl?: string;
  subtitle?: string;
  description?: string;
  onEnterShowroom?: () => void;
  onViewCollection?: () => void;
}

export const LuxuryHero: React.FC<LuxuryHeroProps> = ({
  storeName,
  avatarUrl,
  subtitle = 'أناقة شرقية • فخامة مختارة',
  description = 'اكتشفي مجموعتنا الحصرية في صالة عرض 360° غامرة. كل قطعة تروي قصة من التراث والحرفية والجمال الخالد.',
  onEnterShowroom,
  onViewCollection,
}) => {
  return (
    <section 
      className="min-h-screen flex flex-col items-center justify-center relative pt-20"
      style={{
        background: `
          radial-gradient(ellipse 80% 50% at 50% 30%, hsla(30, 40%, 15%, 0.4) 0%, transparent 60%),
          linear-gradient(180deg, hsl(20, 12%, 8%) 0%, hsl(20, 12%, 6%) 100%)
        `,
      }}
    >
      {/* Ambient Light Effect */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 40%, hsla(38, 80%, 50%, 0.05) 0%, transparent 50%)',
        }}
      />

      <motion.div 
        className="container mx-auto px-6 text-center relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Avatar */}
        {avatarUrl && (
          <motion.div
            className="mb-8"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div 
              className="w-32 h-32 md:w-40 md:h-40 mx-auto rounded-full overflow-hidden"
              style={{
                border: '3px solid hsla(38, 60%, 50%, 0.3)',
                boxShadow: '0 0 60px hsla(38, 80%, 50%, 0.15)',
              }}
            >
              <img 
                src={avatarUrl} 
                alt={storeName}
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>
        )}

        {/* Subtitle */}
        <motion.p
          className="text-xs md:text-sm tracking-[0.4em] uppercase mb-6"
          style={{ color: 'hsl(38, 80%, 55%)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {subtitle}
        </motion.p>

        {/* Main Title */}
        <motion.h1
          className="text-4xl md:text-6xl lg:text-7xl mb-4"
          style={{ 
            fontFamily: "'Playfair Display', serif",
            fontWeight: 400,
            color: 'hsl(38, 25%, 90%)',
          }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          حيث التراث
        </motion.h1>
        
        <motion.h2
          className="text-4xl md:text-6xl lg:text-7xl mb-8 italic"
          style={{ 
            fontFamily: "'Playfair Display', serif",
            fontWeight: 300,
            color: 'hsl(38, 80%, 55%)',
          }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          يلتقي الأناقة
        </motion.h2>

        {/* Description */}
        <motion.p
          className="max-w-xl mx-auto text-sm md:text-base leading-relaxed mb-12 opacity-70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          {description}
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
        >
          <motion.button
            onClick={onEnterShowroom}
            className="px-8 py-4 text-sm tracking-[0.2em] uppercase font-medium"
            style={{
              background: 'linear-gradient(135deg, hsl(38, 90%, 50%), hsl(43, 85%, 55%))',
              color: 'hsl(20, 12%, 5%)',
              borderRadius: '2px',
            }}
            whileHover={{ scale: 1.02, boxShadow: '0 10px 40px hsla(38, 90%, 50%, 0.3)' }}
            whileTap={{ scale: 0.98 }}
          >
            ادخلي صالة العرض
          </motion.button>

          <motion.button
            onClick={onViewCollection}
            className="px-8 py-4 text-sm tracking-[0.2em] uppercase font-medium"
            style={{
              background: 'transparent',
              color: 'hsl(38, 25%, 90%)',
              border: '1px solid hsla(38, 30%, 50%, 0.3)',
              borderRadius: '2px',
            }}
            whileHover={{ 
              scale: 1.02, 
              borderColor: 'hsla(38, 90%, 50%, 0.5)',
              boxShadow: '0 0 30px hsla(38, 90%, 50%, 0.1)' 
            }}
            whileTap={{ scale: 0.98 }}
          >
            شاهدي المجموعة
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="opacity-40"
        >
          <ArrowDown className="w-6 h-6" />
        </motion.div>
      </motion.div>
    </section>
  );
};
