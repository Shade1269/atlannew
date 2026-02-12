
-- ===============================================
-- المرحلة 1: إصلاح الثغرات الحرجة في order_hub
-- إضافة المفاتيح الأجنبية والـ Triggers المفقودة
-- (بدون CONCURRENTLY لتجنب خطأ transaction block)
-- ===============================================

-- 1) إنشاء الفهارس أولاً
CREATE INDEX IF NOT EXISTS idx_product_returns_order_hub_id 
  ON public.product_returns(order_hub_id);

CREATE INDEX IF NOT EXISTS idx_refunds_order_hub_id 
  ON public.refunds(order_hub_id);

CREATE INDEX IF NOT EXISTS idx_shipments_order_hub_id 
  ON public.shipments(order_hub_id);

CREATE INDEX IF NOT EXISTS idx_invoices_order_hub_id 
  ON public.invoices(order_hub_id);

-- 2) إضافة المفاتيح الأجنبية
-- product_returns
ALTER TABLE public.product_returns
  DROP CONSTRAINT IF EXISTS fk_returns_order_hub;

ALTER TABLE public.product_returns
  ADD CONSTRAINT fk_returns_order_hub
  FOREIGN KEY (order_hub_id) 
  REFERENCES public.order_hub(id) 
  ON DELETE SET NULL;

-- refunds
ALTER TABLE public.refunds
  DROP CONSTRAINT IF EXISTS fk_refunds_order_hub;

ALTER TABLE public.refunds
  ADD CONSTRAINT fk_refunds_order_hub
  FOREIGN KEY (order_hub_id) 
  REFERENCES public.order_hub(id) 
  ON DELETE SET NULL;

-- shipments
ALTER TABLE public.shipments
  DROP CONSTRAINT IF EXISTS fk_shipments_order_hub;

ALTER TABLE public.shipments
  ADD CONSTRAINT fk_shipments_order_hub
  FOREIGN KEY (order_hub_id) 
  REFERENCES public.order_hub(id) 
  ON DELETE SET NULL;

-- invoices
ALTER TABLE public.invoices
  DROP CONSTRAINT IF EXISTS fk_invoices_order_hub;

ALTER TABLE public.invoices
  ADD CONSTRAINT fk_invoices_order_hub
  FOREIGN KEY (order_hub_id) 
  REFERENCES public.order_hub(id) 
  ON DELETE SET NULL;

-- 3) Triggers للـ Auto-Sync من الجداول القديمة إلى order_hub

-- Trigger لـ ecommerce_orders
CREATE OR REPLACE FUNCTION public.sync_order_hub_from_ecommerce()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.order_hub (
      source, 
      source_order_id, 
      order_number, 
      customer_name, 
      customer_phone, 
      customer_email, 
      total_amount_sar, 
      status, 
      payment_status, 
      shop_id, 
      affiliate_store_id,
      created_at,
      updated_at
    )
    VALUES (
      'ecommerce',
      NEW.id,
      NEW.order_number,
      NEW.customer_name,
      NEW.customer_phone,
      NEW.customer_email,
      COALESCE(NEW.total_sar, 0),
      NEW.status,
      NEW.payment_status,
      NEW.shop_id,
      NEW.affiliate_store_id,
      NEW.created_at,
      NEW.updated_at
    )
    ON CONFLICT (source, source_order_id) DO NOTHING;
    
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.order_hub
    SET 
      order_number = NEW.order_number,
      customer_name = NEW.customer_name,
      customer_phone = NEW.customer_phone,
      customer_email = NEW.customer_email,
      total_amount_sar = COALESCE(NEW.total_sar, 0),
      status = NEW.status,
      payment_status = NEW.payment_status,
      updated_at = NEW.updated_at
    WHERE source = 'ecommerce' AND source_order_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_ecommerce_to_hub ON public.ecommerce_orders;
CREATE TRIGGER trg_sync_ecommerce_to_hub
  AFTER INSERT OR UPDATE ON public.ecommerce_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_order_hub_from_ecommerce();

