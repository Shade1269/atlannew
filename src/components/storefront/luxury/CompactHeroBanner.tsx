import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Sparkles } from 'lucide-react';

interface CompactHeroBannerProps {
  title?: string;
  subtitle?: string;
  backgroundImage?: string;
  onShopNow?: () => void;
}

export const CompactHeroBanner: React.FC<CompactHeroBannerProps> = ({
  title = 'مجموعة الشتاء الجديدة',
  subtitle = 'خصم حتى 40% على أحدث التصاميم',
  backgroundImage = 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1920',
  onShopNow,
}) => {
  return (
    <section className="relative h-[50vh] md:h-[60vh] overflow-hidden">
      {/* Background Image */}
      <motion.div 
        className="absolute inset-0"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
      >
        <img 
          src={backgroundImage}
          alt=""
          className="w-full h-full object-cover"
        />
        <div 
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(90deg, hsla(20, 15%, 5%, 0.9) 0%, hsla(20, 15%, 5%, 0.4) 50%, transparent 100%),
              linear-gradient(180deg, transparent 0%, hsla(20, 15%, 5%, 0.5) 100%)
            `,
          }}
        />
      </motion.div>

      {/* Content */}
      <div className="relative h-full container mx-auto px-6 flex items-center">
        <motion.div
          className="max-w-lg"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
            style={{
              background: 'hsla(38, 90%, 50%, 0.2)',
              border: '1px solid hsla(38, 80%, 50%, 0.4)',
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span 
              className="text-xs tracking-widest uppercase"
              style={{ color: 'hsl(38, 80%, 65%)' }}
            >
              وصل حديثاً
            </span>
          </motion.div>

          {/* Title */}
          <h2 
            className="text-3xl md:text-5xl lg:text-6xl mb-4 leading-tight"
            style={{ 
              fontFamily: "'Playfair Display', serif",
              color: 'hsl(38, 20%, 95%)',
            }}
          >
            {title}
          </h2>

          {/* Subtitle */}
          <p 
            className="text-lg md:text-xl mb-8 opacity-80"
            style={{ color: 'hsl(38, 30%, 80%)' }}
          >
            {subtitle}
          </p>

          {/* CTA Button */}
          <motion.button
            onClick={onShopNow}
            className="group flex items-center gap-3 px-8 py-4 text-sm font-medium tracking-wider uppercase"
            style={{
              background: 'linear-gradient(135deg, hsl(38, 90%, 50%), hsl(43, 85%, 50%))',
              color: 'hsl(20, 15%, 8%)',
              borderRadius: '4px',
              boxShadow: '0 15px 50px hsla(38, 90%, 45%, 0.35)',
            }}
            whileHover={{ scale: 1.02, boxShadow: '0 20px 60px hsla(38, 90%, 45%, 0.4)' }}
            whileTap={{ scale: 0.98 }}
          >
            تسوقي الآن
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          </motion.button>
        </motion.div>
      </div>

      {/* Decorative Elements */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-20"
        style={{
          background: 'linear-gradient(to top, hsl(20, 12%, 6%), transparent)',
        }}
      />
    </section>
  );
};
