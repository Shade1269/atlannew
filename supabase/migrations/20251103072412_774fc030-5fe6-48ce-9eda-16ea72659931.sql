-- إصلاح آخر triggers التي تستخدم PAID
-- في الملفات الفرعية مثل sql/03_commissions_pipeline.sql

-- تحديث آخر Functions التي لا تزال تستخدم PAID
CREATE OR REPLACE FUNCTION public._mark_order_paid_from_tx()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.payment_status = 'COMPLETED' AND NEW.order_id IS NOT NULL THEN
    UPDATE public.ecommerce_orders
    SET payment_status = 'COMPLETED',
        updated_at = NOW()
    WHERE id = NEW.order_id
      AND payment_status <> 'COMPLETED';
  END IF;
  RETURN NEW;
END;
$$;

-- إضافة PAID إلى enum payment_status لتجنب أخطاء المستقبل
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'PAID';

-- إضافة COMPLETED إلى enum payment_status إذا لم يكن موجوداً
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'COMPLETED' AND enumtypid = 'payment_status'::regtype) THEN
    ALTER TYPE payment_status ADD VALUE 'COMPLETED';
  END IF;
END $$;