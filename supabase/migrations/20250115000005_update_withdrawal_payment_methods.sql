-- ============================================================================
-- تحديث جدول withdrawal_requests لدعم وسائل الدفع الجديدة
-- ============================================================================

-- التحقق من وجود الجدول أولاً
DO $$
BEGIN
  -- إسقاط constraint القديم إن وجد
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'withdrawal_requests_payment_method_check'
    AND conrelid = 'public.withdrawal_requests'::regclass
  ) THEN
    ALTER TABLE public.withdrawal_requests
    DROP CONSTRAINT withdrawal_requests_payment_method_check;
  END IF;
END $$;

-- إضافة constraint جديد يدعم وسائل الدفع الجديدة
ALTER TABLE public.withdrawal_requests
ADD CONSTRAINT withdrawal_requests_payment_method_check 
CHECK (payment_method IN ('BANK_TRANSFER', 'WALLET', 'PAYPAL', 'CRYPTO', 'CASH'));

-- إضافة تعليق توضيحي
COMMENT ON COLUMN public.withdrawal_requests.payment_method IS 
'طريقة الدفع: BANK_TRANSFER (تحويل بنكي), WALLET (محفظة إلكترونية), PAYPAL, CRYPTO (محفظة رقمية), CASH (نقداً)';

COMMENT ON COLUMN public.withdrawal_requests.bank_details IS 
'تفاصيل الدفع (JSONB): يحتوي على country, bank_id, bank_name, account_holder, iban, account_number للمحافظ البنكية، أو wallet_provider_id, wallet_name, wallet_phone, wallet_email للمحافظ الإلكترونية، أو paypal_email لـ PayPal، أو crypto_wallet_address للمحافظ الرقمية';
