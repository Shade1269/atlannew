-- تحكم كامل من إعدادات المتجر: شريطا الإعلانات العلويان، أقسام الهيدر، الخط، العروض الفلاشية
ALTER TABLE public.affiliate_store_settings
  ADD COLUMN IF NOT EXISTS top_announcement_bars jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS header_config jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS font_family text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS flash_deals jsonb DEFAULT '[]';

COMMENT ON COLUMN public.affiliate_store_settings.top_announcement_bars IS 'شريطا الإعلانات العلويان: مصفوفة حتى عنصرين { text, bg_color, text_color, icon, link, visible, phone? }';
COMMENT ON COLUMN public.affiliate_store_settings.header_config IS 'إعدادات الهيدر: إظهار/إخفاء العناصر (top_bar_phone, search, cart, wishlist, login, view_toggle, filter)';
COMMENT ON COLUMN public.affiliate_store_settings.font_family IS 'نوع الخط للمتجر (مثلاً: Cairo, Tajawal, Playfair Display)';
COMMENT ON COLUMN public.affiliate_store_settings.flash_deals IS 'أقسام العروض الفلاشية: مصفوفة { id, title, end_date_iso, product_ids?, category_id?, link? }';
