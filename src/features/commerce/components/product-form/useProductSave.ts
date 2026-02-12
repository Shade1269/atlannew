import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Custom Hook لحفظ بيانات المنتج
 * تم استخراجه من ProductForm.tsx handleSubmit function (113 سطر)
 * في 2025-11-22 لتحسين قابلية الصيانة
 */

interface ProductFormData {
  title: string;
  description: string;
  price_sar: number;
  stock: number;
  sku: string;
  category_id: string;
  brand_id: string;
  weight_kg: number;
  dimensions_cm: string;
  tags: string[];
  seo_title: string;
  seo_description: string;
  meta_keywords: string[];
  featured: boolean;
  is_active: boolean;
  min_order_quantity: number;
  max_order_quantity: number;
}

interface ProductImage {
  id?: string;
  image_url: string;
  alt_text: string;
  is_primary: boolean | null;
  sort_order: number | null;
}

interface ProductAttribute {
  id?: string;
  attribute_name: string;
  attribute_value: string;
  attribute_type: string | null;
  is_variant: boolean | null;
}

interface UseProductSaveParams {
  mode: 'create' | 'edit';
  productId?: string;
  merchantProfileId?: string;
}

export function useProductSave({ mode, productId, merchantProfileId }: UseProductSaveParams) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  /**
   * حفظ بيانات المنتج (الدالة الرئيسية)
   */
  const saveProduct = async (
    formData: ProductFormData,
    images: ProductImage[],
    attributes: ProductAttribute[]
  ) => {
    setIsSaving(true);

    try {
      // 1. الحصول على معرف التاجر
      const merchantId = await getMerchantId(merchantProfileId!);
      if (!merchantId) {
        throw new Error('لم يتم العثور على بيانات التاجر');
      }

      // 2. إعداد بيانات المنتج
      const productData = prepareProductData(formData, merchantId);

      // 3. حفظ المنتج (إنشاء أو تحديث)
      let savedProductId = productId;
      if (mode === 'create') {
        savedProductId = await createProduct(productData);
      } else {
        await updateProduct(productId!, productData);
      }

      // 4. حفظ الصور
      if (images.length > 0) {
        await saveProductImages(savedProductId!, images, formData.title);
      }

      // 5. حفظ الخصائص
      if (attributes.length > 0) {
        await saveProductAttributes(savedProductId!, attributes);
      }

      // 6. إظهار رسالة النجاح
      toast({
        title: mode === 'create' ? 'تم إنشاء المنتج' : 'تم تحديث المنتج',
        description: mode === 'create' ? 'تم إنشاء المنتج بنجاح' : 'تم تحديث المنتج بنجاح',
      });

      // 7. العودة إلى صفحة المخزون
      navigate('/admin/inventory');
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: 'خطأ في الحفظ',
        description: error instanceof Error ? error.message : 'تعذر حفظ المنتج',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * الحصول على معرف التاجر
   */
  const getMerchantId = async (profileId: string): Promise<string | null> => {
    const { data: merchantData } = await supabase
      .from('merchants')
      .select('id')
      .eq('profile_id', profileId)
      .maybeSingle();

    return merchantData?.id || null;
  };

  /**
   * إعداد بيانات المنتج
   */
  const prepareProductData = (formData: ProductFormData, merchantId: string) => {
    return {
      ...formData,
      merchant_id: merchantId,
      price_sar: Number(formData.price_sar),
      stock: Number(formData.stock),
      weight_kg: Number(formData.weight_kg) || null,
      min_order_quantity: Number(formData.min_order_quantity) || 1,
      max_order_quantity: Number(formData.max_order_quantity) || null,
    };
  };

  /**
   * إنشاء منتج جديد
   */
  const createProduct = async (productData: any): Promise<string> => {
    const { data: newProduct, error } = await supabase
      .from('products')
      .insert([productData])
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!newProduct) throw new Error('فشل في إنشاء المنتج');

    return newProduct.id;
  };

  /**
   * تحديث منتج موجود
   */
  const updateProduct = async (productId: string, productData: any) => {
    const { error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', productId);

    if (error) throw error;
  };

  /**
   * حفظ صور المنتج
   */
  const saveProductImages = async (
    productId: string,
    images: ProductImage[],
    productTitle: string
  ) => {
    // حذف الصور القديمة في حالة التحديث
    if (mode === 'edit') {
      await supabase.from('product_images').delete().eq('product_id', productId);
    }

    // إضافة الصور الجديدة
    const imagesToInsert = images.map((img, index) => ({
      product_id: productId,
      image_url: img.image_url,
      alt_text: img.alt_text || productTitle,
      sort_order: img.sort_order ?? index,
      is_primary: img.is_primary ?? index === 0,
    }));

    const { error: imagesError } = await supabase
      .from('product_images')
      .insert(imagesToInsert);

    if (imagesError) throw imagesError;
  };

  /**
   * حفظ خصائص المنتج
   */
  const saveProductAttributes = async (
    productId: string,
    attributes: ProductAttribute[]
  ) => {
    // حذف الخصائص القديمة في حالة التحديث
    if (mode === 'edit') {
      await supabase.from('product_attributes').delete().eq('product_id', productId);
    }

    // إضافة الخصائص الجديدة
    const attributesToInsert = attributes.map((attr) => ({
      product_id: productId,
      attribute_name: attr.attribute_name,
      attribute_value: attr.attribute_value,
      attribute_type: attr.attribute_type ?? 'text',
      is_variant: attr.is_variant ?? false,
    }));

    const { error: attributesError } = await supabase
      .from('product_attributes')
      .insert(attributesToInsert);

    if (attributesError) throw attributesError;
  };

  return {
    saveProduct,
    isSaving,
  };
}
