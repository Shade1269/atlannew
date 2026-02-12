import React from 'react';
import './LandingSections.css';
import { 
  Store, 
  TrendingUp, 
  Users, 
  Shield, 
  Zap,
  Package,
  Heart,
  Globe,
  CreditCard,
  Truck,
  HeadphonesIcon,
  Target,
  Rocket,
  User,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { UnifiedButton } from '@/components/design-system';
import { useFastAuth } from '@/hooks/useFastAuth';
import { useAffiliateStore } from '@/hooks/useAffiliateStore';
import { useLanguage } from '@/contexts/LanguageContext';

interface LandingSectionsProps {
  onNavigate: (path: string) => void;
}

export const LandingSections: React.FC<LandingSectionsProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-0">
      {/* Platform for Everyone Section */}
      <UserTypesSection onNavigate={onNavigate} />

      {/* How It Works Section */}
      <HowItWorksSection />

      {/* Features Section */}
      <FeaturesSection onNavigate={onNavigate} />

      {/* Benefits Section */}
      <BenefitsSection />

      {/* CTA Section */}
      <CTASection onNavigate={onNavigate} />
    </div>
  );
};

// User Types Section (Platform for Everyone)
const UserTypesSection: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const { profile } = useFastAuth();
  const { store: affiliateStore } = useAffiliateStore();
  const { t } = useLanguage();
  
  // Check user roles
  const isMerchant = profile?.role === 'merchant';
  const isMarketer = profile?.role === 'affiliate' || profile?.role === 'marketer';
  
  const types = [
    {
      id: 'merchant',
      title: t('merchantTitle'),
      icon: Store,
      description: t('merchantDescription'),
      features: [
        t('merchantFeatures1'),
        t('merchantFeatures2'),
        t('merchantFeatures3'),
        t('merchantFeatures4'),
      ],
      color: 'primary',
      gradient: 'from-primary/10 to-primary/5',
      buttonText: isMerchant ? t('addProducts') : t('registerAsMerchant'),
      onClick: isMerchant 
        ? () => onNavigate('/merchant/products')
        : () => onNavigate('/auth?type=merchant'),
      show: !isMarketer,
    },
    {
      id: 'marketer',
      title: t('marketerTitle'),
      icon: TrendingUp,
      description: t('marketerDescription'),
      features: [
        t('marketerFeatures1'),
        t('marketerFeatures2'),
        t('marketerFeatures3'),
        t('marketerFeatures4'),
      ],
      color: 'secondary',
      gradient: 'from-secondary/10 to-secondary/5',
      buttonText: isMarketer ? t('myStore') : t('registerAsMarketer'),
      onClick: isMarketer
        ? () => {
            if (affiliateStore?.store_slug) {
              window.open(`/${affiliateStore.store_slug}`, '_blank');
            } else {
              onNavigate('/affiliate/store/setup');
            }
          }
        : () => onNavigate('/auth?type=marketer'),
      show: !isMerchant,
    },
  ].filter(type => type.show);

  return (
    <section className="py-24 px-4 bg-gradient-to-b from-background via-muted/20 to-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.03),transparent_70%)]" />
      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="text-center mb-16 landing-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-primary/10 border border-primary/20 landing-fade-in-scale">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">{t('platformForEveryone')}</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 gradient-text">
            {t('integratedPlatform')}
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t('joinPlatform')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {types.map((type, index) => {
            const Icon = type.icon;
            return (
              <div
                key={type.id}
                className={`bg-gradient-to-br ${type.gradient} rounded-2xl border border-border p-8 shadow-professional hover:shadow-professional-lg transition-all duration-300 relative overflow-hidden landing-fade-in landing-hover-lift landing-delay-${index + 1}`}
              >
                {/* Decorative Background */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-2xl" />
                
                {/* Icon */}
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${
                  type.color === 'primary' ? 'bg-primary/10' : 'bg-secondary/10'
                }`}>
                  <Icon className={`w-8 h-8 ${
                    type.color === 'primary' ? 'text-primary' : 'text-secondary'
                  }`} />
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {type.title}
                </h3>

                {/* Description */}
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {type.description}
                </p>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {type.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        type.color === 'primary' ? 'bg-primary/10' : 'bg-secondary/10'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${
                          type.color === 'primary' ? 'bg-primary' : 'bg-secondary'
                        }`} />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Buttons */}
                {type.id === 'marketer' && isMarketer ? (
                  <div className="flex gap-3">
                    <UnifiedButton
                      variant={type.color as any}
                      size="lg"
                      onClick={type.onClick}
                      className="flex-1 gap-2 dark:bg-white dark:text-black dark:border-2 dark:border-[#D4AF37] dark:hover:bg-white/90"
                    >
                      {type.buttonText}
                      <ArrowRight className="w-4 h-4" />
                    </UnifiedButton>
                    <UnifiedButton
                      variant="primary"
                      size="lg"
                      onClick={() => onNavigate('/products')}
                      className="flex-1 gap-2 dark:bg-white dark:text-black dark:border-2 dark:border-[#D4AF37] dark:hover:bg-white/90"
                    >
                      <Package className="w-4 h-4" />
                      تصفح المنتجات
                    </UnifiedButton>
                  </div>
                ) : (
                  <UnifiedButton
                    variant={type.color as any}
                    size="lg"
                    onClick={type.onClick}
                    className="w-full gap-2 dark:bg-white dark:text-black dark:border-2 dark:border-[#D4AF37] dark:hover:bg-white/90"
                  >
                    {type.buttonText}
                    <ArrowRight className="w-4 h-4" />
                  </UnifiedButton>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// How It Works Section
const HowItWorksSection: React.FC = () => {
  const { t } = useLanguage();
  const steps = [
    {
      number: '01',
      title: t('step1Title'),
      description: t('step1Description'),
      icon: Store,
      color: 'primary',
    },
    {
      number: '02',
      title: t('step2Title'),
      description: t('step2Description'),
      icon: TrendingUp,
      color: 'secondary',
    },
    {
      number: '03',
      title: t('step3Title'),
      description: t('step3Description'),
      icon: Target,
      color: 'accent',
    },
  ];

  return (
    <section className="py-24 px-4 bg-background relative">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16 landing-fade-in">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 gradient-text" dir="ltr">
            {t('howItWorks')}
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
            {t('howItWorksDescription')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className={`relative landing-fade-in landing-delay-${index + 1}`}
              >
                <div className="relative h-full bg-white rounded-2xl border border-border p-8 shadow-professional hover:shadow-professional-lg transition-all duration-300 group">
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                      step.color === 'primary' ? 'bg-primary/10' :
                      step.color === 'secondary' ? 'bg-secondary/10' :
                      step.color === 'accent' ? 'bg-accent/10' :
                      'bg-success/10'
                    } group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-8 h-8 ${
                        step.color === 'primary' ? 'text-primary' :
                        step.color === 'secondary' ? 'text-secondary' :
                        step.color === 'accent' ? 'text-accent' :
                        'text-success'
                      }`} />
                    </div>
                    <span className={`text-4xl font-black ${
                      step.color === 'primary' ? 'text-primary/20' :
                      step.color === 'secondary' ? 'text-secondary/20' :
                      step.color === 'accent' ? 'text-accent/20' :
                      'text-success/20'
                    }`}>
                      {step.number}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -left-4 w-8 h-0.5 bg-gradient-to-r from-transparent via-border to-transparent" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// Features Section
const FeaturesSection: React.FC<{ onNavigate: (path: string) => void }> = () => {
  const { t } = useLanguage();
  const features = [
    {
      icon: Store,
      title: t('feature1Title'),
      description: t('feature1Description'),
      color: 'primary',
    },
    {
      icon: TrendingUp,
      title: t('feature2Title'),
      description: t('feature2Description'),
      color: 'secondary',
    },
    {
      icon: Shield,
      title: t('feature3Title'),
      description: t('feature3Description'),
      color: 'warning',
    },
    {
      icon: Zap,
      title: t('feature4Title'),
      description: t('feature4Description'),
      color: 'info',
    },
  ];

  return (
    <section className="py-24 px-4 bg-muted/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--secondary)/0.03),transparent_70%)]" />
      
      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="text-center mb-16 landing-fade-in">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 gradient-text">
            {t('platformFeatures')}
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
            {t('platformFeaturesDescription')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className={`bg-white rounded-xl border border-border p-6 hover:border-primary/40 shadow-professional hover:shadow-professional-lg transition-all duration-300 landing-fade-in landing-hover-lift-sm landing-delay-${index + 1}`}
              >
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${
                  feature.color === 'primary' ? 'bg-primary/10' :
                  feature.color === 'secondary' ? 'bg-secondary/10' :
                  feature.color === 'success' ? 'bg-success/10' :
                  feature.color === 'premium' ? 'bg-accent/10' :
                  feature.color === 'warning' ? 'bg-warning/10' :
                  'bg-info/10'
                }`}>
                  <Icon className={`w-7 h-7 ${
                    feature.color === 'primary' ? 'text-primary' :
                    feature.color === 'secondary' ? 'text-secondary' :
                    feature.color === 'success' ? 'text-success' :
                    feature.color === 'premium' ? 'text-accent' :
                    feature.color === 'warning' ? 'text-warning' :
                    'text-info'
                  }`} />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// Benefits Section
const BenefitsSection: React.FC = () => {
  const { t } = useLanguage();
  const benefits = [
    {
      icon: Shield,
      title: t('benefit1Title'),
      description: t('benefit1Description'),
    },
    {
      icon: Zap,
      title: t('benefit2Title'),
      description: t('benefit2Description'),
    },
    {
      icon: Globe,
      title: t('benefit3Title'),
      description: t('benefit3Description'),
    },
    {
      icon: CreditCard,
      title: t('benefit4Title'),
      description: t('benefit4Description'),
    },
    {
      icon: Truck,
      title: t('benefit5Title'),
      description: t('benefit5Description'),
    },
    {
      icon: HeadphonesIcon,
      title: t('benefit6Title'),
      description: t('benefit6Description'),
    },
  ];

  return (
    <section className="py-24 px-4 bg-background">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16 landing-fade-in">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 gradient-text" dir="ltr">
            {t('whyChooseUs')}
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
            {t('whyChooseUsDescription')}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={benefit.title}
                className={`text-center landing-fade-in-scale landing-delay-${Math.min(index + 1, 6)}`}
              >
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {benefit.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// Stats Section - reserved for future use
const StatsSection: React.FC = () => {
  const stats = [
    { value: '152+', label: 'منتج', icon: Package },
    { value: '25+', label: 'مستخدم', icon: Users },
    { value: '7', label: 'متجر', icon: Store },
    { value: '100%', label: 'رضا العملاء', icon: Heart },
  ];

  return (
    <section className="py-24 px-4 bg-gradient-to-br from-primary/5 via-secondary/3 to-accent/5">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={`text-center landing-fade-in landing-delay-${index + 1}`}
              >
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <div className="text-4xl md:text-5xl font-black gradient-text mb-2">
                  {stat.value}
                </div>
                <div className="text-lg text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
void StatsSection; // Reserved for future use

// CTA Section
const CTASection: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const { t } = useLanguage();
  return (
    <section className="py-24 px-4 bg-gradient-to-br from-primary via-secondary to-accent relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]" />
      
      <div className="container mx-auto max-w-4xl relative z-10 text-center">
        <div className="landing-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 landing-fade-in-scale">
            <Rocket className="w-4 h-4 text-white" />
            <span className="text-sm font-semibold text-white">{t('startNow')}</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 text-white" dir="ltr">
            {t('readyToStart')}
          </h2>
          <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto">
            {t('joinThousands')}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <UnifiedButton
              variant="secondary"
              size="lg"
              onClick={() => onNavigate('/auth')}
              className="min-w-[200px] bg-white text-primary hover:bg-white/90 dark:bg-white dark:text-black dark:border-2 dark:border-[#D4AF37] dark:hover:bg-white/90"
            >
              <User className="w-5 h-5 ml-2" />
              {t('createFreeAccount')}
            </UnifiedButton>
          </div>
        </div>
      </div>
    </section>
  );
};
