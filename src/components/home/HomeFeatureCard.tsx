import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { UnifiedButton } from '@/components/design-system';

interface HomeFeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  gradientClass?: string;
  buttonText: string;
  buttonVariant?: 'primary' | 'secondary' | 'luxury' | 'premium' | 'success' | 'outline' | 'ghost';
  onClick: () => void;
  badge?: {
    color: 'success' | 'warning' | 'danger' | 'info' | string;
    pulse?: boolean;
  };
  children?: React.ReactNode;
}

export const HomeFeatureCard = ({
  title,
  description,
  icon: Icon,
  buttonText,
  buttonVariant = 'primary',
  onClick,
  badge,
  children
}: HomeFeatureCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="group relative bg-white rounded-xl border border-anaqati-border p-6 hover:border-primary/40 shadow-anaqati hover:shadow-anaqati-hover transition-all duration-300"
    >
      {/* Icon Container */}
      <div className="w-14 h-14 rounded-xl bg-anaqati-pink-light flex items-center justify-center mb-5 group-hover:bg-anaqati-pink transition-colors relative">
        <Icon className="w-7 h-7 text-primary" />
        {badge && (
          <span 
            className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-anaqati-success ${badge.pulse ? 'animate-pulse' : ''}`}
          />
        )}
      </div>

      {/* Content */}
      <h3 className="text-xl font-semibold text-anaqati-text mb-2">{title}</h3>
      <p className="text-anaqati-text-secondary text-sm leading-relaxed mb-4">{description}</p>

      {children}

      {/* Action Button */}
      <UnifiedButton
        variant={buttonVariant}
        size="sm"
        onClick={onClick}
        className="w-full mt-4 dark:bg-white dark:text-black dark:border-2 dark:border-[#D4AF37] dark:hover:bg-white/90"
      >
        {buttonText}
      </UnifiedButton>
    </motion.div>
  );
};

export default HomeFeatureCard;
