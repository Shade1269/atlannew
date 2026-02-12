-- إضافة ثيم Sands & Sea
INSERT INTO public.store_themes (
  name,
  name_ar,
  description,
  description_ar,
  theme_config,
  preview_image_url,
  is_active,
  is_premium
) VALUES (
  'Sands & Sea',
  'رمال وبحر',
  'Warm desert tones with refreshing sea accents for lifestyle and handmade brands',
  'دفء الرمال مع لمسات بحرية منعشة للمتاجر اليدوية ونمط الحياة',
  '{
    "colors": {
      "primary": "#0F766E",
      "secondary": "#F9E7C9",
      "accent": "#F26D4A",
      "background": "#FFF9F0",
      "foreground": "#1E3A4C",
      "muted": "#EADCC4",
      "card": "#FFFFFF",
      "border": "#0F766E1A"
    },
    "typography": {
      "fontFamily": "'Cairo', 'Rubik', sans-serif",
      "headingFont": "'Cairo Play', 'Cairo', sans-serif"
    },
    "layout": {
      "borderRadius": "16px",
      "spacing": "spacious",
      "cardStyle": "elevated"
    },
    "effects": {
      "shadows": "soft",
      "animations": "gentle-wave",
      "gradients": true
    }
  }',
  '/themes/sands-and-sea.svg',
  true,
  false
)
ON CONFLICT (name) DO NOTHING;
