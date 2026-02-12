-- إضافة ثيم Alliance Elite إلى قاعدة البيانات
INSERT INTO store_themes (
  name,
  name_ar,
  description,
  description_ar,
  theme_config,
  is_active,
  is_premium
) VALUES (
  'Alliance Elite',
  'النخبة المتحالفة',
  'A futuristic theme with stunning blue and cyan colors, perfect for tech and gaming stores',
  'ثيم مستقبلي مذهل بألوان زرقاء وسماوية، مثالي لمتاجر التقنية والألعاب',
  '{
    "colors": {
      "primary": "199 100% 50%",
      "secondary": "221 83% 53%",
      "accent": "189 97% 77%",
      "background": "222 45% 6%",
      "foreground": "204 86% 95%",
      "muted": "220 26% 14%",
      "card": "220 26% 14%",
      "border": "217 33% 17%"
    },
    "typography": {
      "fontFamily": "Noto Sans Arabic, Orbitron, monospace",
      "headingFont": "Orbitron, Noto Sans Arabic, sans-serif"
    },
    "layout": {
      "borderRadius": "12px",
      "spacing": "16px",
      "cardStyle": "elevated"
    },
    "effects": {
      "shadows": "strong",
      "animations": "smooth",
      "gradients": true,
      "bloom": true,
      "glowEffect": true
    }
  }'::jsonb,
  true,
  false
);