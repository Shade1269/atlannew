
-- تحديث لون الخلفية لثيم التراث الدمشقي إلى رمادي داكن بدلاً من الأسود القاتم
UPDATE store_themes 
SET 
  theme_config = jsonb_set(
    jsonb_set(
      jsonb_set(
        theme_config,
        '{colors,background}',
        '"0 0% 18%"'
      ),
      '{colors,card}',
      '"0 0% 20%"'
    ),
    '{colors,secondary}',
    '"0 0% 25%"'
  ),
  updated_at = now()
WHERE name = 'Damascene Heritage';
