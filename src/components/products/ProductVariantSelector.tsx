import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';

export interface ProductVariant {
  id: string;
  size?: string | null;
  color?: string | null;
  color_code?: string | null;
  available_stock: number;
  selling_price?: number;
}

interface VariantSelectorProps {
  variants: ProductVariant[];
  onVariantChange: (selectedVariant: ProductVariant | null) => void;
  className?: string;
  /** عند true تُعرض الألوان كدوائر ملونة بدل النص */
  colorAsCircles?: boolean;
  /** خريطة اسم اللون -> hex لرسم الدوائر (إن لم تُمرَّر يُستنتج من color_code في variants أو ألوان افتراضية) */
  colorHexMap?: Record<string, string>;
  /** لون تسميات "المقاس" و"اللون" (متوافق مع الثيم الليلي/النهاري) */
  labelColor?: string;
  /** خلفية صندوق "الاختيار الحالي" */
  summaryBg?: string;
  /** لون نص صندوق "الاختيار الحالي" */
  summaryTextColor?: string;
  /** عرض المقاسات بالرموز M, L, XL */
  sizeAsSymbols?: boolean;
  /** إخفاء عرض المخزون من صندوق "الاختيار الحالي" (المخزون معروض فوق) */
  hideStockInSummary?: boolean;
  /** لون عنوان "الاختيار الحالي" وأسماء الأزرار (لون الثيم) */
  accentColor?: string;
}

/** خريطة أسماء الألوان إلى hex — للاستخدام في المنتقي وفي تبويب التفاصيل */
export const defaultColorHex: Record<string, string> = {
  أسود: '#1a1a1a', أبيض: '#ffffff', أحمر: '#dc2626', احمر: '#dc2626', أزرق: '#2563eb', أخضر: '#16a34a',
  رمادي: '#6b7280', كحلي: '#1e3a8a', وردي: '#db2777', بيج: '#d4a574', ذهبي: '#d4af37',
  كريمي: '#f5f5dc', بني: '#78350f', 'أزرق فاتح': '#7dd3fc', أصفر: '#facc15',
};

const sizeToSymbolMap: Record<string, string> = {
  xs: 'XS', s: 'S', m: 'M', l: 'L', xl: 'XL', xxl: 'XXL',
  صغير: 'S', مديم: 'M', 'مدیم': 'M', كبير: 'L', متوسط: 'M',
  'صغير جداً': 'XS', 'كبير جداً': 'XL', small: 'S', medium: 'M', large: 'L', 'extra small': 'XS', 'extra large': 'XL',
};
function sizeDisplay(size: string, asSymbol: boolean): string {
  if (!asSymbol) return size;
  const k = size.trim().toLowerCase();
  return sizeToSymbolMap[k] ?? sizeToSymbolMap[size.trim()] ?? size.slice(0, 3).toUpperCase();
}

