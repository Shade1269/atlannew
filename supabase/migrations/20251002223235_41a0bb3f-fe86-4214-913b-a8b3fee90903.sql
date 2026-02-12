-- تحديث جميع المتاجر التي ليس لها ثيم لاستخدام الثيم العصري البسيط كافتراضي
UPDATE affiliate_stores 
SET current_theme_id = (SELECT id FROM store_themes WHERE name = 'Modern Minimalist' LIMIT 1)
WHERE current_theme_id IS NULL;