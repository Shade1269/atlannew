import React from 'react';
import './LandingSections.css';
import { useInView } from '@/hooks/useInView';
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
  ArrowRight,
  LayoutDashboard,
  Settings,
  Trophy,
  Check,
  Circle,
} from 'lucide-react';
import { UnifiedButton } from '@/components/design-system';
import { useFastAuth } from '@/hooks/useFastAuth';
import { useAffiliateStore } from '@/hooks/useAffiliateStore';
import { useLanguage } from '@/contexts/LanguageContext';
import { useHonorBoard } from '@/hooks/useHonorBoard';
import { useMarketerGoals } from '@/hooks/useMarketerGoals';
import type { GoalStep } from '@/hooks/useMarketerGoals';

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

      {/* آراء العملاء */}
      <TestimonialsSection />

      {/* أسئلة شائعة */}
      <FAQSection />

      {/* CTA Section */}
      <CTASection onNavigate={onNavigate} />
    </div>
  );
};

/** شريط تقدم أهداف المسوق — إنشئ متجرك، أضف المنتجات، ابدأ التسويق، الإحالات */
const GoalsProgressBar: React.FC<{
  steps: GoalStep[];
  completedCount: number;
  percent: number;
  loading: boolean;
  t: (key: string) => string;
}> = ({ steps, completedCount, percent, loading, t }) => {
  const labelKey: Record<string, string> = {
    store: t('goalCreateStore'),
    products: t('goalAddProducts'),
    marketing: t('goalStartMarketing'),
    referrals: t('goalReferrals'),
  };
  if (loading || steps.length === 0) return null;
  return (
    <div className="goals-progress-wrap mt-6 pt-6 border-t border-primary/15">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-foreground">{t('goalsTitle')}</span>
        <span className="text-xs font-medium text-primary">{completedCount}/{steps.length}</span>
      </div>
      <div className="goals-progress-track">
        <div className="goals-progress-fill" style={{ ['--goals-percent' as string]: `${percent}%` }} />
      </div>
      <p className="text-xs text-muted-foreground mt-1.5 mb-3">{t('goalsEncouragement')}</p>
      <div className="grid grid-cols-2 gap-2">
        {steps.map((step) => (
          <div
            key={step.key}
            className={`goals-progress-step ${step.done ? 'done' : ''}`}
          >
            {step.done ? (
              <Check className="w-4 h-4 text-primary shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-muted-foreground/60 shrink-0" />
            )}
            <span className="goals-progress-step-label">{labelKey[step.key] || step.key}</span>
            {step.value != null && step.value > 0 && (
              <span className="goals-progress-step-value">{step.value}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/** منصة الشرف — منصة فعلية للأول والثاني والثالث، والباقي في مربعات منسقة */
const HonorBoardCard: React.FC<{
  onNavigate: (path: string) => void;
  t: (key: string) => string;
}> = ({ onNavigate, t }) => {
  const { topStores, topReferrers, loading } = useHonorBoard();
  const podiumStores = topStores.slice(0, 3);
  const restStores = topStores.slice(3, 11);
  const podiumReferrers = topReferrers.slice(0, 3);
  const restReferrers = topReferrers.slice(3, 11);

  return (
    <div className="honor-board rounded-2xl p-6 shadow-xl transition-all duration-300 relative overflow-hidden landing-fade-in landing-hover-lift">
      <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl" />
      <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-accent/10 to-transparent rounded-full blur-2xl" />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Trophy className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">{t('honorBoardTitle')}</h3>
            <p className="text-xs text-muted-foreground">{t('honorBoardDescription')}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10 gap-2">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">{t('loading')}</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* ترتيب أكبر 50 متجر — منصة + مربعات */}
            <div>
              <h4 className="honor-board-section-title">
                <Store className="w-4 h-4 text-primary" />
                {t('honorBoardTopStores')}
              </h4>
              {podiumStores.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">{t('noDataYet')}</p>
              ) : (
                <>
                  <div className="honor-board-podium">
                    {[podiumStores[1], podiumStores[0], podiumStores[2]].filter(Boolean).map((s) => (
                      <div key={s.store_slug} className="honor-board-podium-slot" data-rank={s.rank}>
                        <div className="podium-avatar">
                          {s.rank === 1 ? '🥇' : s.rank === 2 ? '🥈' : '🥉'}
                        </div>
                        <span className="podium-name">{s.store_name}</span>
                        <span className="podium-value">{formatSales(s.total_sales)}</span>
                        <div className="podium-stand">{s.rank}</div>
                      </div>
                    ))}
                  </div>
                  {restStores.length > 0 && (
                    <div className="honor-board-rest">
                      {restStores.map((s) => (
                        <div key={s.store_slug} className="honor-board-rest-item">
                          <span className="rest-rank">{s.rank}</span>
                          <span className="rest-name" title={s.store_name}>{s.store_name}</span>
                          <span className="rest-value">{formatSales(s.total_sales)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ترتيب أكثر المسوقين في الإحالات — منصة + مربعات */}
            <div>
              <h4 className="honor-board-section-title">
                <TrendingUp className="w-4 h-4 text-accent" />
                {t('honorBoardTopReferrers')}
              </h4>
              {podiumReferrers.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">{t('noDataYet')}</p>
              ) : (
                <>
                  <div className="honor-board-podium">
                    {[podiumReferrers[1], podiumReferrers[0], podiumReferrers[2]].filter(Boolean).map((r) => (
                      <div key={r.profile_id} className="honor-board-podium-slot" data-rank={r.rank}>
                        <div className="podium-avatar">
                          {r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : '🥉'}
                        </div>
                        <span className="podium-name">{r.full_name || t('anonymous')}</span>
                        <span className="podium-value">{r.referral_count} {t('referrals')}</span>
                        <div className="podium-stand">{r.rank}</div>
                      </div>
                    ))}
                  </div>
                  {restReferrers.length > 0 && (
                    <div className="honor-board-rest">
                      {restReferrers.map((r) => (
                        <div key={r.profile_id} className="honor-board-rest-item">
                          <span className="rest-rank">{r.rank}</span>
                          <span className="rest-name" title={r.full_name || t('anonymous')}>{r.full_name || t('anonymous')}</span>
                          <span className="rest-value">{r.referral_count} {t('referrals')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

function formatSales(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

// User Types Section (Platform for Everyone)
const UserTypesSection: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const { profile } = useFastAuth();
  const { store: affiliateStore } = useAffiliateStore();
  const { t } = useLanguage();
  const marketerGoals = useMarketerGoals(profile?.id ?? null, affiliateStore?.id ?? null);
  
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

  const isLoggedIn = !!profile;

  return (
    <section className="pt-8 pb-16 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
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
            const shapeClass = index === 0 ? 'shape-organic' : 'shape-soft';
            return (
              <div
                key={type.id}
                className={`bg-gradient-to-br ${type.gradient} border-2 border-primary/20 p-8 shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden landing-fade-in landing-hover-lift landing-delay-${index + 1} ${shapeClass}`}
              >
                {/* Decorative Background */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-2xl" />
                
                {/* Icon */}
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${
                  type.color === 'primary' ? 'bg-primary/10' : 'bg-accent/10'
                }`}>
                  <Icon className={`w-8 h-8 ${
                    type.color === 'primary' ? 'text-primary' : 'text-accent'
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
                        type.color === 'primary' ? 'bg-primary/10' : 'bg-accent/10'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${
                          type.color === 'primary' ? 'bg-primary' : 'bg-accent'
                        }`} />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Buttons — ألوان ثيم واضحة في النهاري والليلي */}
                {type.id === 'marketer' && isMarketer ? (
                  <>
                    <div className="flex gap-3 flex-wrap">
                      <UnifiedButton
                        variant="outline"
                        size="lg"
                        onClick={type.onClick}
                        className="flex-1 min-w-[140px] gap-2 border-primary text-primary hover:bg-primary/10 dark:border-primary dark:text-primary dark:hover:bg-primary/20"
                      >
                        {type.buttonText}
                        <ArrowRight className="w-4 h-4" />
                      </UnifiedButton>
                      <UnifiedButton
                        variant="primary"
                        size="lg"
                        onClick={() => onNavigate('/products')}
                        className="flex-1 min-w-[140px] gap-2 bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-primary dark:text-primary-foreground"
                      >
                        <Package className="w-4 h-4" />
                        {t('browseProducts')}
                      </UnifiedButton>
                    </div>
                    <GoalsProgressBar
                      steps={marketerGoals.steps}
                      completedCount={marketerGoals.completedCount}
                      percent={marketerGoals.percent}
                      loading={marketerGoals.loading}
                      t={t}
                    />
                  </>
                ) : (
                  <UnifiedButton
                    variant={type.color === 'primary' ? 'primary' : 'outline'}
                    size="lg"
                    onClick={type.onClick}
                    className={`w-full gap-2 ${type.color === 'secondary' ? 'border-primary text-primary hover:bg-primary/10 dark:border-primary dark:text-primary dark:hover:bg-primary/20' : ''}`}
                  >
                    {type.buttonText}
                    <ArrowRight className="w-4 h-4" />
                  </UnifiedButton>
                )}
              </div>
            );
          })}

          {/* عند تسجيل الدخول: منصة الشرف — أكبر 50 متجر + أكثر المسوقين إحالة */}
          {isLoggedIn && (
            <HonorBoardCard onNavigate={onNavigate} t={t} />
          )}
        </div>
      </div>
    </section>
  );
};

// How It Works Section — كروت واضحة + لون ثيم + شكل أفضل
const HowItWorksSection: React.FC = () => {
  const { t } = useLanguage();
  const steps = [
    { number: '01', title: t('step1Title'), description: t('step1Description'), icon: Store, color: 'primary' as const },
    { number: '02', title: t('step2Title'), description: t('step2Description'), icon: TrendingUp, color: 'secondary' as const },
    { number: '03', title: t('step3Title'), description: t('step3Description'), icon: Target, color: 'accent' as const },
  ];

  return (
    <section className="py-12 px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-60" aria-hidden>
        <div className="landing-loop-shape landing-loop-shape-1" />
        <div className="landing-loop-shape landing-loop-shape-2" />
      </div>

      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="text-center mb-16 landing-fade-in">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 gradient-text" dir="ltr">
            {t('howItWorks')}
          </h2>
          <p className="text-xl md:text-2xl text-foreground/80 max-w-3xl mx-auto">
            {t('howItWorksDescription')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const iconBg = step.color === 'primary' ? 'bg-primary/20' : step.color === 'secondary' ? 'bg-secondary/20' : 'bg-accent/20';
            const iconColor = step.color === 'primary' ? 'text-primary' : step.color === 'secondary' ? 'text-secondary' : 'text-accent';
            const numColor = step.color === 'primary' ? 'text-primary' : step.color === 'secondary' ? 'text-secondary' : 'text-accent';
            const shapeClass = index === 0 ? 'shape-organic' : index === 1 ? 'shape-soft' : 'shape-card-alt';
            return (
              <div key={step.number} className={`relative landing-fade-in landing-delay-${index + 1}`}>
                <div className={`relative h-full bg-card border-2 border-primary/30 dark:border-primary/50 p-8 shadow-xl hover:shadow-2xl hover:border-primary/50 dark:hover:border-primary/70 transition-all duration-300 group ${shapeClass}`}>
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${iconBg} ${iconColor} group-hover:scale-110 transition-transform`}>
                      <Icon className="w-8 h-8" />
                    </div>
                    <span className={`text-4xl font-black opacity-90 ${numColor}`}>{step.number}</span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-foreground/85 leading-relaxed text-base">
                    {step.description}
                  </p>
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -left-4 w-8 h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
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

// Features Section — أربع منحنيات أسفل بعض بعرض الشاشة، برتقالي وتركواز
const FeaturesSection: React.FC<{ onNavigate: (path: string) => void }> = () => {
  const { t } = useLanguage();
  const features = [
    { icon: Store, title: t('feature1Title'), description: t('feature1Description') },
    { icon: TrendingUp, title: t('feature2Title'), description: t('feature2Description') },
    { icon: Shield, title: t('feature3Title'), description: t('feature3Description') },
    { icon: Zap, title: t('feature4Title'), description: t('feature4Description') },
  ];

  return (
    <section className="relative w-full z-10 pt-12 pb-4">
      {/* شكل الموجة السلس من الجنبين — بدون حدود حادة (منحنيات Bezier) */}
      <svg width="0" height="0" className="absolute" aria-hidden>
        <defs>
          {/* الشريحة الأولى: أعلى مستقيم، أسفل متموج (اتصال بالمحتوى فوق) */}
          <clipPath id="waveSmoothBottom" clipPathUnits="objectBoundingBox">
            <path d="M0,0 L1,0 L1,0.88 Q0.875,0.82 0.75,0.88 Q0.625,0.94 0.5,0.88 Q0.375,0.82 0.25,0.88 Q0.125,0.94 0,0.88 Z" />
          </clipPath>
          {/* موجة واحدة كبيرة لكل شريحة — تموج أقوى، من الطرفين */}
          <clipPath id="waveBothEdges" clipPathUnits="objectBoundingBox">
            <path d="M0,0.2 Q0.25,0.02 0.5,0.04 Q0.75,0.02 1,0.2 L1,0.8 Q0.75,0.98 0.5,0.96 Q0.25,0.98 0,0.8 Z" />
          </clipPath>
        </defs>
      </svg>
      <div className="container mx-auto px-4 text-center mb-10">
        <h2 className="text-3xl md:text-5xl font-black gradient-text mb-2">
          {t('platformFeatures')}
        </h2>
        <p className="text-foreground/80 text-lg">
          {t('platformFeaturesDescription')}
        </p>
      </div>
      <div className="relative w-full">
      {features.map((feature, index) => {
        const Icon = feature.icon;
        return (
          <WaveStripWithScroll key={feature.title} index={index}>
          <div
            className={`wave-strip wave-strip-${index + 1} wave-frame-both`}
          >
            <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
              <svg className="wave-sea-pattern" viewBox="0 0 400 100" preserveAspectRatio="none">
                <path fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" d="M0,50 Q50,20 100,50 T200,50 T300,50 T400,50" />
                <path fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" d="M0,60 Q50,30 100,60 T200,60 T300,60 T400,60" />
              </svg>
            </div>
            <div className="wave-strip-content">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="flex flex-wrap items-center justify-center gap-3 mb-2">
                  <div className="w-14 h-14 rounded-xl bg-white/25 flex items-center justify-center border-2 border-white/50 shrink-0">
                    <Icon className="w-7 h-7 text-white" strokeWidth={2} />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white drop-shadow-md">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-white text-lg md:text-xl leading-relaxed max-w-2xl drop-shadow-sm">
                  {feature.description}
                </p>
              </div>
            </div>
          </div>
          </WaveStripWithScroll>
        );
      })}
      </div>
    </section>
  );
};

const WaveStripWithScroll: React.FC<{ children: React.ReactNode; index: number }> = ({ children, index }) => {
  const [visible, ref] = useInView({ threshold: 0.12 });
  return (
    <div ref={ref} className={`wave-strip-scroll-wrap ${visible ? 'wave-strip-visible' : ''}`} style={{ ['--strip-index' as string]: index }}>
      {children}
    </div>
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
    <section className="py-12 px-4 relative">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12 landing-fade-in">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 gradient-text" dir="ltr">
            {t('whyChooseUs')}
          </h2>
          <p className="text-xl md:text-2xl text-foreground/80 max-w-3xl mx-auto">
            {t('whyChooseUsDescription')}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            const shapeClass = [ 'shape-organic', 'shape-soft', 'shape-card-alt', 'shape-organic', 'shape-soft', 'shape-card-alt' ][index % 6];
            return (
              <div
                key={benefit.title}
                className={`text-center landing-fade-in-scale landing-delay-${Math.min(index + 1, 6)} p-4 bg-card/80 border border-primary/20 ${shapeClass}`}
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4 shape-blob">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {benefit.title}
                </h3>
                <p className="text-sm text-foreground/85">
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

// آراء العملاء
const TestimonialsSection: React.FC = () => {
  const { t } = useLanguage();
  const testimonials = [
    { name: t('testimonial1Name'), role: t('testimonial1Role'), text: t('testimonial1Text') },
    { name: t('testimonial2Name'), role: t('testimonial2Role'), text: t('testimonial2Text') },
    { name: t('testimonial3Name'), role: t('testimonial3Role'), text: t('testimonial3Text') },
  ];
  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12 landing-fade-in">
          <h2 className="text-4xl md:text-5xl font-black gradient-text mb-4">
            {t('testimonialsTitle')}
          </h2>
          <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
            {t('testimonialsDescription')}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((item, index) => (
            <div
              key={item.name}
              className={`landing-fade-in-scale landing-delay-${index + 1} p-6 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow shape-soft`}
            >
              <p className="text-foreground/90 mb-4 leading-relaxed">&ldquo;{item.text}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">{item.name}</div>
                  <div className="text-sm text-muted-foreground">{item.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// أسئلة شائعة
const FAQSection: React.FC = () => {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);
  const faqs = [
    { q: t('faq1Question'), a: t('faq1Answer') },
    { q: t('faq2Question'), a: t('faq2Answer') },
    { q: t('faq3Question'), a: t('faq3Answer') },
  ];
  return (
    <section className="py-16 px-4">
      <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-12 landing-fade-in">
          <h2 className="text-4xl md:text-5xl font-black gradient-text mb-4">
            {t('faqTitle')}
          </h2>
          <p className="text-lg text-foreground/80">
            {t('faqDescription')}
          </p>
        </div>
        <div className="space-y-2">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`landing-fade-in landing-delay-${index + 1} rounded-xl border border-border bg-card overflow-hidden`}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-right hover:bg-muted/50 transition-colors"
              >
                <span className="font-semibold text-foreground">{faq.q}</span>
                <ArrowRight
                  className={`w-5 h-5 shrink-0 text-muted-foreground transition-transform ${openIndex === index ? 'rotate-90' : ''}`}
                />
              </button>
              {openIndex === index && (
                <div className="px-5 pb-4 text-muted-foreground text-sm leading-relaxed border-t border-border pt-2">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// CTA Section
const CTASection: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const { t } = useLanguage();
  return (
    <section className="py-28 px-4 bg-gradient-to-br from-primary via-primary/90 to-accent relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,rgba(255,255,255,0.15),transparent_60%)]" />
      <div className="absolute top-0 left-0 right-0 h-24 pointer-events-none" aria-hidden>
        <svg viewBox="0 0 1440 96" fill="currentColor" className="w-full h-full text-muted/30" preserveAspectRatio="none">
          <path d="M0 96V48C360 0 720 0 1080 48S1440 96 1440 96H0z" />
        </svg>
      </div>
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
              variant="primary"
              size="lg"
              onClick={() => onNavigate('/auth')}
              className="min-w-[200px]"
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
