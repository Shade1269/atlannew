import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Package, TrendingUp } from 'lucide-react';
import { UnifiedButton } from '@/components/design-system';

interface HomeDashboardCardProps {
  onClick: () => void;
}

export const HomeDashboardCard: React.FC<HomeDashboardCardProps> = ({ onClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mb-12"
    >
      <div 
        onClick={onClick}
        className="bg-white rounded-2xl border border-anaqati-border p-8 hover:border-primary/40 shadow-anaqati hover:shadow-anaqati-hover transition-all duration-300 cursor-pointer"
      >
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center flex-shrink-0">
            <LayoutDashboard className="w-8 h-8 text-primary-foreground" />
          </div>

          {/* Content */}
          <div className="flex-1 text-center md:text-right">
            <h3 className="text-2xl font-bold text-foreground mb-2">لوحة التحكم</h3>
            <p className="text-muted-foreground">
              إدارة متجرك ومنتجاتك وطلباتك من مكان واحد
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-4">
            <div className="text-center px-4 py-2 bg-muted/50 rounded-lg">
              <Package className="w-5 h-5 mx-auto mb-1 text-primary" />
              <span className="text-xs text-muted-foreground">المنتجات</span>
            </div>
            <div className="text-center px-4 py-2 bg-muted/50 rounded-lg">
              <TrendingUp className="w-5 h-5 mx-auto mb-1 text-secondary" />
              <span className="text-xs text-muted-foreground">المبيعات</span>
            </div>
          </div>

          {/* Button */}
          <UnifiedButton variant="primary" size="lg" className="flex-shrink-0">
            الدخول
          </UnifiedButton>
        </div>
      </div>
    </motion.div>
  );
};

export default HomeDashboardCard;
