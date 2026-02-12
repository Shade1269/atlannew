-- ضمان صف واحد فقط لكل متجر: إبقاء الأحدث ثم إضافة UNIQUE(store_id)
-- حتى يعمل upsert من التطبيق (onConflict: 'store_id') على التحديث بدل الإدراج المتكرر
-- متوافق مع schema الجدول الحالي (id, store_id, top_announcement_bars, updated_at, ...)

-- 1) حذف الصفوف المكررة — نحتفظ بآخر صف لكل store_id حسب updated_at
DELETE FROM public.affiliate_store_settings a
USING public.affiliate_store_settings b
WHERE a.store_id = b.store_id
  AND a.updated_at < b.updated_at;

-- 2) إضافة قيد التفرد على store_id إن لم يكن موجوداً
ALTER TABLE public.affiliate_store_settings
  DROP CONSTRAINT IF EXISTS affiliate_store_settings_store_id_key;

ALTER TABLE public.affiliate_store_settings
  ADD CONSTRAINT affiliate_store_settings_store_id_key UNIQUE (store_id);
