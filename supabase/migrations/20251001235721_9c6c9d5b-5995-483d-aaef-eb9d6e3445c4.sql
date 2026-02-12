-- إضافة سياسة RLS للسماح بإنشاء طلبات من المتاجر العامة
-- يسمح للجميع (بما فيهم الزوار) بإنشاء طلبات

CREATE POLICY "Allow public insert orders from storefronts"
ON public.ecommerce_orders
FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- السماح بإنشاء الطلبات إذا كان لديهم:
  -- 1. affiliate_store_id موجود (طلب من متجر مسوق)
  -- 2. أو shop_id موجود (طلب من متجر عادي)
  (affiliate_store_id IS NOT NULL OR shop_id IS NOT NULL)
);