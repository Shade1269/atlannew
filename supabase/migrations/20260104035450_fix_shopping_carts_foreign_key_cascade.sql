-- إصلاح القيود الخارجية لجدول shopping_carts لضمان حذف/معالجة السلات تلقائياً
-- Fix foreign key constraints for shopping_carts to ensure carts are handled automatically

-- 1. إصلاح قيد user_id (لحذف السلات عند حذف profile)
-- حذف القيد القديم إذا كان موجوداً
ALTER TABLE public.shopping_carts 
DROP CONSTRAINT IF EXISTS shopping_carts_user_id_fkey;

-- إعادة إضافة القيد مع ON DELETE CASCADE
ALTER TABLE public.shopping_carts
ADD CONSTRAINT shopping_carts_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- 2. إصلاح قيد affiliate_store_id (لحذف السلات عند حذف affiliate_store)
-- حذف القيد القديم إذا كان موجوداً
ALTER TABLE public.shopping_carts 
DROP CONSTRAINT IF EXISTS shopping_carts_affiliate_store_id_fkey;

-- إعادة إضافة القيد مع ON DELETE CASCADE
-- ملاحظة: عند حذف متجر، سيتم حذف جميع السلات المرتبطة به
ALTER TABLE public.shopping_carts
ADD CONSTRAINT shopping_carts_affiliate_store_id_fkey
FOREIGN KEY (affiliate_store_id)
REFERENCES public.affiliate_stores(id)
ON DELETE CASCADE;

