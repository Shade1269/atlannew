-- ============================================
-- Merchant Financial System Migration
-- ============================================

-- 1. إضافة حقول جديدة لجدول products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS merchant_base_price_sar NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS catalog_price_sar NUMERIC(10,2);

-- تعليق على الحقول
COMMENT ON COLUMN public.products.merchant_base_price_sar IS 'سعر التاجر الأساسي للمنتج';
COMMENT ON COLUMN public.products.catalog_price_sar IS 'سعر الكتالوج (سعر التاجر + 25% للمنصة)';

-- 2. جدول محفظة التجار
CREATE TABLE IF NOT EXISTS public.merchant_wallet_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  available_balance_sar NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  pending_balance_sar NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  lifetime_earnings_sar NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total_withdrawn_sar NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  minimum_withdrawal_sar NUMERIC(10,2) NOT NULL DEFAULT 100.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(merchant_id)
);

COMMENT ON TABLE public.merchant_wallet_balances IS 'محفظة التجار - تخزين أرصدة التجار';

-- 3. جدول معاملات التجار
CREATE TABLE IF NOT EXISTS public.merchant_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('COMMISSION_PENDING', 'COMMISSION_CONFIRMED', 'WITHDRAWAL_PENDING', 'WITHDRAWAL_COMPLETED', 'WITHDRAWAL_REJECTED', 'REFUND', 'ADJUSTMENT')),
  amount_sar NUMERIC(10,2) NOT NULL,
  balance_after_sar NUMERIC(10,2) NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_merchant_transactions_merchant ON public.merchant_transactions(merchant_id, created_at DESC);
COMMENT ON TABLE public.merchant_transactions IS 'سجل معاملات التجار المالية';

-- 4. جدول طلبات سحب التجار
CREATE TABLE IF NOT EXISTS public.merchant_withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount_sar NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'COMPLETED', 'REJECTED')),
  payment_method TEXT NOT NULL DEFAULT 'bank_transfer' CHECK (payment_method IN ('bank_transfer', 'stc_pay', 'wallet')),
  bank_details JSONB,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES public.profiles(id),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_merchant_withdrawals_merchant ON public.merchant_withdrawal_requests(merchant_id, requested_at DESC);
CREATE INDEX idx_merchant_withdrawals_status ON public.merchant_withdrawal_requests(status);
COMMENT ON TABLE public.merchant_withdrawal_requests IS 'طلبات سحب التجار';

-- 5. جدول أرباح المنصة
CREATE TABLE IF NOT EXISTS public.platform_revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  order_item_id UUID,
  merchant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  affiliate_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  merchant_base_price_sar NUMERIC(10,2) NOT NULL,
  platform_share_sar NUMERIC(10,2) NOT NULL,
  affiliate_commission_sar NUMERIC(10,2),
  final_sale_price_sar NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'REFUNDED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ
);

CREATE INDEX idx_platform_revenue_merchant ON public.platform_revenue(merchant_id);
CREATE INDEX idx_platform_revenue_order ON public.platform_revenue(order_id);
CREATE INDEX idx_platform_revenue_status ON public.platform_revenue(status);
COMMENT ON TABLE public.platform_revenue IS 'سجل أرباح المنصة من المبيعات';

-- ============================================
-- Functions
-- ============================================

-- Function: حساب catalog_price تلقائياً
CREATE OR REPLACE FUNCTION public.auto_calculate_catalog_price()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.merchant_base_price_sar IS NOT NULL THEN
    NEW.catalog_price_sar := NEW.merchant_base_price_sar * 1.25;
  END IF;
  RETURN NEW;
END;
$$;

