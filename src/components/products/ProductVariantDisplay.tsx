import React from 'react';
import { Badge } from '@/components/ui/badge';

interface ProductVariant {
  type: string;
  value: string;
  stock: number;
}

interface ProductVariantDisplayProps {
  variants?: ProductVariant[];
  compact?: boolean;
}

export const ProductVariantDisplay: React.FC<ProductVariantDisplayProps> = ({ 
  variants, 
  compact = true 
}) => {
  if (!variants || variants.length === 0) return null;

  // Group variants by type
  const groupedVariants = variants.reduce((acc, variant) => {
    if (!acc[variant.type]) {
      acc[variant.type] = [];
    }
    acc[variant.type].push(variant);
    return acc;
  }, {} as Record<string, ProductVariant[]>);

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      size: 'المقاس',
      color: 'اللون',
      style: 'النمط',
      material: 'المادة',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-2" dir="rtl">
      {Object.entries(groupedVariants).map(([type, variantList]) => (
        <div key={type} className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground font-medium min-w-fit">
            {getTypeLabel(type)}:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {variantList.slice(0, compact ? 4 : undefined).map((variant, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className={`text-xs px-2 py-0.5 ${
                  variant.stock === 0 
                    ? 'opacity-50 line-through' 
                    : 'hover:bg-primary/10'
                }`}
              >
                {variant.value}
              </Badge>
            ))}
            {compact && variantList.length > 4 && (
              <Badge variant="outline" className="text-xs px-2 py-0.5">
                +{variantList.length - 4}
              </Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
