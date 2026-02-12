-- إنشاء bucket لصور المنتجات إذا لم يكن موجوداً
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true) 
ON CONFLICT (id) DO NOTHING;