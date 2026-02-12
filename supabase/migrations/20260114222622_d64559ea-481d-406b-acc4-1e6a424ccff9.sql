-- إضافة ثيم المتجر الفاخر (Maison Élégance)
INSERT INTO public.store_themes (
  name, 
  name_ar, 
  description, 
  description_ar, 
  is_active, 
  is_premium, 
  preview_image_url,
  theme_config
) VALUES (
  'Maison Elegance',
  'بيت الأناقة الفاخر',
  'Ultra-luxury boutique theme with 3D product showcase, golden particles, elegant animations and premium e-commerce experience',
  'ثيم بوتيك فائق الفخامة مع عرض منتجات ثلاثي الأبعاد وجزيئات ذهبية وأنيميشن راقي وتجربة تسوق استثنائية',
  true,
  true,
  '/themes/maison-elegance.svg',
  '{
    "colors": {
      "background": "20 12% 7%",
      "foreground": "38 25% 90%",
      "card": "20 15% 11%",
      "card-foreground": "38 25% 90%",
      "popover": "20 15% 11%",
      "popover-foreground": "38 25% 90%",
      "primary": "38 90% 50%",
      "primary-foreground": "20 12% 5%",
      "secondary": "20 15% 15%",
      "secondary-foreground": "38 25% 90%",
      "muted": "20 10% 20%",
      "muted-foreground": "38 15% 60%",
      "accent": "38 80% 45%",
      "accent-foreground": "20 12% 5%",
      "destructive": "0 84% 60%",
      "destructive-foreground": "0 0% 100%",
      "border": "38 30% 50%",
      "input": "20 15% 15%",
      "ring": "38 90% 50%"
    },
    "typography": {
      "fontFamily": "Cairo, Playfair Display, serif",
      "headingFont": "Playfair Display, Cairo, serif"
    },
    "layout": {
      "borderRadius": "0.75rem",
      "cardStyle": "luxury-glass",
      "spacing": "spacious"
    },
    "effects": {
      "animations": "elegant",
      "gradients": true,
      "shadows": "luxury",
      "goldenParticles": true,
      "glassEffect": true,
      "3dShowroom": true,
      "parallax": true,
      "backdropBlur": "lg"
    },
    "components": {
      "layout": "LuxuryStoreLayout",
      "hero": "EnhancedHero",
      "productGrid": "LuxuryProductGrid",
      "productDetails": "LuxuryProductDetails",
      "cart": "LuxuryCart",
      "checkout": "LuxuryCheckout",
      "header": "EcommerceHeader",
      "footer": "EcommerceFooter",
      "categories": "LuxuryCategories",
      "search": "LuxurySearch",
      "wishlist": "LuxuryWishlist",
      "profile": "LuxuryProfile",
      "orderHistory": "LuxuryOrderHistory",
      "orderConfirmation": "LuxuryOrderConfirmation",
      "aboutUs": "LuxuryAboutUs",
      "contactUs": "LuxuryContactUs",
      "faq": "LuxuryFAQ",
      "showroom3d": "Enhanced3DShowroom",
      "particles": "GoldenParticles",
      "announcement": "AnnouncementBar",
      "megaMenu": "MegaMenu",
      "scrollProgress": "ScrollProgress",
      "heroSlider": "HeroSlider",
      "countdown": "CountdownTimer",
      "aiRecommendations": "AIRecommendations"
    },
    "features": {
      "3dProductView": true,
      "goldenParticles": true,
      "aiRecommendations": true,
      "megaMenu": true,
      "heroSlider": true,
      "countdown": true,
      "quickView": true,
      "sizeGuide": true,
      "productReviews": true,
      "relatedProducts": true,
      "scrollProgress": true,
      "announcementBar": true
    }
  }'::jsonb
);