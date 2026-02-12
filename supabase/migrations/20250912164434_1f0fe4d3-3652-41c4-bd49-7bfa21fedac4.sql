CREATE OR REPLACE FUNCTION public.create_affiliate_store(
  p_store_name text,
  p_bio text DEFAULT NULL,
  p_store_slug text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_profile_id uuid;
  v_slug text;
  v_new_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Ensure profile exists; create minimal one if missing
  SELECT id INTO v_profile_id FROM profiles WHERE auth_user_id = v_user_id;
  IF v_profile_id IS NULL THEN
    INSERT INTO profiles (auth_user_id, email, full_name, role, is_active, points)
    VALUES (v_user_id, NULL, NULL, 'affiliate', true, 0)
    RETURNING id INTO v_profile_id;
  END IF;

  -- Build slug
  IF p_store_slug IS NULL OR length(trim(p_store_slug)) = 0 THEN
    v_slug := lower(regexp_replace(p_store_name, '[^\p{L}\p{N}\s-]', '', 'g'));
    v_slug := regexp_replace(v_slug, '\\s+', '-', 'g');
    v_slug := regexp_replace(v_slug, '-+', '-', 'g');
    v_slug := left(v_slug, 60) || '-' || substr(gen_random_uuid()::text, 1, 6);
  ELSE
    v_slug := p_store_slug;
  END IF;

  INSERT INTO affiliate_stores (profile_id, store_name, store_slug, bio, is_active)
  VALUES (v_profile_id, p_store_name, v_slug, p_bio, true)
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;