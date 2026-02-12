-- إصلاح RLS policies للسماح للعملاء بعرض متاجر المسوقين والمنتجات

-- السماح للجميع بعرض المتاجر النشطة
DROP POLICY IF EXISTS "Public can view active affiliate stores" ON public.affiliate_stores;
CREATE POLICY "Public can view active affiliate stores" 
ON public.affiliate_stores 
FOR SELECT 
USING (is_active = true);

-- السماح للجميع بعرض منتجات المتاجر النشطة
DROP POLICY IF EXISTS "Public can view visible affiliate products" ON public.affiliate_products;
CREATE POLICY "Public can view visible affiliate products" 
ON public.affiliate_products 
FOR SELECT 
USING (
  is_visible = true 
  AND affiliate_store_id IN (
    SELECT id FROM affiliate_stores WHERE is_active = true
  )
);

-- السماح للجميع بعرض المنتجات النشطة
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
CREATE POLICY "Public can view active products" 
ON public.products 
FOR SELECT 
USING (is_active = true);

-- إنشاء جدول تتبع الطلبات للعمولات
CREATE TABLE IF NOT EXISTS public.order_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  affiliate_store_id UUID REFERENCES public.affiliate_stores(id),
  affiliate_profile_id UUID REFERENCES public.profiles(id),
  product_id UUID REFERENCES public.products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price_sar NUMERIC NOT NULL,
  commission_rate NUMERIC NOT NULL DEFAULT 10.00,
  commission_amount_sar NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل RLS على جدول تتبع الطلبات
ALTER TABLE public.order_tracking ENABLE ROW LEVEL SECURITY;

-- السماح للمسوقين برؤية طلباتهم
CREATE POLICY "Affiliates can view their order tracking" 
ON public.order_tracking 
FOR SELECT 
USING (
  affiliate_profile_id IN (
    SELECT id FROM profiles WHERE auth_user_id = auth.uid()
  )
);

-- السماح للنظام بإنشاء تتبع الطلبات
CREATE POLICY "System can create order tracking" 
ON public.order_tracking 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL OR (auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- السماح للنظام بتحديث حالة الطلبات
CREATE POLICY "System can update order tracking" 
ON public.order_tracking 
FOR UPDATE 
USING (auth.uid() IS NOT NULL OR (auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- إنشاء function لحساب العمولة وإنشاء الطلب
CREATE OR REPLACE FUNCTION public.process_affiliate_order(
  p_session_id TEXT,
  p_affiliate_store_id UUID,
  p_order_items JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_affiliate_profile_id UUID;
  v_order_id UUID;
  v_total_commission NUMERIC := 0;
  v_order_item JSONB;
  v_commission_record UUID;
BEGIN
  -- الحصول على معرف ملف المسوق
  SELECT profile_id INTO v_affiliate_profile_id 
  FROM affiliate_stores 
  WHERE id = p_affiliate_store_id;
  
  IF v_affiliate_profile_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'متجر المسوق غير موجود');
  END IF;
  
  -- إنشاء الطلب الرئيسي (مؤقت - سيتم ربطه بنظام الطلبات الحقيقي لاحقاً)
  v_order_id := gen_random_uuid();
  
  -- معالجة كل منتج منفرداً
  FOR v_order_item IN SELECT * FROM jsonb_array_elements(p_order_items)
  LOOP
    -- إنشاء تتبع الطلب
    INSERT INTO order_tracking (
      session_id,
      affiliate_store_id,
      affiliate_profile_id, 
      product_id,
      quantity,
      unit_price_sar,
      commission_rate,
      commission_amount_sar,
      status
    ) VALUES (
      p_session_id,
      p_affiliate_store_id,
      v_affiliate_profile_id,
      (v_order_item->>'product_id')::UUID,
      (v_order_item->>'quantity')::INTEGER,
      (v_order_item->>'unit_price')::NUMERIC,
      10.00, -- نسبة عمولة ثابتة 10%
      (v_order_item->>'unit_price')::NUMERIC * (v_order_item->>'quantity')::INTEGER * 0.10,
      'confirmed'
    );
    
    -- حساب إجمالي العمولة
    v_total_commission := v_total_commission + 
      ((v_order_item->>'unit_price')::NUMERIC * (v_order_item->>'quantity')::INTEGER * 0.10);
  END LOOP;
  
  -- إنشاء سجل العمولة النهائي
  INSERT INTO commissions (
    affiliate_id,
    order_id,
    order_item_id,
    commission_rate,
    amount_sar,
    status,
    confirmed_at
  ) VALUES (
    v_affiliate_profile_id,
    v_order_id,
    v_order_id, -- مؤقت
    10.00,
    v_total_commission,
    'CONFIRMED',
    now()
  ) RETURNING id INTO v_commission_record;
  
  -- تحديث إحصائيات المتجر
  UPDATE affiliate_stores 
  SET 
    total_orders = total_orders + 1,
    total_sales = total_sales + v_total_commission * 10, -- تقدير المبيعات
    updated_at = now()
  WHERE id = p_affiliate_store_id;
  
  -- تحديث نقاط المسوق
  UPDATE profiles 
  SET 
    points = points + (v_total_commission::INTEGER),
    total_earnings = total_earnings + v_total_commission,
    updated_at = now()
  WHERE id = v_affiliate_profile_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'commission_amount', v_total_commission,
    'commission_id', v_commission_record
  );
END;
$$;