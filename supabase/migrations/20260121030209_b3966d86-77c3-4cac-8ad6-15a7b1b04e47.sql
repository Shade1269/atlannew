-- =============================================
-- إنشاء Triggers للأتمتة الكاملة
-- =============================================

-- 1. Trigger: إنشاء العمولات عند دفع الطلب
CREATE OR REPLACE FUNCTION public.trigger_generate_commissions_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- فقط عند تغيير الحالة إلى PAID
  IF NEW.payment_status = 'PAID' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'PAID') THEN
    -- استدعاء الدالة الموجودة لإنشاء العمولات
    PERFORM public._on_order_paid_generate_commissions(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_generate_commissions_on_payment ON public.ecommerce_orders;
CREATE TRIGGER trg_generate_commissions_on_payment
  AFTER UPDATE OF payment_status ON public.ecommerce_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_generate_commissions_on_payment();

-- 2. Trigger: تحديث محفظة المسوق عند إنشاء عمولة
CREATE OR REPLACE FUNCTION public.trigger_update_wallet_on_commission()
RETURNS TRIGGER AS $$
BEGIN
  -- تحديث أو إنشاء رصيد المحفظة للمسوق
  INSERT INTO public.wallet_balances (affiliate_profile_id, pending_balance_sar, updated_at)
  VALUES (NEW.affiliate_profile_id, NEW.amount_sar, NOW())
  ON CONFLICT (affiliate_profile_id) 
  DO UPDATE SET 
    pending_balance_sar = wallet_balances.pending_balance_sar + NEW.amount_sar,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_update_wallet_on_commission ON public.commissions;
CREATE TRIGGER trg_update_wallet_on_commission
  AFTER INSERT ON public.commissions
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_wallet_on_commission();

-- 3. Trigger: تسجيل إيراد المنصة
CREATE OR REPLACE FUNCTION public.trigger_record_platform_revenue()
RETURNS TRIGGER AS $$
DECLARE
  platform_rate DECIMAL(5,2) := 0.05; -- 5% حصة المنصة الافتراضية
  platform_amount DECIMAL(10,2);
BEGIN
  IF NEW.payment_status = 'PAID' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'PAID') THEN
    platform_amount := NEW.total_sar * platform_rate;
    
    -- تسجيل في جدول إيرادات المنصة إذا كان موجوداً
    INSERT INTO public.platform_revenue (order_id, amount_sar, revenue_type, created_at)
    VALUES (NEW.id, platform_amount, 'ORDER_COMMISSION', NOW())
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
EXCEPTION
  WHEN undefined_table THEN
    -- الجدول غير موجود، نتجاهل
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_record_platform_revenue ON public.ecommerce_orders;
CREATE TRIGGER trg_record_platform_revenue
  AFTER UPDATE OF payment_status ON public.ecommerce_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_record_platform_revenue();

-- 4. Trigger: حركة المخزون عند إنشاء الطلب
CREATE OR REPLACE FUNCTION public.trigger_inventory_movement_on_order()
RETURNS TRIGGER AS $$
BEGIN
  -- تسجيل حركة المخزون للمنتجات في الطلب
  INSERT INTO public.inventory_movements (
    product_id,
    movement_type,
    quantity,
    reference_type,
    reference_id,
    notes,
    created_at
  )
  SELECT 
    oi.product_id,
    'SALE',
    -oi.quantity,
    'ORDER',
    NEW.id,
    'طلب رقم: ' || NEW.order_number,
    NOW()
  FROM public.ecommerce_order_items oi
  WHERE oi.order_id = NEW.id
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN undefined_table THEN
    RETURN NEW;
  WHEN undefined_column THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_inventory_movement_on_order ON public.ecommerce_orders;
CREATE TRIGGER trg_inventory_movement_on_order
  AFTER UPDATE OF payment_status ON public.ecommerce_orders
  FOR EACH ROW
  WHEN (NEW.payment_status = 'PAID')
  EXECUTE FUNCTION public.trigger_inventory_movement_on_order();

-- 5. Trigger: تحديث محفظة التاجر
CREATE OR REPLACE FUNCTION public.trigger_update_merchant_wallet()
RETURNS TRIGGER AS $$
DECLARE
  v_merchant_id UUID;
  merchant_amount DECIMAL(10,2);
BEGIN
  IF NEW.payment_status = 'PAID' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'PAID') THEN
    -- الحصول على معرف التاجر
    SELECT merchant_id INTO v_merchant_id 
    FROM public.shops 
    WHERE id = NEW.shop_id;
    
    IF v_merchant_id IS NOT NULL THEN
      -- حساب مبلغ التاجر (إجمالي - عمولة المنصة)
      merchant_amount := NEW.total_sar * 0.95;
      
      -- تحديث أو إنشاء رصيد التاجر
      INSERT INTO public.merchant_wallet_balances (merchant_id, pending_balance_sar, updated_at)
      VALUES (v_merchant_id, merchant_amount, NOW())
      ON CONFLICT (merchant_id) 
      DO UPDATE SET 
        pending_balance_sar = merchant_wallet_balances.pending_balance_sar + merchant_amount,
        updated_at = NOW();
    END IF;
  END IF;
  RETURN NEW;
EXCEPTION
  WHEN undefined_table THEN
    RETURN NEW;
  WHEN undefined_column THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_update_merchant_wallet ON public.ecommerce_orders;
CREATE TRIGGER trg_update_merchant_wallet
  AFTER UPDATE OF payment_status ON public.ecommerce_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_merchant_wallet();