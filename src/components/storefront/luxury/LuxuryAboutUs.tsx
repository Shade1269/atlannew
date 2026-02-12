import { Award, Users, ShieldCheck, Sparkles, Heart, Truck, Target, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { useLuxuryTheme } from './LuxuryThemeContext';

export interface AboutContent {
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  story: string;
  mission: string;
  vision: string;
  values: Array<{ title: string; description: string; icon: string }>;
  stats: Array<{ value: string; label: string }>;
  teamImage?: string;
}

interface LuxuryAboutUsProps {
  content: AboutContent;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Award,
  Users,
  ShieldCheck,
  Sparkles,
  Heart,
  Truck,
};

export function LuxuryAboutUs({ content }: LuxuryAboutUsProps) {
  const { colors } = useLuxuryTheme();
  
  return (
    <div className="min-h-screen" dir="rtl" style={{ background: colors.background, color: colors.text }}>
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative h-[60vh] min-h-[400px] overflow-hidden"
      >
        <img
          src={content.heroImage}
          alt="About Us"
          className="w-full h-full object-cover"
        />
        <div 
          className="absolute inset-0" 
          style={{ background: `linear-gradient(to top, ${colors.background}, ${colors.background}99, transparent)` }} 
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-4">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4"
            >
              {content.heroTitle}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl max-w-2xl mx-auto"
              style={{ color: colors.textSecondary }}
            >
              {content.heroSubtitle}
            </motion.p>
          </div>
        </div>
      </motion.div>

      {/* Stats Section */}
      <div style={{ background: colors.backgroundSecondary, borderTop: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}` }}>
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {content.stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
                className="text-center"
              >
                <p className="text-3xl md:text-4xl font-bold mb-2" style={{ color: colors.primary }}>
                  {stat.value}
                </p>
                <p style={{ color: colors.textMuted }}>{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Story Section */}
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold mb-6">قصتنا</h2>
          <p className="text-lg leading-relaxed" style={{ color: colors.textSecondary }}>
            {content.story}
          </p>
        </motion.div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl p-8"
            style={{ background: colors.backgroundSecondary, border: `1px solid ${colors.border}` }}
          >
            <div 
              className="w-14 h-14 rounded-full flex items-center justify-center mb-6"
              style={{ background: colors.accentMuted }}
            >
              <Target className="w-7 h-7" style={{ color: colors.primary }} />
            </div>
            <h3 className="text-xl font-bold mb-4">مهمتنا</h3>
            <p className="leading-relaxed" style={{ color: colors.textSecondary }}>
              {content.mission}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl p-8"
            style={{ background: colors.backgroundSecondary, border: `1px solid ${colors.border}` }}
          >
            <div 
              className="w-14 h-14 rounded-full flex items-center justify-center mb-6"
              style={{ background: colors.accentMuted }}
            >
              <Eye className="w-7 h-7" style={{ color: colors.primary }} />
            </div>
            <h3 className="text-xl font-bold mb-4">رؤيتنا</h3>
            <p className="leading-relaxed" style={{ color: colors.textSecondary }}>
              {content.vision}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Values Section */}
      <div 
        className="py-16"
        style={{ background: colors.backgroundSecondary, borderTop: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}` }}
      >
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">قيمنا</h2>
            <p className="max-w-2xl mx-auto" style={{ color: colors.textMuted }}>
              القيم التي نؤمن بها ونعمل وفقاً لها
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {content.values.map((value, index) => {
              const IconComponent = iconMap[value.icon] || Sparkles;
              return (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="rounded-xl p-6 text-center group transition-shadow hover:shadow-lg"
                  style={{ background: colors.background }}
                >
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors"
                    style={{ background: colors.accentMuted }}
                  >
                    <IconComponent className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    {value.title}
                  </h3>
                  <p className="text-sm" style={{ color: colors.textMuted }}>
                    {value.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="container mx-auto px-4 py-16 text-center"
      >
        <h2 className="text-2xl md:text-3xl font-bold mb-6">
          انضم إلى عائلتنا
        </h2>
        <p className="max-w-xl mx-auto mb-8" style={{ color: colors.textMuted }}>
          اكتشف تجربة تسوق استثنائية مع أفضل المنتجات وأجود الخدمات
        </p>
        <button 
          className="px-8 py-3 rounded-full font-medium transition-colors"
          style={{ background: colors.buttonPrimary, color: colors.buttonText }}
        >
          تسوق الآن
        </button>
      </motion.div>
    </div>
  );
}
