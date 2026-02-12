-- إضافة ثيم Ferrari Racing
INSERT INTO public.store_themes (
  name,
  name_ar,
  description,
  description_ar,
  theme_config,
  preview_image_url,
  is_active,
  is_premium
) 
SELECT 
  'Ferrari Racing',
  'فيراري السباق',
  'Luxury racing theme with Ferrari Red and Navy Blue for premium automotive and sports products',
  'ثيم فاخر بألوان فيراري الأحمر والأزرق الداكن للمنتجات الرياضية والسيارات الراقية',
  '{
    "colors": {
      "primary": "hsl(349, 69%, 45%)",
      "secondary": "hsl(220, 40%, 15%)",
      "accent": "hsl(349, 69%, 45%)",
      "background": "hsl(220, 50%, 6%)",
      "foreground": "hsl(210, 20%, 96%)",
      "muted": "hsl(220, 15%, 35%)",
      "card": "hsl(220, 45%, 11%)",
      "border": "hsl(220, 30%, 18%)",
      "primary-foreground": "hsl(0, 0%, 100%)",
      "secondary-foreground": "hsl(210, 20%, 96%)",
      "accent-foreground": "hsl(0, 0%, 100%)",
      "muted-foreground": "hsl(210, 15%, 75%)",
      "card-foreground": "hsl(210, 20%, 96%)",
      "popover": "hsl(220, 45%, 11%)",
      "popover-foreground": "hsl(210, 20%, 96%)",
      "destructive": "hsl(0, 84%, 60%)",
      "destructive-foreground": "hsl(0, 0%, 100%)"
    },
    "typography": {
      "fontFamily": "\"Noto Sans Arabic\", \"Inter\", -apple-system, sans-serif",
      "headingFont": "\"Noto Sans Arabic\", \"Montserrat\", Inter, sans-serif"
    },
    "layout": {
      "borderRadius": "16px",
      "spacing": "luxurious",
      "cardStyle": "racing"
    },
    "effects": {
      "shadows": "luxury",
      "animations": "elegant",
      "gradients": true,
      "ferrariGlow": true,
      "backdropBlur": "sm"
    }
  }'::jsonb,
  '/themes/ferrari-racing.svg',
  true,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.store_themes WHERE name = 'Ferrari Racing'
);