-- Function: إنشاء محفظة للتاجر
CREATE OR REPLACE FUNCTION public.initialize_merchant_wallet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- إنشاء محفظة للتاجر فقط
  IF NEW.role = 'merchant' THEN
    INSERT INTO public.merchant_wallet_balances (
      merchant_id,
      available_balance_sar,
      pending_balance_sar,
      lifetime_earnings_sar,
      total_withdrawn_sar,
      minimum_withdrawal_sar
    )
    VALUES (
      NEW.id,
      0.00,
      0.00,
      0.00,
      0.00,
      100.00
    )
    ON CONFLICT (merchant_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function: تسجيل معاملة مالية للتاجر
CREATE OR REPLACE FUNCTION public.record_merchant_transaction(
  p_merchant_id UUID,
  p_transaction_type TEXT,
  p_amount_sar NUMERIC,
  p_reference_id UUID DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet RECORD;
  v_transaction_id UUID;
  v_new_balance NUMERIC;
BEGIN
  -- الحصول على الرصيد الحالي
  SELECT * INTO v_wallet
  FROM public.merchant_wallet_balances
  WHERE merchant_id = p_merchant_id
  FOR UPDATE;
  
  IF v_wallet IS NULL THEN
    RAISE EXCEPTION 'Merchant wallet not found for %', p_merchant_id;
  END IF;
  
  -- حساب الرصيد الجديد
  CASE p_transaction_type
    WHEN 'COMMISSION_CONFIRMED' THEN
      v_new_balance := v_wallet.available_balance_sar + p_amount_sar;
    WHEN 'WITHDRAWAL_COMPLETED' THEN
      v_new_balance := v_wallet.available_balance_sar - p_amount_sar;
    WHEN 'REFUND' THEN
      v_new_balance := v_wallet.available_balance_sar - p_amount_sar;
    WHEN 'ADJUSTMENT' THEN
      v_new_balance := v_wallet.available_balance_sar + p_amount_sar;
    ELSE
      v_new_balance := v_wallet.available_balance_sar;
  END CASE;
  
  -- التأكد من عدم سلبية الرصيد
  IF v_new_balance < 0 THEN
    RAISE EXCEPTION 'Insufficient balance. Current: %, Requested: %', 
      v_wallet.available_balance_sar, p_amount_sar;
  END IF;
  
  -- تسجيل المعاملة
  INSERT INTO public.merchant_transactions (
    merchant_id,
    transaction_type,
    amount_sar,
    balance_after_sar,
    reference_id,
    reference_type,
    description
  )
  VALUES (
    p_merchant_id,
    p_transaction_type,
    p_amount_sar,
    v_new_balance,
    p_reference_id,
    p_reference_type,
    p_description
  )
  RETURNING id INTO v_transaction_id;
  
  -- تحديث الرصيد
  UPDATE public.merchant_wallet_balances
  SET 
    available_balance_sar = v_new_balance,
    lifetime_earnings_sar = CASE 
      WHEN p_transaction_type = 'COMMISSION_CONFIRMED' THEN lifetime_earnings_sar + p_amount_sar
      ELSE lifetime_earnings_sar
    END,
    total_withdrawn_sar = CASE
      WHEN p_transaction_type = 'WITHDRAWAL_COMPLETED' THEN total_withdrawn_sar + p_amount_sar
      ELSE total_withdrawn_sar
    END,
    updated_at = NOW()
  WHERE merchant_id = p_merchant_id;
  
  RETURN v_transaction_id;
END;
$$;

-- Function: إنشاء رصيد معلق عند الدفع
CREATE OR REPLACE FUNCTION public.create_merchant_pending_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item RECORD;
  v_merchant_id UUID;
  v_affiliate_id UUID;
  v_merchant_base NUMERIC;
  v_platform_share NUMERIC;
  v_affiliate_commission NUMERIC;
BEGIN
  -- التحقق من أن الطلب تم دفعه
  IF NEW.payment_status = 'PAID' AND (OLD.payment_status IS DISTINCT FROM 'PAID' OR OLD IS NULL) THEN
    
    -- المرور على جميع منتجات الطلب
    FOR v_item IN 
      SELECT 
        oi.id,
        oi.product_id,
        oi.unit_price_sar,
        oi.quantity,
        oi.commission_sar,
        p.merchant_id,
        p.merchant_base_price_sar
      FROM public.ecommerce_order_items oi
      JOIN public.products p ON p.id = oi.product_id
      WHERE oi.order_id = NEW.id
    LOOP
      v_merchant_id := v_item.merchant_id;
      
      -- حساب المبالغ
      v_merchant_base := COALESCE(v_item.merchant_base_price_sar, v_item.unit_price_sar * 0.75) * v_item.quantity;
      v_platform_share := v_merchant_base * 0.25;
      v_affiliate_commission := v_item.commission_sar;
      
      -- الحصول على المسوق من order_hub
      SELECT affiliate_id INTO v_affiliate_id
      FROM public.order_hub
      WHERE source_order_id = NEW.id AND source = 'ecommerce'
      LIMIT 1;
      
      -- إضافة رصيد معلق للتاجر
      UPDATE public.merchant_wallet_balances
      SET 
        pending_balance_sar = pending_balance_sar + v_merchant_base,
        updated_at = NOW()
      WHERE merchant_id = v_merchant_id;
      
      -- تسجيل أرباح المنصة
      INSERT INTO public.platform_revenue (
        order_id,
        order_item_id,
        merchant_id,
        affiliate_id,
        merchant_base_price_sar,
        platform_share_sar,
        affiliate_commission_sar,
        final_sale_price_sar,
        status
      )
      VALUES (
        NEW.id,
        v_item.id,
        v_merchant_id,
        v_affiliate_id,
        v_merchant_base,
        v_platform_share,
        v_affiliate_commission,
        v_item.unit_price_sar * v_item.quantity,
        'PENDING'
      );
      
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function: تأكيد الرصيد عند التوصيل
CREATE OR REPLACE FUNCTION public.confirm_merchant_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_revenue RECORD;
BEGIN
  -- التحقق من أن الطلب تم توصيله
  IF NEW.status = 'DELIVERED' AND OLD.status IS DISTINCT FROM 'DELIVERED' THEN
    
    -- المرور على جميع إيرادات هذا الطلب
    FOR v_revenue IN 
      SELECT * FROM public.platform_revenue
      WHERE order_id = NEW.source_order_id AND status = 'PENDING'
    LOOP
      -- نقل من pending إلى available
      UPDATE public.merchant_wallet_balances
      SET 
        pending_balance_sar = pending_balance_sar - v_revenue.merchant_base_price_sar,
        updated_at = NOW()
      WHERE merchant_id = v_revenue.merchant_id;
      
      -- تسجيل المعاملة
      PERFORM public.record_merchant_transaction(
        v_revenue.merchant_id,
        'COMMISSION_CONFIRMED',
        v_revenue.merchant_base_price_sar,
        v_revenue.id,
        'platform_revenue',
        'مبيعات مؤكدة من الطلب #' || NEW.order_number
      );
      
      -- تحديث حالة الإيراد
      UPDATE public.platform_revenue
      SET 
        status = 'CONFIRMED',
        confirmed_at = NOW()
      WHERE id = v_revenue.id;
      
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function: معالجة طلب سحب التاجر
CREATE OR REPLACE FUNCTION public.process_merchant_withdrawal(
  p_withdrawal_id UUID,
  p_status TEXT,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_withdrawal RECORD;
BEGIN
  -- الحصول على طلب السحب
  SELECT * INTO v_withdrawal
  FROM public.merchant_withdrawal_requests
  WHERE id = p_withdrawal_id
  FOR UPDATE;
  
  IF v_withdrawal IS NULL THEN
    RAISE EXCEPTION 'Withdrawal request not found';
  END IF;
  
  IF v_withdrawal.status != 'PENDING' THEN
    RAISE EXCEPTION 'Withdrawal request already processed';
  END IF;
  
  -- تحديث حالة الطلب
  UPDATE public.merchant_withdrawal_requests
  SET 
    status = p_status,
    admin_notes = p_admin_notes,
    processed_by = auth.uid(),
    processed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_withdrawal_id;
  
  -- إذا تمت الموافقة، تسجيل المعاملة
  IF p_status = 'APPROVED' OR p_status = 'COMPLETED' THEN
    PERFORM public.record_merchant_transaction(
      v_withdrawal.merchant_id,
      'WITHDRAWAL_COMPLETED',
      v_withdrawal.amount_sar,
      v_withdrawal.id,
      'withdrawal',
      'سحب - طلب #' || v_withdrawal.id
    );
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Function: عكس المعاملة عند الإرجاع
CREATE OR REPLACE FUNCTION public.reverse_merchant_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_revenue RECORD;
BEGIN
  -- عند إنشاء طلب إرجاع
  IF TG_OP = 'INSERT' THEN
    
    -- البحث عن الإيرادات المرتبطة
    FOR v_revenue IN 
      SELECT * FROM public.platform_revenue
      WHERE order_id = NEW.order_id
    LOOP
      -- خصم من الرصيد
      IF v_revenue.status = 'CONFIRMED' THEN
        -- خصم من available
        PERFORM public.record_merchant_transaction(
          v_revenue.merchant_id,
          'REFUND',
          v_revenue.merchant_base_price_sar,
          NEW.id,
          'return',
          'إرجاع منتج - طلب #' || NEW.id
        );
      ELSE
        -- خصم من pending
        UPDATE public.merchant_wallet_balances
        SET 
          pending_balance_sar = pending_balance_sar - v_revenue.merchant_base_price_sar,
          updated_at = NOW()
        WHERE merchant_id = v_revenue.merchant_id;
      END IF;
      
      -- تحديث حالة الإيراد
      UPDATE public.platform_revenue
      SET status = 'REFUNDED'
      WHERE id = v_revenue.id;
      
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================
-- Triggers
-- ============================================

-- Trigger: حساب catalog_price تلقائياً
DROP TRIGGER IF EXISTS trg_auto_calculate_catalog_price ON public.products;
CREATE TRIGGER trg_auto_calculate_catalog_price
  BEFORE INSERT OR UPDATE OF merchant_base_price_sar ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_calculate_catalog_price();

-- Trigger: إنشاء محفظة التاجر عند التسجيل
DROP TRIGGER IF EXISTS trg_initialize_merchant_wallet ON public.profiles;
CREATE TRIGGER trg_initialize_merchant_wallet
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_merchant_wallet();

-- Trigger: إنشاء رصيد معلق عند الدفع
DROP TRIGGER IF EXISTS trg_create_merchant_pending ON public.ecommerce_orders;
CREATE TRIGGER trg_create_merchant_pending
  AFTER INSERT OR UPDATE OF payment_status ON public.ecommerce_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.create_merchant_pending_balance();

-- Trigger: تأكيد الرصيد عند التوصيل
DROP TRIGGER IF EXISTS trg_confirm_merchant_balance ON public.order_hub;
CREATE TRIGGER trg_confirm_merchant_balance
  AFTER UPDATE OF status ON public.order_hub
  FOR EACH ROW
  EXECUTE FUNCTION public.confirm_merchant_balance();

-- Trigger: عكس المعاملة عند الإرجاع
DROP TRIGGER IF EXISTS trg_reverse_merchant_transaction ON public.order_returns;
CREATE TRIGGER trg_reverse_merchant_transaction
  AFTER INSERT ON public.order_returns
  FOR EACH ROW
  EXECUTE FUNCTION public.reverse_merchant_transaction();

-- Trigger: تحديث updated_at للمحفظة
DROP TRIGGER IF EXISTS trg_merchant_wallet_updated_at ON public.merchant_wallet_balances;
CREATE TRIGGER trg_merchant_wallet_updated_at
  BEFORE UPDATE ON public.merchant_wallet_balances
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Trigger: تحديث updated_at لطلبات السحب
DROP TRIGGER IF EXISTS trg_merchant_withdrawal_updated_at ON public.merchant_withdrawal_requests;
CREATE TRIGGER trg_merchant_withdrawal_updated_at
  BEFORE UPDATE ON public.merchant_withdrawal_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- تفعيل RLS
ALTER TABLE public.merchant_wallet_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_revenue ENABLE ROW LEVEL SECURITY;

-- Policies: merchant_wallet_balances
CREATE POLICY "Merchants view own wallet"
  ON public.merchant_wallet_balances FOR SELECT
  USING (
    merchant_id IN (
      SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins view all wallets"
  ON public.merchant_wallet_balances FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Policies: merchant_transactions
CREATE POLICY "Merchants view own transactions"
  ON public.merchant_transactions FOR SELECT
  USING (
    merchant_id IN (
      SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins view all transactions"
  ON public.merchant_transactions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Policies: merchant_withdrawal_requests
CREATE POLICY "Merchants view own withdrawals"
  ON public.merchant_withdrawal_requests FOR SELECT
  USING (
    merchant_id IN (
      SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Merchants create own withdrawals"
  ON public.merchant_withdrawal_requests FOR INSERT
  WITH CHECK (
    merchant_id IN (
      SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins manage all withdrawals"
  ON public.merchant_withdrawal_requests FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Policies: platform_revenue
CREATE POLICY "Admins view all revenue"
  ON public.platform_revenue FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Merchants view own revenue"
  ON public.platform_revenue FOR SELECT
  USING (
    merchant_id IN (
      SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
    )
  );