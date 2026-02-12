-- تحديث اسم ثيم Ferrari ليتطابق مع الكود
UPDATE public.store_themes
SET 
  name = 'ferrari',
  name_ar = 'فيراري الفاخر',
  description = 'Ferrari Luxury theme with Racing Red and Navy Blue',
  description_ar = 'ثيم فيراري الفاخر بالأحمر الرياضي والأزرق الداكن'
WHERE name = 'Ferrari Racing';