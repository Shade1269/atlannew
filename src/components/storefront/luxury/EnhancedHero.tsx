import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowDown, Sparkles, Star } from 'lucide-react';

interface EnhancedHeroProps {
  storeName: string;
  avatarUrl?: string;
  subtitle?: string;
  description?: string;
  onEnterShowroom?: () => void;
  onViewCollection?: () => void;
}

// Floating particle component
const FloatingParticle: React.FC<{ delay: number; size: number }> = ({ delay, size }) => (
  <motion.div
    className="absolute rounded-full"
    style={{
      width: size,
      height: size,
      background: 'radial-gradient(circle, hsla(38, 90%, 60%, 0.8) 0%, transparent 70%)',
      filter: 'blur(1px)',
    }}
    initial={{ 
      x: Math.random() * 100 + '%', 
      y: '100%', 
      opacity: 0,
      scale: 0 
    }}
    animate={{ 
      y: '-20%', 
      opacity: [0, 1, 1, 0],
      scale: [0, 1, 1, 0.5]
    }}
    transition={{ 
      duration: 8 + Math.random() * 4, 
      delay,
      repeat: Infinity,
      ease: 'linear'
    }}
  />
);

export const EnhancedHero: React.FC<EnhancedHeroProps> = ({
  storeName,
  avatarUrl,
  subtitle = 'أناقة شرقية • فخامة مختارة',
  description = 'اكتشفي مجموعتنا الحصرية في صالة عرض 360° غامرة. كل قطعة تروي قصة من التراث والحرفية والجمال الخالد.',
  onEnterShowroom,
  onViewCollection,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start']
  });
  
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  // Generate particles
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    delay: i * 0.5,
    size: Math.random() * 4 + 2
  }));

  // Typewriter effect for subtitle
  const [displayedText, setDisplayedText] = useState('');
  const fullText = 'حيث التراث يلتقي الأناقة';
  
  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index <= fullText.length) {
        setDisplayedText(fullText.slice(0, index));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 100);
    return () => clearInterval(timer);
  }, []);

  return (
    <section 
      ref={containerRef}
      className="min-h-screen flex flex-col items-center justify-center relative pt-20 overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse 120% 80% at 50% 20%, hsla(30, 50%, 12%, 0.6) 0%, transparent 50%),
          radial-gradient(ellipse 80% 60% at 20% 80%, hsla(38, 60%, 15%, 0.3) 0%, transparent 40%),
          radial-gradient(ellipse 60% 40% at 80% 60%, hsla(25, 40%, 10%, 0.4) 0%, transparent 40%),
          linear-gradient(180deg, hsl(20, 14%, 6%) 0%, hsl(20, 12%, 5%) 100%)
        `,
      }}
    >
      {/* Animated Background Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((particle) => (
          <FloatingParticle key={particle.id} delay={particle.delay} size={particle.size} />
        ))}
      </div>

      {/* Ambient Light Orbs */}
      <motion.div 
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, hsla(38, 80%, 50%, 0.08) 0%, transparent 60%)',
          filter: 'blur(60px)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
      
      <motion.div 
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, hsla(25, 60%, 40%, 0.06) 0%, transparent 60%)',
          filter: 'blur(50px)',
        }}
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2
        }}
      />

      <motion.div 
        className="container mx-auto px-6 text-center relative z-10"
        style={{ y, opacity, scale }}
      >
        {/* Decorative Top Element */}
        <motion.div
          className="flex items-center justify-center gap-4 mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
          <Sparkles className="w-4 h-4 text-amber-500/60" />
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
        </motion.div>

        {/* Avatar with Glow Ring */}
        {avatarUrl && (
          <motion.div
            className="mb-10 relative"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 0.2, type: 'spring', stiffness: 100 }}
          >
            {/* Animated Ring */}
            <motion.div
              className="absolute inset-0 m-auto w-36 h-36 md:w-44 md:h-44 rounded-full"
              style={{
                border: '1px solid hsla(38, 80%, 50%, 0.3)',
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute inset-0 m-auto w-40 h-40 md:w-48 md:h-48 rounded-full"
              style={{
                border: '1px dashed hsla(38, 60%, 50%, 0.2)',
              }}
              animate={{ rotate: -360 }}
              transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            />
            
            <div 
              className="w-32 h-32 md:w-40 md:h-40 mx-auto rounded-full overflow-hidden relative"
              style={{
                border: '2px solid hsla(38, 70%, 55%, 0.4)',
                boxShadow: `
                  0 0 60px hsla(38, 80%, 50%, 0.2),
                  inset 0 0 30px hsla(38, 80%, 50%, 0.1)
                `,
              }}
            >
              <img 
                src={avatarUrl} 
                alt={storeName}
                className="w-full h-full object-cover"
              />
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(105deg, transparent 40%, hsla(38, 90%, 70%, 0.2) 50%, transparent 60%)',
                }}
                animate={{
                  x: ['-100%', '200%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatDelay: 5,
                  ease: 'easeInOut'
                }}
              />
            </div>
          </motion.div>
        )}

        {/* Subtitle Badge */}
        <motion.div
          className="inline-flex items-center gap-2 px-6 py-2 rounded-full mb-8"
          style={{
            background: 'hsla(38, 50%, 20%, 0.3)',
            border: '1px solid hsla(38, 60%, 50%, 0.2)',
            backdropFilter: 'blur(10px)',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Star className="w-3 h-3 text-amber-500" />
          <span 
            className="text-xs md:text-sm tracking-[0.3em] uppercase"
            style={{ color: 'hsl(38, 80%, 60%)' }}
          >
            {subtitle}
          </span>
          <Star className="w-3 h-3 text-amber-500" />
        </motion.div>

        {/* Main Title with Typewriter */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <h1
            className="text-5xl md:text-7xl lg:text-8xl mb-2"
            style={{ 
              fontFamily: "'Playfair Display', serif",
              fontWeight: 400,
              color: 'hsl(38, 20%, 92%)',
              textShadow: '0 4px 30px hsla(38, 80%, 50%, 0.1)'
            }}
          >
            {storeName}
          </h1>
          
          <motion.p
            className="text-2xl md:text-3xl lg:text-4xl italic min-h-[3rem]"
            style={{ 
              fontFamily: "'Playfair Display', serif",
              fontWeight: 300,
              color: 'hsl(38, 85%, 55%)',
            }}
          >
            {displayedText}
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="inline-block w-0.5 h-8 bg-amber-500 ml-1 align-middle"
            />
          </motion.p>
        </motion.div>

        {/* Description */}
        <motion.p
          className="max-w-2xl mx-auto text-sm md:text-base leading-relaxed mt-8 mb-12"
          style={{ color: 'hsla(38, 20%, 80%, 0.7)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
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
            className="group relative px-10 py-5 text-sm tracking-[0.2em] uppercase font-medium overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, hsl(38, 90%, 50%), hsl(43, 90%, 52%))',
              color: 'hsl(20, 15%, 8%)',
              borderRadius: '4px',
              boxShadow: '0 10px 40px hsla(38, 90%, 50%, 0.25)',
            }}
            whileHover={{ 
              scale: 1.03, 
              boxShadow: '0 20px 60px hsla(38, 90%, 50%, 0.35)' 
            }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Shine effect */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(105deg, transparent 40%, hsla(0, 0%, 100%, 0.3) 50%, transparent 60%)',
              }}
              animate={{
                x: ['-100%', '200%'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
                ease: 'easeInOut'
              }}
            />
            <span className="relative flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              ادخلي صالة العرض
            </span>
          </motion.button>

          <motion.button
            onClick={onViewCollection}
            className="px-10 py-5 text-sm tracking-[0.2em] uppercase font-medium"
            style={{
              background: 'hsla(38, 30%, 15%, 0.3)',
              color: 'hsl(38, 30%, 85%)',
              border: '1px solid hsla(38, 40%, 50%, 0.3)',
              borderRadius: '4px',
              backdropFilter: 'blur(10px)',
            }}
            whileHover={{ 
              scale: 1.03, 
              borderColor: 'hsla(38, 90%, 55%, 0.5)',
              boxShadow: '0 0 40px hsla(38, 90%, 50%, 0.15)' 
            }}
            whileTap={{ scale: 0.98 }}
          >
            شاهدي المجموعة
          </motion.button>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          className="flex items-center justify-center gap-8 md:gap-16 mt-16 pt-8"
          style={{
            borderTop: '1px solid hsla(38, 30%, 30%, 0.2)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.3 }}
        >
          {[
            { value: '500+', label: 'قطعة حصرية' },
            { value: '50K+', label: 'عميلة سعيدة' },
            { value: '100%', label: 'جودة مضمونة' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <p 
                className="text-2xl md:text-3xl font-light"
                style={{ 
                  fontFamily: "'Playfair Display', serif",
                  color: 'hsl(38, 80%, 55%)' 
                }}
              >
                {stat.value}
              </p>
              <p className="text-xs tracking-wider opacity-50 mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <motion.div
          className="flex flex-col items-center gap-2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-[10px] tracking-[0.3em] uppercase opacity-40">اكتشفي المزيد</span>
          <ArrowDown className="w-5 h-5 opacity-40" />
        </motion.div>
      </motion.div>

      {/* Bottom Gradient Fade */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, hsl(20, 12%, 6%), transparent)',
        }}
      />
    </section>
  );
};
