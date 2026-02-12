-- Fix the create_affiliate_store function to use valid PostgreSQL regex syntax
CREATE OR REPLACE FUNCTION create_affiliate_store(
  p_store_name text,
  p_bio text DEFAULT NULL,
  p_store_slug text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
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

  -- Build slug with correct PostgreSQL regex syntax
  IF p_store_slug IS NULL OR length(trim(p_store_slug)) = 0 THEN
    -- Remove special characters, keep only letters, numbers, spaces and hyphens
    v_slug := lower(regexp_replace(p_store_name, '[^a-zA-Z0-9\u0600-\u06FF\s-]', '', 'g'));
    -- Replace multiple spaces with single hyphen
    v_slug := regexp_replace(v_slug, '\s+', '-', 'g');
    -- Replace multiple hyphens with single hyphen
    v_slug := regexp_replace(v_slug, '-+', '-', 'g');
    -- Remove leading/trailing hyphens
    v_slug := trim(v_slug, '-');
    -- Add random suffix and ensure length limit
    v_slug := left(v_slug, 50) || '-' || substr(gen_random_uuid()::text, 1, 6);
  ELSE
    v_slug := p_store_slug;
  END IF;

  -- Ensure slug is unique
  WHILE EXISTS (SELECT 1 FROM affiliate_stores WHERE store_slug = v_slug) LOOP
    v_slug := left(regexp_replace(p_store_name, '[^a-zA-Z0-9\u0600-\u06FF\s-]', '', 'g'), 45) || '-' || substr(gen_random_uuid()::text, 1, 8);
  END LOOP;

  INSERT INTO affiliate_stores (profile_id, store_name, store_slug, bio, is_active)
  VALUES (v_profile_id, p_store_name, v_slug, p_bio, true)
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;