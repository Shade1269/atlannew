import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Truck,
  Clock,
  MapPin,
  Scale,
  Ruler,
  Globe
} from 'lucide-react';
import { ProductShipping } from '@/hooks/useAdvancedProductManagement';

interface ShippingManagerProps {
  shipping: ProductShipping;
  onShippingChange: (shipping: ProductShipping) => void;
}

const ShippingManager: React.FC<ShippingManagerProps> = ({
  shipping,
  onShippingChange
}) => {

  // تحديث معلومات الشحن
  const updateShipping = (field: keyof ProductShipping, value: any) => {
    const updatedShipping = { ...shipping, [field]: value };
    onShippingChange(updatedShipping);
  };

  // حساب تكلفة الشحن التقديرية
  const calculateShippingCost = () => {
    const weightG = shipping.weight_grams ?? 0;
    const lengthC = shipping.length_cm ?? 0;
    const widthC = shipping.width_cm ?? 0;
    const heightC = shipping.height_cm ?? 0;
    
    // حساب الوزن الحجمي
    const volumetricWeight = (lengthC * widthC * heightC) / 5000; // cm³ to kg
    const chargeableWeight = Math.max(weightG / 1000, volumetricWeight);
    
    // تكلفة تقديرية (10 ريال + 2 ريال لكل كيلو إضافي)
    const baseCost = 10;
    const additionalCost = Math.max(0, chargeableWeight - 1) * 2;
    
    return (baseCost + additionalCost).toFixed(2);
  };

  return (
    <div className="space-y-6">
      {/* الوزن والأبعاد */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            الوزن والأبعاد
          </CardTitle>
          <CardDescription>
            أدخل الوزن والأبعاد الفعلية للمنتج لحساب تكلفة الشحن بدقة
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* الوزن */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4" />
              <Label className="font-medium">الوزن</Label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">الوزن بالجرام</Label>
                <div className="relative">
                  <Input
                    id="weight"
                    type="number"
                    min="0"
                    step="1"
                    value={shipping.weight_grams || ''}
                    onChange={(e) => updateShipping('weight_grams', parseInt(e.target.value) || undefined)}
                    placeholder="500"
                  />
                  <span className="absolute inset-y-0 right-3 flex items-center text-muted-foreground text-sm">
                    جم
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center p-4 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    {shipping.weight_grams ? (shipping.weight_grams / 1000).toFixed(2) : '0.00'}
                  </p>
                  <p className="text-sm text-muted-foreground">كيلوجرام</p>
                </div>
              </div>
            </div>
          </div>

          {/* الأبعاد */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Ruler className="h-4 w-4" />
              <Label className="font-medium">الأبعاد (بالسنتيمتر)</Label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="length">الطول</Label>
                <div className="relative">
                  <Input
                    id="length"
                    type="number"
                    min="0"
                    step="0.1"
                    value={shipping.length_cm || ''}
                    onChange={(e) => updateShipping('length_cm', parseFloat(e.target.value) || undefined)}
                    placeholder="30"
                  />
                  <span className="absolute inset-y-0 right-3 flex items-center text-muted-foreground text-sm">
                    سم
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="width">العرض</Label>
                <div className="relative">
                  <Input
                    id="width"
                    type="number"
                    min="0"
                    step="0.1"
                    value={shipping.width_cm || ''}
                    onChange={(e) => updateShipping('width_cm', parseFloat(e.target.value) || undefined)}
                    placeholder="20"
                  />
                  <span className="absolute inset-y-0 right-3 flex items-center text-muted-foreground text-sm">
                    سم
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="height">الارتفاع</Label>
                <div className="relative">
                  <Input
                    id="height"
                    type="number"
                    min="0"
                    step="0.1"
                    value={shipping.height_cm || ''}
                    onChange={(e) => updateShipping('height_cm', parseFloat(e.target.value) || undefined)}
                    placeholder="10"
                  />
                  <span className="absolute inset-y-0 right-3 flex items-center text-muted-foreground text-sm">
                    سم
                  </span>
                </div>
              </div>
            </div>

            {/* معلومات إضافية */}
            {(shipping.length_cm && shipping.width_cm && shipping.height_cm) && (
              <div className="p-4 bg-info/10 rounded-lg border border-info/30">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-info">الحجم الإجمالي:</p>
                    <p className="text-info/80">
                      {((shipping.length_cm * shipping.width_cm * shipping.height_cm) / 1000).toFixed(2)} لتر
                    </p>
                  </div>
                  
                  <div>
                    <p className="font-medium text-info">الوزن الحجمي:</p>
                    <p className="text-info/80">
                      {((shipping.length_cm * shipping.width_cm * shipping.height_cm) / 5000).toFixed(2)} كجم
                    </p>
                  </div>
                  
                  <div>
                    <p className="font-medium text-info">تكلفة شحن تقديرية:</p>
                    <p className="text-info/80 font-bold">
                      {calculateShippingCost()} ر.س
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* إعدادات التحضير والشحن */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            إعدادات التحضير والشحن
          </CardTitle>
          <CardDescription>
            حدد مدة تحضير الطلب وإعدادات الشحن
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="handling_time">مدة التحضير (بالأيام)</Label>
              <Select
                value={shipping.handling_time_days?.toString() || '1'}
                onValueChange={(value) => updateShipping('handling_time_days', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">يوم واحد</SelectItem>
                  <SelectItem value="2">يومان</SelectItem>
                  <SelectItem value="3">3 أيام</SelectItem>
                  <SelectItem value="5">5 أيام</SelectItem>
                  <SelectItem value="7">أسبوع</SelectItem>
                  <SelectItem value="14">أسبوعان</SelectItem>
                  <SelectItem value="30">شهر</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                المدة المطلوبة لتحضير المنتج قبل الشحن
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="warehouse">المستودع</Label>
              <Select
                value={shipping.warehouse_id || ''}
                onValueChange={(value) => updateShipping('warehouse_id', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المستودع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">المستودع الرئيسي - الرياض</SelectItem>
                  <SelectItem value="jeddah">مستودع جدة</SelectItem>
                  <SelectItem value="dammam">مستودع الدمام</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                المستودع الذي سيتم الشحن منه
              </p>
            </div>
          </div>

          {/* معلومات التحضير */}
          <div className="p-4 bg-success/10 rounded-lg border border-success/30">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-success" />
              <span className="font-medium text-success">معلومات التحضير:</span>
            </div>
            <p className="text-sm text-success/80">
              سيتم تحضير هذا المنتج خلال{' '}
              <span className="font-bold">{shipping.handling_time_days || 1}</span>{' '}
              {shipping.handling_time_days === 1 ? 'يوم' : 'أيام'} من تأكيد الطلب
            </p>
          </div>
        </CardContent>
      </Card>

      {/* المنشأ والسياسات */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            المنشأ والسياسات
          </CardTitle>
          <CardDescription>
            معلومات إضافية حول منشأ المنتج وسياسات الإرجاع
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="origin_country">بلد المنشأ</Label>
              <Select
                value={shipping.origin_country || ''}
                onValueChange={(value) => updateShipping('origin_country', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر بلد المنشأ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SA">السعودية</SelectItem>
                  <SelectItem value="AE">الإمارات</SelectItem>
                  <SelectItem value="CN">الصين</SelectItem>
                  <SelectItem value="TR">تركيا</SelectItem>
                  <SelectItem value="US">الولايات المتحدة</SelectItem>
                  <SelectItem value="DE">ألمانيا</SelectItem>
                  <SelectItem value="JP">اليابان</SelectItem>
                  <SelectItem value="KR">كوريا الجنوبية</SelectItem>
                  <SelectItem value="OTHER">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-center">
              {shipping.origin_country && (
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
                    <MapPin className="h-8 w-8 text-primary" />
                  </div>
                  <Badge variant="outline">
                    {shipping.origin_country === 'SA' ? '🇸🇦 السعودية' :
                     shipping.origin_country === 'AE' ? '🇦🇪 الإمارات' :
                     shipping.origin_country === 'CN' ? '🇨🇳 الصين' :
                     shipping.origin_country === 'TR' ? '🇹🇷 تركيا' :
                     shipping.origin_country === 'US' ? '🇺🇸 أمريكا' :
                     shipping.origin_country === 'DE' ? '🇩🇪 ألمانيا' :
                     shipping.origin_country === 'JP' ? '🇯🇵 اليابان' :
                     shipping.origin_country === 'KR' ? '🇰🇷 كوريا' :
                     '🌍 أخرى'}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="return_policy">سياسة الإرجاع</Label>
            <Textarea
              id="return_policy"
              value={shipping.return_policy || ''}
              onChange={(e) => updateShipping('return_policy', e.target.value || undefined)}
              placeholder="مثال: استرجاع خلال 14 يوم من تاريخ الاستلام، بشرط عدم الاستخدام وتوفر العبوة الأصلية..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              سياسة الإرجاع الخاصة بهذا المنتج (اختيارية)
            </p>
          </div>

          {/* سياسات افتراضية */}
          <div className="space-y-2">
            <Label>سياسات افتراضية سريعة:</Label>
            <div className="flex flex-wrap gap-2">
              {[
                'استرجاع خلال 7 أيام',
                'استرجاع خلال 14 يوم',
                'استرجاع خلال 30 يوم',
                'لا يمكن الاسترجاع',
                'استرجاع حسب الضمان'
              ].map((policy, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                  onClick={() => updateShipping('return_policy', policy)}
                >
                  {policy}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ملخص الشحن */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            ملخص معلومات الشحن
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-card rounded-lg border">
              <Scale className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">الوزن</p>
              <p className="text-lg font-bold text-primary">
                {shipping.weight_grams ? `${(shipping.weight_grams / 1000).toFixed(2)} كجم` : 'غير محدد'}
              </p>
            </div>

            <div className="text-center p-3 bg-card rounded-lg border">
              <Ruler className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">الأبعاد</p>
              <p className="text-lg font-bold text-primary">
                {(shipping.length_cm && shipping.width_cm && shipping.height_cm) 
                  ? `${shipping.length_cm}×${shipping.width_cm}×${shipping.height_cm}` 
                  : 'غير محدد'}
              </p>
            </div>

            <div className="text-center p-3 bg-card rounded-lg border">
              <Clock className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">مدة التحضير</p>
              <p className="text-lg font-bold text-primary">
                {shipping.handling_time_days || 1} {shipping.handling_time_days === 1 ? 'يوم' : 'أيام'}
              </p>
            </div>

            <div className="text-center p-3 bg-card rounded-lg border">
              <Truck className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">تكلفة تقديرية</p>
              <p className="text-lg font-bold text-primary">
                {shipping.weight_grams ? `${calculateShippingCost()} ر.س` : 'يحتاج وزن'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShippingManager;