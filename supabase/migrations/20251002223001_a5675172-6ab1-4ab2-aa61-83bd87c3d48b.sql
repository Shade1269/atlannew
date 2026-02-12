-- حذف النسخة المكررة من Alliance Elite (الأقدم)
DELETE FROM store_themes 
WHERE name = 'Alliance Elite' 
AND created_at = '2025-10-02 22:20:00.521701+00';