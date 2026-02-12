import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Star, 
  X, 
  Plus, 
  Search,
  Eye,
  CheckCircle,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { ProductSEO } from '@/hooks/useAdvancedProductManagement';

interface SEOManagerProps {
  seo: ProductSEO;
  onSEOChange: (seo: ProductSEO) => void;
  productTitle: string;
  validationErrors?: {
    seo_title?: string;
    seo_description?: string;
  };
}

const SEOManager: React.FC<SEOManagerProps> = ({
  seo,
  onSEOChange,
  productTitle,
  validationErrors = {}
}) => {
  const [newKeyword, setNewKeyword] = useState('');
  const [seoScore, setSeoScore] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // تحديث SEO
  const updateSEO = (field: keyof ProductSEO, value: any) => {
    const updatedSEO = { ...seo, [field]: value };
    onSEOChange(updatedSEO);
  };

  // إضافة كلمة مفتاحية
  const addKeyword = () => {
    if (!newKeyword.trim()) return;
    
    const keyword = newKeyword.trim().toLowerCase();
    const keywords = seo.meta_keywords || [];
    if (keywords.includes(keyword)) {
      setNewKeyword('');
      return;
    }

    updateSEO('meta_keywords', [...keywords, keyword]);
    setNewKeyword('');
  };

  // حذف كلمة مفتاحية
  const removeKeyword = (keywordToRemove: string) => {
    updateSEO('meta_keywords', (seo.meta_keywords || []).filter(k => k !== keywordToRemove));
  };

  // توليد عنوان SEO تلقائي
  const generateSEOTitle = () => {
    if (!seo.seo_title && productTitle) {
      const autoTitle = productTitle.length > 50 
        ? productTitle.substring(0, 50) + '...'
        : productTitle;
      updateSEO('seo_title', autoTitle);
    }
  };

  // توليد وصف SEO تلقائي
  const generateSEODescription = () => {
    if (!seo.seo_description && productTitle) {
      const autoDescription = `اشتري ${productTitle} بأفضل الأسعار. جودة عالية وتوصيل سريع. اطلب الآن!`;
      const trimmedDescription = autoDescription.length > 160 
        ? autoDescription.substring(0, 157) + '...'
        : autoDescription;
      updateSEO('seo_description', trimmedDescription);
    }
  };

  // توليد الـ slug
  const generateSlug = () => {
    if (!seo.slug && productTitle) {
      const slug = productTitle
        .toLowerCase()
        .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\w-]/g, '') // Arabic and English chars only
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      updateSEO('slug', slug);
    }
  };

  // حساب نقاط SEO
  useEffect(() => {
    let score = 0;
    const checks = [];

    // فحص العنوان
    if (seo.seo_title) {
      score += 25;
      if (seo.seo_title.length >= 30 && seo.seo_title.length <= 60) {
        score += 10;
      }
      checks.push({ name: 'عنوان SEO', status: 'good' });
    } else {
      checks.push({ name: 'عنوان SEO', status: 'missing' });
    }

    // فحص الوصف
    if (seo.seo_description) {
      score += 25;
      if (seo.seo_description.length >= 120 && seo.seo_description.length <= 160) {
        score += 10;
      }
      checks.push({ name: 'وصف SEO', status: 'good' });
    } else {
      checks.push({ name: 'وصف SEO', status: 'missing' });
    }

    // فحص الكلمات المفتاحية
    const keywords = seo.meta_keywords || [];
    if (keywords.length > 0) {
      score += 20;
      if (keywords.length >= 3 && keywords.length <= 10) {
        score += 10;
      }
      checks.push({ name: 'كلمات مفتاحية', status: 'good' });
    } else {
      checks.push({ name: 'كلمات مفتاحية', status: 'missing' });
    }

    // فحص الـ slug
    if (seo.slug) {
      score += 10;
      checks.push({ name: 'رابط SEO', status: 'good' });
    } else {
      checks.push({ name: 'رابط SEO', status: 'missing' });
    }

    setSeoScore(Math.min(score, 100));

    // اقتراحات للتحسين
    const newSuggestions = [];
    if (!seo.seo_title) {
      newSuggestions.push('أضف عنوان SEO جذاب يحتوي على كلمة مفتاحية رئيسية');
    } else if (seo.seo_title.length < 30) {
      newSuggestions.push('عنوان SEO قصير جداً، حاول إضافة المزيد من التفاصيل');
    } else if (seo.seo_title.length > 60) {
      newSuggestions.push('عنوان SEO طويل جداً، قد يظهر مقطوعاً في نتائج البحث');
    }

    if (!seo.seo_description) {
      newSuggestions.push('أضف وصف SEO يشرح فوائد المنتج ويحفز على الشراء');
    } else if (seo.seo_description.length < 120) {
      newSuggestions.push('وصف SEO قصير، حاول إضافة المزيد من التفاصيل المفيدة');
    } else if (seo.seo_description.length > 160) {
      newSuggestions.push('وصف SEO طويل جداً، قد يظهر مقطوعاً في نتائج البحث');
    }

    if ((seo.meta_keywords || []).length < 3) {
      newSuggestions.push('أضف المزيد من الكلمات المفتاحية ذات الصلة (3-10 كلمات)');
    }

    if (!seo.slug) {
      newSuggestions.push('أضف رابط SEO مخصص لتحسين ظهور المنتج في محركات البحث');
    }

    setSuggestions(newSuggestions);
  }, [seo]);

  return (
    <div className="space-y-6">
      {/* نقاط SEO */}
      <Card className={`border-2 ${
        seoScore >= 80 ? 'border-success/30 bg-success/5' :
        seoScore >= 50 ? 'border-warning/30 bg-warning/5' :
        'border-destructive/30 bg-destructive/5'
      }`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              نقاط تحسين محركات البحث (SEO)
            </span>
            <Badge variant={
              seoScore >= 80 ? "default" :
              seoScore >= 50 ? "secondary" :
              "destructive"
            }>
              {seoScore}/100
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={seoScore} className="h-3" />
            
            <div className="text-center">
              <p className="text-2xl font-bold">
                {seoScore >= 80 ? '🎉 ممتاز!' :
                 seoScore >= 50 ? '⚡ جيد' :
                 '🚀 يحتاج تحسين'}
              </p>
              <p className="text-sm text-muted-foreground">
                {seoScore >= 80 ? 'SEO محسّن بشكل رائع' :
                 seoScore >= 50 ? 'يمكن تحسين SEO أكثر' :
                 'يحتاج الكثير من التحسين'}
              </p>
            </div>

            {suggestions.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">اقتراحات للتحسين:</h4>
                <ul className="space-y-1">
                  {suggestions.map((suggestion, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 mt-0.5 text-warning flex-shrink-0" />
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* عنوان SEO */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            عنوان تحسين محركات البحث
          </CardTitle>
          <CardDescription>
            العنوان الذي سيظهر في نتائج البحث (30-60 حرف مثالي)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="seo_title">عنوان SEO</Label>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${
                  !seo.seo_title ? 'text-muted-foreground' :
                  seo.seo_title.length < 30 ? 'text-warning' :
                  seo.seo_title.length > 60 ? 'text-destructive' :
                  'text-success'
                }`}>
                  {seo.seo_title?.length || 0}/60
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateSEOTitle}
                  disabled={!productTitle}
                >
                  توليد تلقائي
                </Button>
              </div>
            </div>
            <Input
              id="seo_title"
              value={seo.seo_title || ''}
              onChange={(e) => updateSEO('seo_title', e.target.value)}
              placeholder="عنوان جذاب يحتوي على كلمة مفتاحية"
              maxLength={60}
              className={validationErrors.seo_title ? 'border-destructive' : ''}
            />
            {validationErrors.seo_title && (
              <p className="text-sm text-destructive">{validationErrors.seo_title}</p>
            )}
          </div>

          {/* معاينة في نتائج البحث */}
          {seo.seo_title && (
            <div className="p-4 border rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground mb-1">معاينة في جوجل:</p>
              <div className="space-y-1">
                <h3 className="text-info text-lg font-medium hover:underline cursor-pointer">
                  {seo.seo_title}
                </h3>
                <p className="text-success text-sm">
                  example.com/{seo.slug || 'product-name'}
                </p>
                {seo.seo_description && (
                  <p className="text-foreground/80 text-sm">
                    {seo.seo_description}
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* وصف SEO */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            وصف تحسين محركات البحث
          </CardTitle>
          <CardDescription>
            الوصف الذي سيظهر تحت العنوان في نتائج البحث (120-160 حرف مثالي)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="seo_description">وصف SEO</Label>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${
                  !seo.seo_description ? 'text-muted-foreground' :
                  seo.seo_description.length < 120 ? 'text-warning' :
                  seo.seo_description.length > 160 ? 'text-destructive' :
                  'text-success'
                }`}>
                  {seo.seo_description?.length || 0}/160
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateSEODescription}
                  disabled={!productTitle}
                >
                  توليد تلقائي
                </Button>
              </div>
            </div>
            <Textarea
              id="seo_description"
              value={seo.seo_description || ''}
              onChange={(e) => updateSEO('seo_description', e.target.value)}
              placeholder="وصف مقنع يشرح فوائد المنتج ويحفز على الشراء..."
              maxLength={160}
              rows={3}
              className={validationErrors.seo_description ? 'border-destructive' : ''}
            />
            {validationErrors.seo_description && (
              <p className="text-sm text-destructive">{validationErrors.seo_description}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* الكلمات المفتاحية */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge className="w-5 h-5 rounded-full" />
            الكلمات المفتاحية
          </CardTitle>
          <CardDescription>
            أضف كلمات مفتاحية تصف المنتج لتحسين ظهوره في نتائج البحث (3-10 كلمات مثالي)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="أضف كلمة مفتاحية..."
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
            />
            <Button 
              onClick={addKeyword}
              disabled={!newKeyword.trim() || (seo.meta_keywords || []).length >= 15}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {(seo.meta_keywords || []).length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>الكلمات المضافة ({(seo.meta_keywords || []).length})</Label>
                <span className="text-sm text-muted-foreground">15 كحد أقصى</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(seo.meta_keywords || []).map((keyword, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {keyword}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 w-4"
                      onClick={() => removeKeyword(keyword)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* اقتراحات كلمات مفتاحية */}
          {productTitle && (seo.meta_keywords || []).length < 5 && (
            <div className="space-y-2">
              <Label>اقتراحات:</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  productTitle.split(' ')[0],
                  'جودة عالية',
                  'سعر مناسب',
                  'توصيل مجاني',
                  'ضمان'
                ].filter(suggestion => 
                  !(seo.meta_keywords || []).includes(suggestion.toLowerCase())
                ).map((suggestion, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const keyword = suggestion.toLowerCase();
                      if (!(seo.meta_keywords || []).includes(keyword)) {
                        updateSEO('meta_keywords', [...(seo.meta_keywords || []), keyword]);
                      }
                    }}
                  >
                    + {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* رابط SEO */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            رابط المنتج (URL Slug)
          </CardTitle>
          <CardDescription>
            رابط مخصص للمنتج يحسن من ظهوره في محركات البحث
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="slug">رابط SEO</Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                  example.com/products/
                </span>
                <Input
                  id="slug"
                  value={seo.slug || ''}
                  onChange={(e) => updateSEO('slug', e.target.value.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF-]/g, '-'))}
                  placeholder="product-name-ar"
                  className="rounded-l-none"
                />
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={generateSlug}
              disabled={!productTitle}
              className="mt-8"
            >
              توليد تلقائي
            </Button>
          </div>

          {seo.slug && (
            <div className="p-3 bg-success/10 rounded-lg border border-success/30">
              <p className="text-sm text-success">
                <CheckCircle className="h-4 w-4 inline mr-1" />
                الرابط النهائي: <span className="font-mono">example.com/products/{seo.slug}</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SEOManager;