-- إصلاح مشكلة RLS للدالة وإضافة نسبة عمولة مخصصة للمنتجات
ALTER TABLE affiliate_products 
ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT 10.00;

-- تحسين دالة معالجة طلبات المسوقين لاستخدام نسبة العمولة المخصصة
CREATE OR REPLACE FUNCTION public.process_affiliate_order(p_session_id text, p_affiliate_store_id uuid, p_order_items jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_affiliate_profile_id UUID;
  v_order_id UUID;
  v_total_commission NUMERIC := 0;
  v_order_item JSONB;
  v_commission_record UUID;
  v_product_commission_rate NUMERIC := 10.00;
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
    -- الحصول على نسبة العمولة المخصصة للمنتج
    SELECT COALESCE(commission_rate, 10.00) INTO v_product_commission_rate
    FROM affiliate_products 
    WHERE affiliate_store_id = p_affiliate_store_id 
      AND product_id = (v_order_item->>'product_id')::UUID;
    
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
      v_product_commission_rate,
      (v_order_item->>'unit_price')::NUMERIC * (v_order_item->>'quantity')::INTEGER * (v_product_commission_rate / 100),
      'confirmed'
    );
    
    -- حساب إجمالي العمولة
    v_total_commission := v_total_commission + 
      ((v_order_item->>'unit_price')::NUMERIC * (v_order_item->>'quantity')::INTEGER * (v_product_commission_rate / 100));
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
    v_product_commission_rate,
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
$function$;