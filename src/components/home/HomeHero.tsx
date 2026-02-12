import { Store, Sparkles } from 'lucide-react';
import { UnifiedButton } from '@/components/design-system';
import { useNavigate } from 'react-router-dom';
import { useFastAuth } from '@/hooks/useFastAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import './HomeHero.css';

export const HomeHero = () => {
  const navigate = useNavigate();
  const { user } = useFastAuth();
  const { t } = useLanguage();

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-background">
      {/* Professional Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/3 to-accent/5 dark:from-primary/10 dark:via-secondary/5 dark:to-accent/10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.1),transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(var(--secondary)/0.1),transparent_50%)] dark:bg-[radial-gradient(circle_at_70%_80%,hsl(var(--secondary)/0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--accent)/0.05),transparent_70%)] dark:bg-[radial-gradient(circle_at_50%_50%,hsl(var(--accent)/0.1),transparent_70%)]" />
      
      {/* Animated Decorative Elements - CSS animations */}
      <div className="hero-blob hero-blob-1 absolute top-20 right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="hero-blob hero-blob-2 absolute bottom-20 left-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      <div className="hero-blob hero-blob-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 py-20 relative z-10">
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

          {/* Stats */}
          <div className="hero-fade-in hero-delay-5 mt-20 flex items-center justify-center gap-8 md:gap-12 flex-wrap">
            <StatItem value="152+" label={t('products')} />
            <div className="w-px h-12 bg-gradient-to-b from-transparent via-border to-transparent hidden md:block" />
            <StatItem value="25+" label={t('users')} />
            <div className="w-px h-12 bg-gradient-to-b from-transparent via-border to-transparent hidden md:block" />
            <StatItem value="7" label={t('stores')} />
            <div className="w-px h-12 bg-gradient-to-b from-transparent via-border to-transparent hidden md:block" />
            <StatItem value="100%" label={t('customerSatisfaction')} />
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="hero-fade-in hero-delay-5 absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="scroll-indicator w-6 h-10 border-2 border-primary/30 rounded-full flex items-start justify-center p-2">
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
