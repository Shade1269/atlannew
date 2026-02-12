-- حذف جميع البيانات الوهمية من جداول الشحن
DELETE FROM public.shipping_rates;
DELETE FROM public.shipping_zones;
DELETE FROM public.shipping_providers;

-- إضافة عمود السعر الأساسي لشركات الشحن
ALTER TABLE public.shipping_providers 
ADD COLUMN IF NOT EXISTS base_price_sar NUMERIC(10,2) DEFAULT 0 NOT NULL;