-- إضافة حقل رابط الفاتورة من Zoho
ALTER TABLE public.ecommerce_orders
ADD COLUMN IF NOT EXISTS zoho_invoice_url TEXT;

-- تعليق توضيحي
COMMENT ON COLUMN public.ecommerce_orders.zoho_invoice_url IS 'رابط عرض الفاتورة في Zoho';

