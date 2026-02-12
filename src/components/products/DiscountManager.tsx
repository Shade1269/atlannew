import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  X, 
  DollarSign,
  Percent,
  Calendar,
  AlertCircle,
  TrendingDown
} from 'lucide-react';
import { ProductDiscount } from '@/hooks/useAdvancedProductManagement';
import { useToast } from '@/hooks/use-toast';

interface DiscountManagerProps {
  basePrice: number;
  onBasePriceChange: (price: number) => void;
  discounts: ProductDiscount[];
  onDiscountsChange: (discounts: ProductDiscount[]) => void;
  validationError?: string;
}

const DiscountManager: React.FC<DiscountManagerProps> = ({
  basePrice,
  onBasePriceChange,
  discounts,
  onDiscountsChange,
  validationError
}) => {
  const { toast } = useToast();
  
  const [newDiscount, setNewDiscount] = useState<Partial<ProductDiscount>>({
    discount_type: 'percent',
    discount_value: 0,
    is_active: true
  });

  // حساب السعر النهائي
  const calculateFinalPrice = (price: number, discount?: ProductDiscount): number => {
    if (!discount || !discount.is_active) return price;

    const now = new Date();
    const startDate = discount.start_date ? new Date(discount.start_date) : null;
    const endDate = discount.end_date ? new Date(discount.end_date) : null;

    // التحقق من صحة التواريخ
    if (startDate && now < startDate) return price;
    if (endDate && now > endDate) return price;

    // حساب الخصم
    let discountAmount = 0;
    if (discount.discount_type === 'percent') {
      discountAmount = price * (discount.discount_value / 100);
    } else {
      discountAmount = discount.discount_value;
    }

    return Math.max(price - discountAmount, 0);
  };

  // الحصول على الخصم النشط
  const activeDiscount = discounts.find(d => d.is_active);
  const finalPrice = calculateFinalPrice(basePrice, activeDiscount);
  const savingsAmount = basePrice - finalPrice;
  const savingsPercentage = basePrice > 0 ? (savingsAmount / basePrice) * 100 : 0;

  // إضافة خصم جديد
  const addDiscount = () => {
    // التحقق من البيانات
    if (!newDiscount.discount_value || newDiscount.discount_value <= 0) {
      toast({
        title: "قيمة خصم غير صحيحة",
        description: "يجب أن تكون قيمة الخصم أكبر من صفر",
        variant: "destructive"
      });
      return;
    }

    if (newDiscount.discount_type === 'percent' && newDiscount.discount_value > 100) {
      toast({
        title: "نسبة خصم غير صحيحة",
        description: "نسبة الخصم لا يمكن أن تتجاوز 100%",
        variant: "destructive"
      });
      return;
    }

    if (newDiscount.discount_type === 'amount' && newDiscount.discount_value > basePrice) {
      toast({
        title: "قيمة خصم مرتفعة",
        description: "قيمة الخصم لا يمكن أن تتجاوز سعر المنتج",
        variant: "destructive"
      });
      return;
    }

    // التحقق من التواريخ
    if (newDiscount.start_date && newDiscount.end_date) {
      if (new Date(newDiscount.start_date) >= new Date(newDiscount.end_date)) {
        toast({
          title: "تواريخ غير صحيحة",
          description: "تاريخ انتهاء الخصم يجب أن يكون بعد تاريخ البداية",
          variant: "destructive"
        });
        return;
      }
    }

    // إلغاء تفعيل الخصومات الأخرى إذا كان الخصم الجديد نشط
    if (newDiscount.is_active) {
      const updatedDiscounts = discounts.map(d => ({ ...d, is_active: false }));
      onDiscountsChange([...updatedDiscounts, newDiscount as ProductDiscount]);
    } else {
      onDiscountsChange([...discounts, newDiscount as ProductDiscount]);
    }

    // إعادة تعيين النموذج
    setNewDiscount({
      discount_type: 'percent',
      discount_value: 0,
      is_active: true
    });

    toast({
      title: "تم إضافة الخصم",
      description: "تم إضافة الخصم بنجاح",
    });
  };

  // حذف خصم
  const removeDiscount = (index: number) => {
    const updatedDiscounts = discounts.filter((_, i) => i !== index);
    onDiscountsChange(updatedDiscounts);
  };

  // تفعيل/إلغاء تفعيل خصم
  const toggleDiscount = (index: number) => {
    const updatedDiscounts = discounts.map((discount, i) => ({
      ...discount,
      is_active: i === index ? !discount.is_active : false // تفعيل خصم واحد فقط
    }));
    onDiscountsChange(updatedDiscounts);
  };

  return (
    <div className="space-y-6">
      {/* السعر الأساسي */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            التسعير الأساسي
          </CardTitle>
          <CardDescription>
            حدد السعر الأساسي للمنتج قبل أي خصومات
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="base_price">السعر الأساسي * (ر.س)</Label>
              <Input
                id="base_price"
                type="number"
                step="0.01"
                min="0"
                value={basePrice}
                onChange={(e) => onBasePriceChange(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className={validationError ? 'border-destructive' : ''}
              />
              {validationError && (
                <p className="text-sm text-destructive">{validationError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>سعر المقارنة (اختياري) (ر.س)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="السعر قبل الخصم"
              />
              <p className="text-xs text-muted-foreground">
                يظهر كخط مشطوب بجانب السعر الحالي
              </p>
            </div>

            <div className="space-y-2">
              <Label>تكلفة المنتج (اختياري) (ر.س)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="التكلفة الفعلية"
              />
              <p className="text-xs text-muted-foreground">
                لحساب الربح (مخفية عن الزوار)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* معاينة السعر النهائي */}
      <Card className="border-success/30 bg-success/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-success">
                {finalPrice.toFixed(2)} ر.س
              </p>
              <p className="text-sm text-muted-foreground">السعر النهائي</p>
            </div>
            
            {savingsAmount > 0 && (
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="gap-1">
                    <TrendingDown className="h-3 w-3" />
                    وفر {savingsAmount.toFixed(2)} ر.س
                  </Badge>
                </div>
                <p className="text-sm text-success mt-1">
                  خصم {savingsPercentage.toFixed(1)}%
                </p>
              </div>
            )}
          </div>

          {basePrice !== finalPrice && (
            <div className="mt-3 pt-3 border-t border-success/30">
              <div className="flex justify-between text-sm">
                <span>السعر الأساسي:</span>
                <span className="line-through text-muted-foreground">
                  {basePrice.toFixed(2)} ر.س
                </span>
              </div>
              <div className="flex justify-between text-sm font-medium text-success">
                <span>بعد الخصم:</span>
                <span>{finalPrice.toFixed(2)} ر.س</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* إضافة خصم جديد */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            إضافة خصم
          </CardTitle>
          <CardDescription>
            أضف خصومات مؤقتة أو دائمة للمنتج
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>نوع الخصم</Label>
              <Select
                value={newDiscount.discount_type}
                onValueChange={(value: 'percent' | 'amount') => 
                  setNewDiscount(prev => ({ ...prev, discount_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">نسبة مئوية (%)</SelectItem>
                  <SelectItem value="amount">مبلغ ثابت (ر.س)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>قيمة الخصم</Label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max={newDiscount.discount_type === 'percent' ? 100 : basePrice}
                  value={newDiscount.discount_value || ''}
                  onChange={(e) => setNewDiscount(prev => ({ 
                    ...prev, 
                    discount_value: parseFloat(e.target.value) || 0 
                  }))}
                  placeholder="0"
                />
                <div className="absolute inset-y-0 right-3 flex items-center text-muted-foreground">
                  {newDiscount.discount_type === 'percent' ? '%' : 'ر.س'}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>تاريخ البداية (اختياري)</Label>
              <Input
                type="datetime-local"
                value={newDiscount.start_date || ''}
                onChange={(e) => setNewDiscount(prev => ({ 
                  ...prev, 
                  start_date: e.target.value 
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label>تاريخ الانتهاء (اختياري)</Label>
              <Input
                type="datetime-local"
                value={newDiscount.end_date || ''}
                onChange={(e) => setNewDiscount(prev => ({ 
                  ...prev, 
                  end_date: e.target.value 
                }))}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="discount_active"
                checked={newDiscount.is_active ?? false}
                onCheckedChange={(checked) => setNewDiscount(prev => ({ 
                  ...prev, 
                  is_active: checked 
                }))}
              />
              <Label htmlFor="discount_active">تفعيل الخصم</Label>
            </div>

            <Button 
              onClick={addDiscount}
              disabled={!newDiscount.discount_value || newDiscount.discount_value <= 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              إضافة خصم
            </Button>
          </div>

          {/* معاينة الخصم الجديد */}
          {newDiscount.discount_value && newDiscount.discount_value > 0 && (
            <div className="mt-4 p-3 bg-info/10 rounded-lg border border-info/30">
              <p className="text-sm font-medium text-info">معاينة الخصم:</p>
              <div className="text-sm text-info/80 mt-1">
                {newDiscount.discount_type === 'percent' 
                  ? `خصم ${newDiscount.discount_value}% = ${(basePrice * (newDiscount.discount_value / 100)).toFixed(2)} ر.س`
                  : `خصم ${newDiscount.discount_value} ر.س`
                }
              </div>
              <div className="text-sm font-medium text-info mt-1">
                السعر بعد الخصم: {calculateFinalPrice(basePrice, newDiscount as ProductDiscount).toFixed(2)} ر.س
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* قائمة الخصومات الحالية */}
      {discounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>الخصومات المضافة ({discounts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {discounts.map((discount, index) => (
                <div 
                  key={index} 
                  className={`border rounded-lg p-4 ${
                    discount.is_active ? 'border-success/30 bg-success/5' : 'border-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={discount.is_active ?? false}
                        onCheckedChange={() => toggleDiscount(index)}
                      />
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant={discount.is_active ? "default" : "secondary"}>
                            {discount.is_active ? 'نشط' : 'معطل'}
                          </Badge>
                          <span className="font-medium">
                            {discount.discount_type === 'percent' 
                              ? `${discount.discount_value}% خصم`
                              : `${discount.discount_value} ر.س خصم`
                            }
                          </span>
                        </div>
                        
                        {(discount.start_date || discount.end_date) && (
                          <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {discount.start_date && (
                              <span>من {new Date(discount.start_date).toLocaleDateString('ar')}</span>
                            )}
                            {discount.start_date && discount.end_date && <span> - </span>}
                            {discount.end_date && (
                              <span>إلى {new Date(discount.end_date).toLocaleDateString('ar')}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-success">
                        {calculateFinalPrice(basePrice, discount).toFixed(2)} ر.س
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDiscount(index)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* تحقق من انتهاء صلاحية الخصم */}
                  {discount.end_date && new Date(discount.end_date) < new Date() && (
                    <div className="flex items-center gap-2 mt-2 text-warning text-sm">
                      <AlertCircle className="h-4 w-4" />
                      انتهت صلاحية هذا الخصم
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DiscountManager;