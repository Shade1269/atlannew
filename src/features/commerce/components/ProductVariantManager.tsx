import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';

interface ProductVariant {
  type: string;
  value: string;
  stock: number;
}

interface ProductVariantManagerProps {
  variants: ProductVariant[];
  onVariantsChange: (variants: ProductVariant[]) => void;
}

export const ProductVariantManager: React.FC<ProductVariantManagerProps> = ({
  variants,
  onVariantsChange
}) => {
  const addVariant = (type: string) => {
    const newVariants = [...variants, { type, value: '', stock: 0 }];
    onVariantsChange(newVariants);
  };

  const updateVariant = (index: number, field: string, value: string | number) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    onVariantsChange(updated);
  };

  const removeVariant = (index: number) => {
    if (variants.length > 1) {
      onVariantsChange(variants.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-4 border-t pt-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">تخصيص المنتج (مقاسات، ألوان، إلخ)</h4>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => addVariant('size')}>
            + مقاس
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => addVariant('color')}>
            + لون
          </Button>
        </div>
      </div>
      
      <div className="space-y-3 max-h-48 overflow-y-auto">
        {variants.map((variant, index) => (
          <div key={index} className="flex items-center gap-2 p-3 bg-muted/20 rounded-lg">
            <Select 
              value={variant.type} 
              onValueChange={(value) => updateVariant(index, 'type', value)}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="size">مقاس</SelectItem>
                <SelectItem value="color">لون</SelectItem>
                <SelectItem value="style">نمط</SelectItem>
                <SelectItem value="material">مادة</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder={variant.type === 'size' ? 'M, L, XL' : variant.type === 'color' ? 'أحمر, أزرق' : 'القيمة'}
              value={variant.value}
              onChange={(e) => updateVariant(index, 'value', e.target.value)}
              className="flex-1"
            />
            <Input
              type="number"
              placeholder="العدد"
              value={variant.stock}
              onChange={(e) => updateVariant(index, 'stock', parseInt(e.target.value) || 0)}
              className="w-20"
            />
            {variants.length > 1 && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => removeVariant(index)}
                className="text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductVariantManager;