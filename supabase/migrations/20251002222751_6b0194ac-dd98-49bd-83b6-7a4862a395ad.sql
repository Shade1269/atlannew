-- تحديث المتاجر لاستخدام الثيم العصري البسيط (Modern Minimalist) كثيم افتراضي
UPDATE affiliate_stores 
SET current_theme_id = (SELECT id FROM store_themes WHERE name = 'Modern Minimalist' LIMIT 1)
WHERE current_theme_id NOT IN (
  SELECT id FROM store_themes 
  WHERE name IN ('Alliance Elite', 'Modern Minimalist')
);

-- الآن نحذف الثيمات الأخرى بأمان
DELETE FROM store_themes 
WHERE name NOT IN ('Alliance Elite', 'Modern Minimalist');