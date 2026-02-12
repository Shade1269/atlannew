import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Gift, Star, Crown, Sparkles, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LoyaltyTier {
  name: string;
  minPoints: number;
  maxPoints: number;
  color: string;
  icon: React.ReactNode;
  benefits: string[];
  discount: number;
}

const loyaltyTiers: LoyaltyTier[] = [
  {
    name: 'برونزي',
    minPoints: 0,
    maxPoints: 499,
    color: 'from-orange-600 to-orange-400',
    icon: <Star className="h-5 w-5" />,
    benefits: ['خصم 5% على جميع المنتجات', 'شحن مجاني للطلبات فوق 200 ر.س'],
    discount: 5
  },
  {
    name: 'فضي',
    minPoints: 500,
    maxPoints: 1499,
    color: 'from-gray-400 to-gray-300',
    icon: <Sparkles className="h-5 w-5" />,
    benefits: ['خصم 10% على جميع المنتجات', 'شحن مجاني للطلبات فوق 100 ر.س', 'وصول مبكر للعروض'],
    discount: 10
  },
  {
    name: 'ذهبي',
    minPoints: 1500,
    maxPoints: 4999,
    color: 'from-yellow-500 to-yellow-400',
    icon: <Crown className="h-5 w-5" />,
    benefits: ['خصم 15% على جميع المنتجات', 'شحن مجاني دائماً', 'هدايا حصرية', 'دعم أولوية'],
    discount: 15
  },
  {
    name: 'بلاتيني',
    minPoints: 5000,
    maxPoints: Infinity,
    color: 'from-purple-600 to-pink-500',
    icon: <Gift className="h-5 w-5" />,
    benefits: ['خصم 20% على جميع المنتجات', 'شحن مجاني + سريع', 'هدايا VIP شهرية', 'دعوات لفعاليات خاصة'],
    discount: 20
  }
];

interface CustomerLoyaltyCardProps {
  points: number;
  totalOrders: number;
  totalSpent: number;
  className?: string;
}

export const CustomerLoyaltyCard: React.FC<CustomerLoyaltyCardProps> = ({
  points,
  totalOrders,
  totalSpent,
  className
}) => {
  const currentTier = loyaltyTiers.find(
    tier => points >= tier.minPoints && points < tier.maxPoints
  ) || loyaltyTiers[0];

  const nextTier = loyaltyTiers.find(tier => tier.minPoints > points);
  
  const progressToNext = nextTier
    ? ((points - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100
    : 100;

  const pointsToNext = nextTier ? nextTier.minPoints - points : 0;

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Header with gradient */}
      <div className={cn('bg-gradient-to-r p-6 text-white', currentTier.color)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-full">
              {currentTier.icon}
            </div>
            <div>
              <h3 className="font-bold text-lg">عضوية {currentTier.name}</h3>
              <p className="text-sm opacity-90">{points} نقطة</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-white/20 text-white border-0">
            خصم {currentTier.discount}%
          </Badge>
        </div>

        {/* Progress to next tier */}
        {nextTier && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>التقدم للمستوى التالي</span>
              <span>{pointsToNext} نقطة متبقية</span>
            </div>
            <Progress value={progressToNext} className="h-2 bg-white/20" />
            <p className="text-xs opacity-75">
              احصل على {pointsToNext} نقطة للترقية إلى {nextTier.name}
            </p>
          </div>
        )}
      </div>

      <CardContent className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold">{points}</p>
            <p className="text-xs text-muted-foreground">النقاط</p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold">{totalOrders}</p>
            <p className="text-xs text-muted-foreground">الطلبات</p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold">{totalSpent}</p>
            <p className="text-xs text-muted-foreground">ر.س منفقة</p>
          </div>
        </div>

        {/* Benefits */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Gift className="h-4 w-4 text-primary" />
            مزايا مستواك الحالي
          </h4>
          <ul className="space-y-2">
            {currentTier.benefits.map((benefit, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-2 text-sm"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                {benefit}
              </motion.li>
            ))}
          </ul>
        </div>

        {/* How to earn points */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            كيف تكسب النقاط؟
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• 1 نقطة لكل 1 ر.س تنفقها</li>
            <li>• 50 نقطة عند كتابة تقييم</li>
            <li>• 100 نقطة عند دعوة صديق</li>
            <li>• نقاط مضاعفة في المناسبات الخاصة</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

// عرض مصغر للنقاط
interface LoyaltyPointsBadgeProps {
  points: number;
  size?: 'sm' | 'md';
}

export const LoyaltyPointsBadge: React.FC<LoyaltyPointsBadgeProps> = ({
  points,
  size = 'md'
}) => {
  const currentTier = loyaltyTiers.find(
    tier => points >= tier.minPoints && points < tier.maxPoints
  ) || loyaltyTiers[0];

  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1',
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'
      )}
    >
      {currentTier.icon}
      <span>{points} نقطة</span>
    </Badge>
  );
};

// All Tiers Display
export const AllLoyaltyTiers: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {loyaltyTiers.map((tier, index) => (
        <motion.div
          key={tier.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="overflow-hidden h-full">
            <div className={cn('bg-gradient-to-r p-4 text-white', tier.color)}>
              <div className="flex items-center gap-2">
                {tier.icon}
                <span className="font-bold">{tier.name}</span>
              </div>
              <p className="text-sm mt-1 opacity-90">
                {tier.minPoints === 0 
                  ? `0 - ${tier.maxPoints} نقطة`
                  : tier.maxPoints === Infinity
                    ? `${tier.minPoints}+ نقطة`
                    : `${tier.minPoints} - ${tier.maxPoints} نقطة`
                }
              </p>
            </div>
            <CardContent className="p-4">
              <ul className="space-y-2 text-sm">
                {tier.benefits.map((benefit, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};
