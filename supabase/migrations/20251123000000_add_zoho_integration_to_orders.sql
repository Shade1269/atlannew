-- إضافة حقول Zoho Books لجدول الطلبات
-- Migration: Add Zoho Books integration fields to ecommerce_orders table

-- إضافة حقول التكامل مع Zoho
ALTER TABLE public.ecommerce_orders
ADD COLUMN IF NOT EXISTS zoho_invoice_id TEXT,
ADD COLUMN IF NOT EXISTS zoho_invoice_number TEXT,
ADD COLUMN IF NOT EXISTS zoho_sync_status TEXT DEFAULT 'PENDING' CHECK (zoho_sync_status IN ('PENDING', 'IN_PROGRESS', 'SYNCED', 'FAILED')),
ADD COLUMN IF NOT EXISTS zoho_synced_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS zoho_error_message TEXT,
ADD COLUMN IF NOT EXISTS zoho_last_sync_attempt TIMESTAMP WITH TIME ZONE;

-- إنشاء index للبحث السريع
CREATE INDEX IF NOT EXISTS idx_ecommerce_orders_zoho_status
ON public.ecommerce_orders(zoho_sync_status)
WHERE zoho_sync_status != 'SYNCED';

CREATE INDEX IF NOT EXISTS idx_ecommerce_orders_zoho_invoice
ON public.ecommerce_orders(zoho_invoice_id)
WHERE zoho_invoice_id IS NOT NULL;

-- إضافة تعليق توضيحي
COMMENT ON COLUMN public.ecommerce_orders.zoho_invoice_id IS 'معرف الفاتورة في Zoho Books';
COMMENT ON COLUMN public.ecommerce_orders.zoho_invoice_number IS 'رقم الفاتورة من Zoho Books';
COMMENT ON COLUMN public.ecommerce_orders.zoho_sync_status IS 'حالة المزامنة مع Zoho: PENDING (قيد الانتظار), IN_PROGRESS (جاري المزامنة), SYNCED (تمت المزامنة), FAILED (فشلت)';
COMMENT ON COLUMN public.ecommerce_orders.zoho_synced_at IS 'تاريخ ووقت المزامنة الناجحة مع Zoho';
COMMENT ON COLUMN public.ecommerce_orders.zoho_error_message IS 'رسالة الخطأ في حالة فشل المزامنة';
COMMENT ON COLUMN public.ecommerce_orders.zoho_last_sync_attempt IS 'تاريخ ووقت آخر محاولة مزامنة';
