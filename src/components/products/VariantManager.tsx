import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  X, 
  Download,
  Upload,
  AlertCircle,
  Palette,
  Ruler,
  Package
} from 'lucide-react';
import { ProductVariantAdvanced } from '@/hooks/useAdvancedProductManagement';
import { useToast } from '@/hooks/use-toast';

interface VariantManagerProps {
  hasVariants: boolean;
  skuRoot: string;
  variants: ProductVariantAdvanced[];
  onVariantsChange: (variants: ProductVariantAdvanced[]) => void;
  validationError?: string;
}

interface ColorOption {
  name: string;
  code: string;
  swatch_url?: string;
}

interface SizeOption {
  name: string;
  value: string;
}

const VariantManager: React.FC<VariantManagerProps> = ({
  hasVariants,
  skuRoot,
  variants,
  onVariantsChange,
  validationError
}) => {
  const { toast } = useToast();

  // حالة الأبعاد
  const [sizes, setSizes] = useState<SizeOption[]>([]);
  const [colors, setColors] = useState<ColorOption[]>([]);
  const [newSize, setNewSize] = useState('');
  const [newColor, setNewColor] = useState({ name: '', code: '#000000' });

  // إعداد ابتدائي للمتغيرات الشائعة
  useEffect(() => {
    if (sizes.length === 0 && colors.length === 0) {
      // مقاسات افتراضية
      setSizes([
        { name: 'صغير', value: 'S' },
        { name: 'متوسط', value: 'M' },
        { name: 'كبير', value: 'L' },
        { name: 'كبير جداً', value: 'XL' }
      ]);

      // ألوان افتراضية
      setColors([
        { name: 'أسود', code: '#000000' },
        { name: 'أبيض', code: '#FFFFFF' },
        { name: 'أحمر', code: '#DC2626' },
        { name: 'أزرق', code: '#2563EB' }
      ]);
    }
  }, []);

  // إضافة مقاس
  const addSize = () => {
    if (!newSize.trim()) return;
    
    const sizeExists = sizes.some(size => 
      size.name.toLowerCase() === newSize.toLowerCase() ||
      size.value.toLowerCase() === newSize.toLowerCase()
    );

    if (sizeExists) {
      toast({
        title: "مقاس موجود",
        description: "هذا المقاس موجود بالفعل",
        variant: "destructive"
      });
      return;
    }

    setSizes(prev => [...prev, { name: newSize, value: newSize.toUpperCase() }]);
    setNewSize('');
    generateVariants([...sizes, { name: newSize, value: newSize.toUpperCase() }], colors);
  };

  // إضافة لون
  const addColor = () => {
    if (!newColor.name.trim()) return;

    const colorExists = colors.some(color => 
      color.name.toLowerCase() === newColor.name.toLowerCase() ||
      color.code === newColor.code
    );

    if (colorExists) {
      toast({
        title: "لون موجود",
        description: "هذا اللون موجود بالفعل",
        variant: "destructive"
      });
      return;
    }

    const colorToAdd = { ...newColor };
    setColors(prev => [...prev, colorToAdd]);
    setNewColor({ name: '', code: '#000000' });
    generateVariants(sizes, [...colors, colorToAdd]);
  };

  // حذف مقاس
  const removeSize = (index: number) => {
    const newSizes = sizes.filter((_, i) => i !== index);
    setSizes(newSizes);
    generateVariants(newSizes, colors);
  };

  // حذف لون
  const removeColor = (index: number) => {
    const newColors = colors.filter((_, i) => i !== index);
    setColors(newColors);
    generateVariants(sizes, newColors);
  };

  // توليد المتغيرات تلقائياً
  const generateVariants = (sizesArray: SizeOption[], colorsArray: ColorOption[]) => {
    if (!hasVariants || sizesArray.length === 0 || colorsArray.length === 0) {
      onVariantsChange([]);
      return;
    }

    const newVariants: ProductVariantAdvanced[] = [];

    sizesArray.forEach(size => {
      colorsArray.forEach(color => {
        // البحث عن متغير موجود للحفاظ على البيانات
        const existingVariant = variants.find(v => 
          v.size === size.value && v.color === color.name
        );

        const variant: ProductVariantAdvanced = {
          product_id: '',
          sku: `${skuRoot}-${color.name.substring(0, 3).toUpperCase()}-${size.value}`,
          size: size.value,
          color: color.name,
          color_code: color.code,
          color_swatch_url: color.swatch_url,
          quantity: existingVariant?.quantity || 0,
          min_stock_alert: existingVariant?.min_stock_alert || 5,
          price_override: existingVariant?.price_override,
          barcode: existingVariant?.barcode || '',
          variant_image_url: existingVariant?.variant_image_url || '',
          is_active: existingVariant?.is_active ?? true
        };

        newVariants.push(variant);
      });
    });

    onVariantsChange(newVariants);
  };

  // تحديث متغير
  const updateVariant = (index: number, field: keyof ProductVariantAdvanced, value: any) => {
    const updatedVariants = [...variants];
    updatedVariants[index] = { ...updatedVariants[index], [field]: value };
    
    // تحديث SKU تلقائياً عند تغيير المقاس أو اللون
    if (field === 'size' || field === 'color') {
      const variant = updatedVariants[index];
      const colorPrefix = variant.color ? variant.color.substring(0, 3).toUpperCase() : 'COL';
      const sizeValue = variant.size || 'SIZE';
      updatedVariants[index].sku = `${skuRoot}-${colorPrefix}-${sizeValue}`;
    }

    onVariantsChange(updatedVariants);
  };

  // استيراد من CSV
  const handleCSVImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim());
        
        // التحقق من وجود الأعمدة المطلوبة
        const requiredHeaders = ['sku', 'size', 'color', 'quantity'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        
        if (missingHeaders.length > 0) {
          toast({
            title: "خطأ في ملف CSV",
            description: `أعمدة مفقودة: ${missingHeaders.join(', ')}`,
            variant: "destructive"
          });
          return;
        }

        const importedVariants: ProductVariantAdvanced[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          const rowData: any = {};
          
          headers.forEach((header, index) => {
            rowData[header] = values[index] || '';
          });

          const variant: ProductVariantAdvanced = {
            product_id: '',
            sku: rowData.sku || `${skuRoot}-${i}`,
            size: rowData.size || '',
            color: rowData.color || '',
            color_code: rowData.color_code || '#000000',
            quantity: parseInt(rowData.quantity) || 0,
            min_stock_alert: parseInt(rowData.min_stock_alert) || 5,
            price_override: rowData.price_override ? parseFloat(rowData.price_override) : undefined,
            barcode: rowData.barcode || '',
            variant_image_url: rowData.variant_image_url || '',
            is_active: rowData.is_active !== 'false'
          };

          importedVariants.push(variant);
        }

        onVariantsChange(importedVariants);
        
        toast({
          title: "تم الاستيراد",
          description: `تم استيراد ${importedVariants.length} متغير بنجاح`,
        });

      } catch (error) {
        toast({
          title: "خطأ في الاستيراد",
          description: "تعذر قراءة ملف CSV",
          variant: "destructive"
        });
      }
    };

    reader.readAsText(file);
  };

  // تصدير إلى CSV
  const exportToCSV = () => {
    if (variants.length === 0) {
      toast({
        title: "لا توجد بيانات",
        description: "لا توجد متغيرات للتصدير",
        variant: "destructive"
      });
      return;
    }

    const headers = ['sku', 'size', 'color', 'color_code', 'quantity', 'min_stock_alert', 'price_override', 'barcode'];
    const csvContent = [
      headers.join(','),
      ...variants.map(variant => [
        variant.sku,
        variant.size || '',
        variant.color || '',
        variant.color_code || '',
        variant.quantity,
        variant.min_stock_alert,
        variant.price_override || '',
        variant.barcode || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `product_variants_${skuRoot}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!hasVariants) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>المخزون الثابت</CardTitle>
          <CardDescription>
            هذا المنتج لا يحتوي على متغيرات (مقاسات/ألوان)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الكمية المتاحة</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  defaultValue="0"
                />
              </div>
              <div className="space-y-2">
                <Label>حد التنبيه للمخزون المنخفض</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="5"
                  defaultValue="5"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* إعداد الأبعاد */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* المقاسات */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ruler className="h-5 w-5" />
              المقاسات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newSize}
                onChange={(e) => setNewSize(e.target.value)}
                placeholder="مثال: XL"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSize())}
              />
              <Button onClick={addSize} disabled={!newSize.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {sizes.map((size, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="flex items-center gap-1 px-3 py-1"
                >
                  {size.name} ({size.value})
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 w-4"
                    onClick={() => removeSize(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* الألوان */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              الألوان
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newColor.name}
                onChange={(e) => setNewColor(prev => ({ ...prev, name: e.target.value }))}
                placeholder="اسم اللون"
                className="flex-1"
              />
              <input
                type="color"
                value={newColor.code}
                onChange={(e) => setNewColor(prev => ({ ...prev, code: e.target.value }))}
                className="w-12 h-10 rounded border"
              />
              <Button onClick={addColor} disabled={!newColor.name.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {colors.map((color, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="flex items-center gap-2 px-3 py-1"
                >
                  <div 
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: color.code }}
                  />
                  {color.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 w-4"
                    onClick={() => removeColor(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* أدوات إدارة المتغيرات */}
      {variants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                المتغيرات ({variants.length})
              </span>
              <div className="flex gap-2">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVImport}
                  className="hidden"
                  id="csv-import"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('csv-import')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  استيراد CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToCSV}
                >
                  <Download className="h-4 w-4 mr-2" />
                  تصدير CSV
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {validationError && (
              <div className="flex items-center gap-2 text-destructive text-sm mb-4">
                <AlertCircle className="h-4 w-4" />
                {validationError}
              </div>
            )}

            <div className="space-y-4">
              {variants.map((variant, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-6 h-6 rounded-full border"
                        style={{ backgroundColor: variant.color_code || undefined }}
                      />
                      <Badge variant="outline">
                        {variant.color} - {variant.size}
                      </Badge>
                    </div>
                    <Badge variant={variant.is_active ? "default" : "secondary"}>
                      {variant.is_active ? 'نشط' : 'غير نشط'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">كود المتغير (SKU)</Label>
                      <Input
                        value={variant.sku}
                        onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                        placeholder="SKU"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">الكمية</Label>
                      <Input
                        type="number"
                        min="0"
                        value={variant.quantity}
                        onChange={(e) => updateVariant(index, 'quantity', parseInt(e.target.value) || 0)}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">حد التنبيه</Label>
                      <Input
                        type="number"
                        min="0"
                        value={variant.min_stock_alert ?? 0}
                        onChange={(e) => updateVariant(index, 'min_stock_alert', parseInt(e.target.value) || 0)}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">سعر خاص (اختياري)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={variant.price_override || ''}
                        onChange={(e) => updateVariant(index, 'price_override', e.target.value ? parseFloat(e.target.value) : undefined)}
                        placeholder="سعر مختلف"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">الباركود (اختياري)</Label>
                      <Input
                        value={variant.barcode || ''}
                        onChange={(e) => updateVariant(index, 'barcode', e.target.value)}
                        placeholder="1234567890123"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">صورة المتغير (اختياري)</Label>
                      <Input
                        value={variant.variant_image_url || ''}
                        onChange={(e) => updateVariant(index, 'variant_image_url', e.target.value)}
                        placeholder="رابط الصورة"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* رسالة عدم وجود متغيرات */}
      {hasVariants && variants.length === 0 && (sizes.length === 0 || colors.length === 0) && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">لا توجد متغيرات</p>
              <p>أضف مقاسات وألوان لتوليد المتغيرات تلقائياً</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VariantManager;