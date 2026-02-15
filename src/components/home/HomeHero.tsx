import { useRef } from 'react';
import { Store, Sparkles } from 'lucide-react';
import { UnifiedButton } from '@/components/design-system';
import { useNavigate } from 'react-router-dom';
import { useFastAuth } from '@/hooks/useFastAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCountUp } from '@/hooks/useCountUp';
import { usePlatformStats } from '@/hooks/usePlatformStats';
import './HomeHero.css';

export const HomeHero = () => {
  const navigate = useNavigate();
  const { user } = useFastAuth();
  const { t } = useLanguage();
  const statsRef = useRef<HTMLDivElement>(null);
  const { products, users, stores, satisfaction } = usePlatformStats();
  const countProducts = useCountUp(products, { suffix: '+', observedRef: statsRef });
  const countUsers = useCountUp(users, { suffix: '+', observedRef: statsRef });
  const countStores = useCountUp(stores, { observedRef: statsRef });
  const countSatisfaction = useCountUp(satisfaction, { suffix: '%', observedRef: statsRef });

  return (
    <section className="relative w-full min-h-[85vh] flex items-center justify-center overflow-hidden bg-transparent">
      {/* جزيئات خفيفة متحركة في الخلفية */}
      <div className="hero-particles" aria-hidden>
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} className="hero-particle" style={{ ['--i' as string]: i }} />
        ))}
      </div>
      {/* لوجو متحرك في الخلفية — مثلث + ألوان اللوجو */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden>
        <div className="hero-logo-bg">
          <svg viewBox="0 0 120 120" className="w-[min(70vmin,320px)] h-[min(70vmin,320px)] opacity-[0.12] dark:opacity-[0.18]">
            <defs>
              <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(24, 96%, 52%)" />
                <stop offset="100%" stopColor="hsl(166, 64%, 50%)" />
              </linearGradient>
            </defs>
            <path fill="url(#logoGrad)" d="M60 8 L100 100 L20 100 Z" />
            <path fill="none" stroke="hsl(166, 64%, 50%)" strokeWidth="2" opacity="0.6" d="M60 35 L80 85 L40 85 Z" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_30%,hsl(var(--primary)/0.08),transparent_50%)]" />
      <div className="hero-blob hero-blob-1 absolute top-20 right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl shape-blob" />
      <div className="hero-blob hero-blob-2 absolute bottom-20 left-20 w-96 h-96 bg-accent/8 rounded-full blur-3xl shape-blob" />

      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="hero-fade-in inline-flex items-center gap-2 px-6 py-3 mb-8 rounded-full bg-card/80 dark:bg-card/90 border border-primary/20 dark:border-primary/30 backdrop-blur-sm shadow-lg">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary dark:text-primary">{t('integratedEcommercePlatform')}</span>
          </div>

          {/* Main Title */}
          <h1 className="hero-fade-in hero-delay-1 text-5xl md:text-7xl lg:text-8xl font-black mb-6 tracking-tight">
            <span className="gradient-text inline-block">
              {t('platformName')}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="hero-fade-in hero-delay-2 text-2xl md:text-3xl font-light mb-4 text-foreground/80">
            {t('platformDescription')}
          </p>

          {/* Description */}
          <p className="hero-fade-in hero-delay-3 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
            {t('platformFullDescription')}
          </p>

          {/* CTA Buttons */}
          <div className="hero-fade-in hero-delay-4 flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            {!user && (
              <UnifiedButton
                variant="primary"
                size="lg"
                onClick={() => navigate('/auth')}
                className="min-w-[200px]"
              >
                <Store className="w-5 h-5 ml-2" />
                {t('startNow')}
              </UnifiedButton>
            )}
          </div>

          {/* عدادات حية — تتحرك عند الظهور */}
          <div ref={statsRef} className="hero-fade-in hero-delay-5 mt-20 flex items-center justify-center gap-8 md:gap-12 flex-wrap">
            <StatItem value={countProducts} label={t('products')} />
            <div className="w-px h-12 bg-gradient-to-b from-transparent via-border to-transparent hidden md:block" />
            <StatItem value={countUsers} label={t('users')} />
            <div className="w-px h-12 bg-gradient-to-b from-transparent via-border to-transparent hidden md:block" />
            <StatItem value={countStores} label={t('stores')} />
            <div className="w-px h-12 bg-gradient-to-b from-transparent via-border to-transparent hidden md:block" />
            <StatItem value={countSatisfaction} label={t('customerSatisfaction')} />
          </div>
        </div>
      </div>

      {/* مؤشر التمرير */}
      <div className="hero-fade-in hero-delay-5 absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="scroll-indicator w-6 h-10 border-2 border-primary/40 rounded-full flex items-start justify-center p-2">
          <div className="scroll-dot w-1.5 h-1.5 bg-primary rounded-full" />
        </div>
      </div>
    </section>
  );
};


const StatItem = ({ value, label }: { value: string; label: string }) => (
  <div className="stat-item text-center">
    <div className="text-3xl md:text-4xl font-bold gradient-text">
      {value}
    </div>
    <div className="text-sm text-muted-foreground mt-1">{label}</div>
  </div>
);