-- Trigger لـ simple_orders
CREATE OR REPLACE FUNCTION public.sync_order_hub_from_simple()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.order_hub (
      source,
      source_order_id,
      order_number,
      customer_name,
      customer_phone,
      customer_email,
      total_amount_sar,
      status,
      payment_status,
      affiliate_store_id,
      created_at,
      updated_at
    )
    VALUES (
      'simple',
      NEW.id,
      NEW.id::text,
      NEW.customer_name,
      NEW.customer_phone,
      NEW.customer_email,
      COALESCE(NEW.total_amount_sar, 0),
      COALESCE(NEW.order_status, 'pending'),
      COALESCE(NEW.payment_status, 'pending'),
      NEW.affiliate_store_id,
      NEW.created_at,
      NEW.updated_at
    )
    ON CONFLICT (source, source_order_id) DO NOTHING;
    
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.order_hub
    SET
      customer_name = NEW.customer_name,
      customer_phone = NEW.customer_phone,
      customer_email = NEW.customer_email,
      total_amount_sar = COALESCE(NEW.total_amount_sar, 0),
      status = COALESCE(NEW.order_status, 'pending'),
      payment_status = COALESCE(NEW.payment_status, 'pending'),
      updated_at = NEW.updated_at
    WHERE source = 'simple' AND source_order_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_simple_to_hub ON public.simple_orders;
CREATE TRIGGER trg_sync_simple_to_hub
  AFTER INSERT OR UPDATE ON public.simple_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_order_hub_from_simple();

-- 4) فحص جودة البيانات - function للتحقق من الـ orphans
CREATE OR REPLACE FUNCTION public.check_order_hub_orphans()
RETURNS TABLE(
  table_name text,
  orphan_count bigint,
  details jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- فحص product_returns
  RETURN QUERY
  SELECT 
    'product_returns'::text,
    COUNT(*)::bigint,
    jsonb_build_object('sample_ids', array_agg(r.id) FILTER (WHERE r.id IS NOT NULL))
  FROM product_returns r
  LEFT JOIN order_hub oh ON oh.id = r.order_hub_id
  WHERE r.order_hub_id IS NOT NULL AND oh.id IS NULL;
  
  -- فحص refunds
  RETURN QUERY
  SELECT 
    'refunds'::text,
    COUNT(*)::bigint,
    jsonb_build_object('sample_ids', array_agg(rf.id) FILTER (WHERE rf.id IS NOT NULL))
  FROM refunds rf
  LEFT JOIN order_hub oh ON oh.id = rf.order_hub_id
  WHERE rf.order_hub_id IS NOT NULL AND oh.id IS NULL;
  
  -- فحص shipments
  RETURN QUERY
  SELECT 
    'shipments'::text,
    COUNT(*)::bigint,
    jsonb_build_object('sample_ids', array_agg(s.id) FILTER (WHERE s.id IS NOT NULL))
  FROM shipments s
  LEFT JOIN order_hub oh ON oh.id = s.order_hub_id
  WHERE s.order_hub_id IS NOT NULL AND oh.id IS NULL;
  
  -- فحص invoices
  RETURN QUERY
  SELECT 
    'invoices'::text,
    COUNT(*)::bigint,
    jsonb_build_object('sample_ids', array_agg(i.id) FILTER (WHERE i.id IS NOT NULL))
  FROM invoices i
  LEFT JOIN order_hub oh ON oh.id = i.order_hub_id
  WHERE i.order_hub_id IS NOT NULL AND oh.id IS NULL;
END;
$$;

-- 5) إضافة تعليقات للتوثيق
COMMENT ON TABLE public.order_hub IS 'جدول محور موحد لجميع الطلبات (ecommerce + simple + legacy) - SSOT للطلبات';
COMMENT ON COLUMN public.order_hub.source IS 'مصدر الطلب: ecommerce, simple, legacy';
COMMENT ON COLUMN public.order_hub.source_order_id IS 'معرف الطلب الأصلي في الجدول المصدر';
