-- تحديث الدوال لتكون آمنة مع search_path
CREATE OR REPLACE FUNCTION public.update_marketplace_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_app_install_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.marketplace_apps
    SET install_count = install_count + 1
    WHERE id = NEW.app_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.marketplace_apps
    SET install_count = GREATEST(0, install_count - 1)
    WHERE id = OLD.app_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_app_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.marketplace_apps
  SET 
    rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM public.app_reviews
      WHERE app_id = COALESCE(NEW.app_id, OLD.app_id)
      AND is_visible = true
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM public.app_reviews
      WHERE app_id = COALESCE(NEW.app_id, OLD.app_id)
      AND is_visible = true
    )
  WHERE id = COALESCE(NEW.app_id, OLD.app_id);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SET search_path = public;