export const ProductVariantSelector: React.FC<VariantSelectorProps> = ({
  variants,
  onVariantChange,
  className = '',
  colorAsCircles = false,
  colorHexMap,
  labelColor,
  summaryBg,
  summaryTextColor,
  sizeAsSymbols = true,
  hideStockInSummary = false,
  accentColor,
}) => {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const { sizes, colors, colorToHex } = useMemo(() => {
    const sizeSet = new Set<string>();
    const colorSet = new Set<string>();
    const hexMap: Record<string, string> = { ...defaultColorHex, ...colorHexMap };
    variants.forEach(v => {
      if (v.size) sizeSet.add(v.size);
      if (v.color) {
        colorSet.add(v.color);
        if (v.color_code) hexMap[v.color] = v.color_code;
      }
    });
    return {
      sizes: Array.from(sizeSet),
      colors: Array.from(colorSet),
      colorToHex: hexMap,
    };
  }, [variants, colorHexMap]);

  const matchedVariant = useMemo(() => {
    return variants.find(v => 
      (!selectedSize || v.size === selectedSize) &&
      (!selectedColor || v.color === selectedColor)
    ) || null;
  }, [variants, selectedSize, selectedColor]);

  const handleSizeSelect = (size: string) => {
    const newSize = selectedSize === size ? null : size;
    setSelectedSize(newSize);
    
    const variant = variants.find(v => 
      (!newSize || v.size === newSize) &&
      (!selectedColor || v.color === selectedColor)
    ) || null;
    onVariantChange(variant);
  };

  const handleColorSelect = (color: string) => {
    const newColor = selectedColor === color ? null : color;
    setSelectedColor(newColor);
    
    const variant = variants.find(v => 
      (!selectedSize || v.size === selectedSize) &&
      (!newColor || v.color === newColor)
    ) || null;
    onVariantChange(variant);
  };

  const isOutOfStock = (value: string, type: 'size' | 'color') => {
    const relevantVariants = variants.filter(v => 
      type === 'size' ? v.size === value : v.color === value
    );
    return relevantVariants.every(v => v.available_stock === 0);
  };

  if (sizes.length === 0 && colors.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`} dir="rtl">
      {sizes.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium" style={{ color: accentColor ?? labelColor ?? undefined }}>
            المقاس
          </label>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => {
              const isSelected = selectedSize === size;
              const outOfStock = isOutOfStock(size, 'size');
              
              return (
                <Button
                  key={size}
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  disabled={outOfStock}
                  onClick={() => handleSizeSelect(size)}
                  title={size}
                  className={`
                    relative min-w-[60px]
                    ${outOfStock ? 'opacity-50 cursor-not-allowed line-through' : ''}
                    ${isSelected ? 'ring-2 ring-primary' : ''}
                  `}
                >
                  {sizeDisplay(size, sizeAsSymbols)}
                  {isSelected && (
                    <Check className="w-4 h-4 mr-1" />
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {colors.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium" style={{ color: accentColor ?? labelColor ?? undefined }}>
            اللون
          </label>
          <div className="flex flex-wrap gap-2 items-center">
            {colors.map((color) => {
              const isSelected = selectedColor === color;
              const outOfStock = isOutOfStock(color, 'color');
              const hex = colorToHex[color] || '#888';
              if (colorAsCircles) {
                return (
                  <button
                    key={color}
                    type="button"
                    disabled={outOfStock}
                    onClick={() => handleColorSelect(color)}
                    title={color}
                    className={`
                      w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0
                      transition-all
                      ${outOfStock ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:scale-110'}
                      ${isSelected ? 'ring-2 ring-offset-2 ring-primary' : ''}
                    `}
                    style={{
                      backgroundColor: hex,
                      borderColor: hex === '#ffffff' || hex === '#f5f5dc' ? '#ccc' : 'rgba(0,0,0,0.15)',
                    }}
                  />
                );
              }
              return (
                <Button
                  key={color}
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  disabled={outOfStock}
                  onClick={() => handleColorSelect(color)}
                  className={`
                    relative min-w-[60px]
                    ${outOfStock ? 'opacity-50 cursor-not-allowed line-through' : ''}
                    ${isSelected ? 'ring-2 ring-primary' : ''}
                  `}
                >
                  {color}
                  {isSelected && (
                    <Check className="w-4 h-4 mr-1" />
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      )}
      
      {matchedVariant && (selectedSize || selectedColor) && (
        <div
          className={`mt-3 p-3 rounded-lg ${!(summaryBg || summaryTextColor) ? "bg-muted/50" : ""}`}
          style={
            summaryBg || summaryTextColor
              ? { background: summaryBg, color: summaryTextColor }
              : undefined
          }
        >
          <p className="text-xs mb-1.5 font-medium" style={{ color: accentColor ?? summaryTextColor ?? undefined, opacity: 0.95 }}>
            الاختيار الحالي:
          </p>
          <div className="flex flex-wrap gap-2 items-center">
            {selectedSize && (
              <span className="text-xs inline-flex items-center gap-1.5">
                <span style={{ color: summaryTextColor, opacity: 0.9 }}>المقاس:</span>
                <span className="font-semibold" style={{ color: accentColor ?? summaryTextColor }}>{sizeDisplay(selectedSize, sizeAsSymbols)}</span>
              </span>
            )}
            {selectedColor && (
              <span className="text-xs inline-flex items-center gap-1.5">
                <span style={{ color: summaryTextColor, opacity: 0.9 }}>اللون:</span>
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="w-4 h-4 rounded-full shrink-0 border border-white/20"
                    style={{ backgroundColor: colorToHex[selectedColor] || '#888' }}
                    aria-hidden
                  />
                  <span className="font-semibold" style={{ color: accentColor ?? summaryTextColor }}>{selectedColor}</span>
                </span>
              </span>
            )}
            {!hideStockInSummary && (
              <Badge variant="outline" className="text-xs">
                متوفر: {matchedVariant.available_stock}
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
