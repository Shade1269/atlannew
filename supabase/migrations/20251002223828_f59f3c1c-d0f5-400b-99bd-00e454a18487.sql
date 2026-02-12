-- إضافة ثيم الدمشقي الفاخر
INSERT INTO store_themes (
  name,
  name_ar,
  description,
  description_ar,
  theme_config,
  is_active,
  is_premium
) VALUES (
  'Damascene Heritage',
  'التراث الدمشقي',
  'Luxurious dark theme with golden ornaments inspired by Damascus heritage',
  'ثيم داكن فاخر بزخارف ذهبية مستوحى من التراث الدمشقي',
  '{
    "colors": {
      "primary": "43 45% 48%",
      "secondary": "36 29% 60%",
      "accent": "43 45% 48%",
      "background": "0 0% 5%",
      "foreground": "40 30% 90%",
      "muted": "0 0% 7%",
      "card": "0 0% 7%",
      "border": "30 30% 13%"
    },
    "typography": {
      "fontFamily": "Cairo, Noto Sans Arabic, sans-serif",
      "headingFont": "Cairo, Noto Sans Arabic, serif"
    },
    "layout": {
      "borderRadius": "16px",
      "spacing": "16px",
      "cardStyle": "ornate"
    },
    "effects": {
      "shadows": "luxury",
      "animations": "elegant",
      "gradients": true,
      "ornaments": true,
      "patternOpacity": 0.03
    }
  }'::jsonb,
  true,
  true
);