import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  X, 
  Save, 
  ArrowLeft, 
  Image as ImageIcon,
  Star,
  Package,
  Layers,
  Info,
  Eye,
  DollarSign
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useFastAuth } from '@/hooks/useFastAuth';
import { 
  useAdvancedProduct, 
  useCreateAdvancedProduct, 
  useUpdateAdvancedProduct,
  useCalculateFinalPrice,
  CompleteProductData
} from '@/hooks/useAdvancedProductManagement';
import MediaManager from './MediaManager';
import VariantManager from './VariantManager';
import DiscountManager from './DiscountManager';
import SEOManager from './SEOManager';
import ShippingManager from './ShippingManager';

interface AdvancedProductFormProps {
  mode: 'create' | 'edit';
}

const AdvancedProductForm: React.FC<AdvancedProductFormProps> = ({ mode }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useFastAuth();
  const calculateFinalPrice = useCalculateFinalPrice();

  const [activeTab, setActiveTab] = useState('basic');
  const [isPublishNow, setIsPublishNow] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // خطافات البيانات
  const { data: productData, isLoading } = useAdvancedProduct(id || '');
  const createProduct = useCreateAdvancedProduct();
  const updateProduct = useUpdateAdvancedProduct();

  // حالة النموذج
  const [formData, setFormData] = useState<CompleteProductData>({
    product: {
      id: '',
      title: '',
      description: '',
      price_sar: 0,
      sku_root: '',
      status: 'draft',
      has_variants: false,
      tags: [],
      is_active: true,
      featured: false,
      created_at: '',
      updated_at: '',
      merchant_id: ''
    },
    media: [],
    discounts: [],
    variants: [],
    seo: {
      product_id: '',
      meta_keywords: []
    },
    shipping: {
      product_id: '',
      handling_time_days: 1
    }
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (productData && mode === 'edit') {
      setFormData(productData);
    }
  }, [productData, mode]);

  // التحقق من صحة البيانات
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // التحقق من البيانات الأساسية
    if (!formData.product.title.trim()) {
      errors.title = 'اسم المنتج مطلوب';
    } else if (formData.product.title.length < 3 || formData.product.title.length > 120) {
      errors.title = 'اسم المنتج يجب أن يكون بين 3-120 حرف';
    }

    if (!(formData.product.sku_root || '').trim()) {
      errors.sku_root = 'كود المنتج الأساسي مطلوب';
    }

    if (formData.product.price_sar <= 0) {
      errors.price_sar = 'السعر يجب أن يكون أكبر من صفر';
    }

    // التحقق من الصورة الرئيسية
    const coverImage = formData.media.find(m => m.media_type === 'cover_image');
    if (!coverImage) {
      errors.cover_image = 'الصورة الرئيسية مطلوبة';
    }

    // التحقق من المتغيرات
    if (formData.product.has_variants && formData.variants.length === 0) {
      errors.variants = 'يجب إضافة متغير واحد على الأقل';
    }

    if (formData.product.has_variants) {
      const skus = formData.variants.map(v => v.sku);
      const uniqueSkus = new Set(skus);
      if (skus.length !== uniqueSkus.size) {
        errors.variants = 'أكواد المتغيرات يجب أن تكون فريدة';
      }
    }

    // التحقق من الخصومات
    formData.discounts.forEach((discount, index) => {
      if (discount.start_date && discount.end_date) {
        if (new Date(discount.start_date) >= new Date(discount.end_date)) {
          errors[`discount_${index}`] = 'تاريخ انتهاء الخصم يجب أن يكون بعد تاريخ البداية';
        }
      }
    });

    // التحقق من SEO
    if (formData.seo.seo_title && formData.seo.seo_title.length > 60) {
      errors.seo_title = 'عنوان SEO يجب ألا يتجاوز 60 حرف';
    }

    if (formData.seo.seo_description && formData.seo.seo_description.length > 160) {
      errors.seo_description = 'وصف SEO يجب ألا يتجاوز 160 حرف';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // حفظ المنتج
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى مراجعة البيانات المدخلة",
        variant: "destructive",
      });
      return;
    }

    try {
      // تحضير البيانات
      const productToSave = {
        ...formData,
        product: {
          ...formData.product,
          status: isPublishNow ? 'active' : 'draft',
          merchant_id: profile?.id || ''
        }
      };

      if (mode === 'create') {
        await createProduct.mutateAsync(productToSave);
      } else if (id) {
        await updateProduct.mutateAsync({ id, data: productToSave });
      }

      navigate('/admin/inventory');
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  // حفظ كمسودة
  const saveDraft = async () => {
    if (!formData.product.title.trim()) {
      toast({
        title: "العنوان مطلوب",
        description: "يجب إدخال اسم المنتج لحفظ المسودة",
        variant: "destructive",
      });
      return;
    }

    const coverImage = formData.media.find(m => m.media_type === 'cover_image');
    if (!coverImage) {
      toast({
        title: "الصورة الرئيسية مطلوبة",
        description: "يجب إضافة صورة رئيسية لحفظ المسودة",
        variant: "destructive",
      });
      return;
    }

    try {
      const draftData = {
        ...formData,
        product: {
          ...formData.product,
          status: 'draft' as const,
          merchant_id: profile?.id || ''
        }
      };

      if (mode === 'create') {
        await createProduct.mutateAsync(draftData);
      } else if (id) {
        await updateProduct.mutateAsync({ id, data: draftData });
      }

      toast({
        title: "تم حفظ المسودة",
        description: "تم حفظ المنتج كمسودة بنجاح",
      });
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  };

  // معاينة السعر النهائي
  const finalPrice = React.useMemo(() => {
    const activeDiscount = formData.discounts.find(d => d.is_active);
    return calculateFinalPrice(formData.product.price_sar, activeDiscount);
  }, [formData.product.price_sar, formData.discounts, calculateFinalPrice]);

  if (isLoading && mode === 'edit') {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">جاري تحميل بيانات المنتج...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg-muted">
      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/admin/inventory')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                العودة
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 gradient-btn-primary rounded-lg flex items-center justify-center">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">
                    {mode === 'create' ? 'إضافة منتج جديد' : 'تعديل المنتج'}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {formData.product.title || 'منتج جديد'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* معاينة السعر */}
              {finalPrice !== formData.product.price_sar && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground line-through">
                    {formData.product.price_sar.toFixed(2)} ر.س
                  </span>
                  <span className="text-success font-semibold">
                    {finalPrice.toFixed(2)} ر.س
                  </span>
                </div>
              )}

              <Button 
                variant="outline" 
                onClick={() => setPreviewMode(!previewMode)}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                معاينة
              </Button>
              
              <Button 
                variant="outline"
                onClick={saveDraft}
                disabled={createProduct.isPending || updateProduct.isPending}
                className="gap-2"
              >
                حفظ كمسودة
              </Button>
              
              <Button 
                onClick={handleSubmit}
                disabled={createProduct.isPending || updateProduct.isPending}
                className="gap-2"
              >
                {createProduct.isPending || updateProduct.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {mode === 'create' ? 'إنشاء المنتج' : 'تحديث المنتج'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 h-12">
              <TabsTrigger value="basic" className="gap-2">
                <Info className="h-4 w-4" />
                أساسية
              </TabsTrigger>
              <TabsTrigger value="media" className="gap-2">
                <ImageIcon className="h-4 w-4" />
                وسائط
              </TabsTrigger>
              <TabsTrigger value="pricing" className="gap-2">
                <DollarSign className="h-4 w-4" />
                تسعير
              </TabsTrigger>
              <TabsTrigger value="variants" className="gap-2">
                <Layers className="h-4 w-4" />
                متغيرات
              </TabsTrigger>
              <TabsTrigger value="seo" className="gap-2">
                <Star className="h-4 w-4" />
                SEO
              </TabsTrigger>
              <TabsTrigger value="shipping" className="gap-2">
                <Package className="h-4 w-4" />
                شحن
              </TabsTrigger>
            </TabsList>

            {/* معلومات أساسية */}
            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>المعلومات الأساسية</CardTitle>
                  <CardDescription>أدخل البيانات الأساسية للمنتج</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">اسم المنتج *</Label>
                      <Input
                        id="title"
                        value={formData.product.title}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          product: { ...prev.product, title: e.target.value }
                        }))}
                        placeholder="اسم المنتج (3-120 حرف)"
                        className={validationErrors.title ? 'border-destructive' : ''}
                      />
                      {validationErrors.title && (
                        <p className="text-sm text-destructive">{validationErrors.title}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="sku_root">كود المنتج الأساسي *</Label>
                      <Input
                        id="sku_root"
                        value={formData.product.sku_root}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          product: { ...prev.product, sku_root: e.target.value }
                        }))}
                        placeholder="PRD-2025-001"
                        className={validationErrors.sku_root ? 'border-destructive' : ''}
                      />
                      {validationErrors.sku_root && (
                        <p className="text-sm text-destructive">{validationErrors.sku_root}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">الوصف</Label>
                    <Textarea
                      id="description"
                      value={formData.product.description}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        product: { ...prev.product, description: e.target.value }
                      }))}
                      placeholder="وصف مفصل للمنتج..."
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="brand">العلامة التجارية</Label>
                      <Input
                        id="brand"
                        value={formData.product.brand || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          product: { ...prev.product, brand: e.target.value }
                        }))}
                        placeholder="اسم العلامة التجارية"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">حالة المنتج</Label>
                      <Select
                        value={formData.product.status}
                        onValueChange={(value: any) => setFormData(prev => ({
                          ...prev,
                          product: { ...prev.product, status: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">مسودة</SelectItem>
                          <SelectItem value="active">نشط</SelectItem>
                          <SelectItem value="inactive">غير نشط</SelectItem>
                          <SelectItem value="archived">مؤرشف</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2 pt-6">
                      <Switch
                        id="has_variants"
                        checked={formData.product.has_variants}
                        onCheckedChange={(checked) => setFormData(prev => ({
                          ...prev,
                          product: { ...prev.product, has_variants: checked }
                        }))}
                      />
                      <Label htmlFor="has_variants">يحتوي على متغيرات</Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>الكلمات المفتاحية</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="أضف كلمة مفتاحية..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const value = e.currentTarget.value.trim();
                            const tags = formData.product.tags || [];
                            if (value && !tags.includes(value)) {
                              setFormData(prev => ({
                                ...prev,
                                product: {
                                  ...prev.product,
                                  tags: [...(prev.product.tags || []), value]
                                }
                              }));
                              e.currentTarget.value = '';
                            }
                          }
                        }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(formData.product.tags || []).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="gap-1">
                          {tag}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 w-4"
                            onClick={() => setFormData(prev => ({
                              ...prev,
                              product: {
                                ...prev.product,
                                tags: (prev.product.tags || []).filter((_, i) => i !== index)
                              }
                            }))}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* إدارة الوسائط */}
            <TabsContent value="media">
              <MediaManager
                media={formData.media}
                onMediaChange={(media) => setFormData(prev => ({ ...prev, media }))}
                validationError={validationErrors.cover_image}
              />
            </TabsContent>

            {/* إدارة التسعير */}
            <TabsContent value="pricing">
              <DiscountManager
                basePrice={formData.product.price_sar}
                onBasePriceChange={(price) => setFormData(prev => ({
                  ...prev,
                  product: { ...prev.product, price_sar: price }
                }))}
                discounts={formData.discounts}
                onDiscountsChange={(discounts) => setFormData(prev => ({ ...prev, discounts }))}
                validationError={validationErrors.price_sar}
              />
            </TabsContent>

            {/* إدارة المتغيرات */}
            <TabsContent value="variants">
              <VariantManager
                hasVariants={formData.product.has_variants ?? false}
                skuRoot={formData.product.sku_root ?? ''}
                variants={formData.variants}
                onVariantsChange={(variants) => setFormData(prev => ({ ...prev, variants }))}
                validationError={validationErrors.variants}
              />
            </TabsContent>

            {/* إدارة SEO */}
            <TabsContent value="seo">
              <SEOManager
                seo={formData.seo}
                onSEOChange={(seo) => setFormData(prev => ({ ...prev, seo }))}
                productTitle={formData.product.title}
                validationErrors={{
                  seo_title: validationErrors.seo_title,
                  seo_description: validationErrors.seo_description
                }}
              />
            </TabsContent>

            {/* إدارة الشحن */}
            <TabsContent value="shipping">
              <ShippingManager
                shipping={formData.shipping}
                onShippingChange={(shipping) => setFormData(prev => ({ ...prev, shipping }))}
              />
            </TabsContent>
          </Tabs>

          {/* إعدادات النشر */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>إعدادات النشر</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="publish_now"
                      checked={isPublishNow}
                      onCheckedChange={setIsPublishNow}
                    />
                    <Label htmlFor="publish_now">نشر المنتج مباشرة</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {isPublishNow 
                      ? 'سيتم نشر المنتج وإتاحته للعملاء فوراً'
                      : 'سيتم حفظ المنتج كمسودة'
                    }
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/admin/inventory')}
                  >
                    إلغاء
                  </Button>
                  <Button
                    type="submit"
                    disabled={createProduct.isPending || updateProduct.isPending}
                  >
                    {createProduct.isPending || updateProduct.isPending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                    ) : null}
                    {isPublishNow ? 'نشر المنتج' : 'حفظ المنتج'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default AdvancedProductForm;