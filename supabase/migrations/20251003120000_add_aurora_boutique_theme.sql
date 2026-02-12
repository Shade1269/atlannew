-- إضافة ثيم Aurora Boutique
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
  'Aurora Boutique',
  'أورورا بوتيك',
  'Dreamy boutique theme with aurora-inspired gradients for fashion and beauty brands',
  'ثيم بوتيك حالم بألوان الشفق يناسب علامات الأزياء والجمال العصرية',
  '{
    "colors": {
      "primary": "hsl(276, 72%, 45%)",
      "secondary": "hsl(318, 64%, 95%)",
      "accent": "hsl(196, 91%, 55%)",
      "background": "hsl(276, 58%, 97%)",
      "foreground": "hsl(276, 30%, 20%)",
      "muted": "hsl(300, 20%, 90%)",
      "card": "hsl(0, 0%, 100%)",
      "border": "hsl(280, 35%, 85%)"
    },
    "typography": {
      "fontFamily": "'Poppins', 'Cairo', sans-serif",
      "headingFont": "'Cormorant Garamond', 'Cairo', serif"
    },
    "layout": {
      "borderRadius": "16px",
      "spacing": "airy",
      "cardStyle": "layered"
    },
    "effects": {
      "shadows": "soft-glow",
      "animations": "floaty",
      "gradients": true,
      "glassmorphism": true
    }
  }',
  '/themes/aurora-boutique.svg',
  true,
  false
)
ON CONFLICT (name) DO NOTHING;
