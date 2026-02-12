-- ============================================
-- Fix referred stores linking
-- إصلاح ربط المتاجر المحالة
-- ============================================

-- Update create_affiliate_store function to explicitly set referred_by
CREATE OR REPLACE FUNCTION public.create_affiliate_store(
  p_store_name text,
  p_bio text DEFAULT NULL,
  p_store_slug text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_profile_id uuid;
  v_referred_by uuid;
  v_slug text;
  v_new_id uuid;
BEGIN
  -- Log function call (only if function exists)
  BEGIN
    PERFORM public.log_function_call('create_affiliate_store', 
      jsonb_build_object('store_name', p_store_name, 'bio', p_bio, 'store_slug', p_store_slug));
  EXCEPTION WHEN OTHERS THEN
    -- Ignore if log_function_call doesn't exist
    NULL;
  END;
  
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Ensure profile exists; create minimal one if missing
  SELECT id, referred_by INTO v_profile_id, v_referred_by 
  FROM profiles 
  WHERE auth_user_id = v_user_id;
  
  IF v_profile_id IS NULL THEN
    INSERT INTO profiles (auth_user_id, email, full_name, role, is_active, points)
    VALUES (v_user_id, NULL, NULL, 'affiliate', true, 0)
    RETURNING id INTO v_profile_id;
    -- New profile won't have referred_by, so v_referred_by will be NULL
  END IF;
  
  -- Log for debugging
  IF v_referred_by IS NOT NULL THEN
    RAISE NOTICE 'Creating store for profile % with referred_by %', v_profile_id, v_referred_by;
  ELSE
    RAISE NOTICE 'Creating store for profile % without referred_by', v_profile_id;
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

  -- Insert store with referred_by explicitly set (trigger will also set it, but this ensures it's set)
  BEGIN
    INSERT INTO affiliate_stores (profile_id, store_name, store_slug, bio, is_active, referred_by)
    VALUES (v_profile_id, p_store_name, v_slug, p_bio, true, v_referred_by)
    RETURNING id INTO v_new_id;
    
    -- Double-check that referred_by was set correctly
    IF v_referred_by IS NOT NULL THEN
      -- Verify the store was created with referred_by
      PERFORM 1 FROM affiliate_stores WHERE id = v_new_id AND referred_by = v_referred_by;
      IF NOT FOUND THEN
        -- If not set, update it
        UPDATE affiliate_stores SET referred_by = v_referred_by WHERE id = v_new_id;
        RAISE NOTICE 'Updated referred_by for store % after creation', v_new_id;
      END IF;
    END IF;
    
    RETURN v_new_id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE EXCEPTION 'Failed to create affiliate store: %', SQLERRM;
  END;
END;
$function$;

-- Fix existing stores that should be linked but aren't
-- This will update all affiliate_stores that have a profile with referred_by
-- but the store doesn't have referred_by set or has a different value
DO $$
DECLARE
  v_stores_to_fix INTEGER;
  v_before_count INTEGER;
  v_after_count INTEGER;
  v_fixed_count INTEGER;
  v_total_stores INTEGER;
  v_profiles_with_referred_by INTEGER;
  v_updated_rows INTEGER;
  rec RECORD;
BEGIN
  RAISE NOTICE '=== Fixing Referred Stores ===';
  
  -- Count total stores
  SELECT COUNT(*) INTO v_total_stores FROM affiliate_stores;
  RAISE NOTICE 'Total affiliate stores: %', v_total_stores;
  
  -- Count profiles with referred_by
  SELECT COUNT(*) INTO v_profiles_with_referred_by 
  FROM profiles 
  WHERE referred_by IS NOT NULL;
  RAISE NOTICE 'Profiles with referred_by: %', v_profiles_with_referred_by;
  
  -- Count stores already linked BEFORE update
  SELECT COUNT(*) INTO v_before_count
  FROM affiliate_stores AS ast
  INNER JOIN profiles AS p ON ast.profile_id = p.id
  WHERE p.referred_by IS NOT NULL
    AND ast.referred_by = p.referred_by;
  
  -- Count stores that need fixing
  SELECT COUNT(*) INTO v_stores_to_fix
  FROM affiliate_stores AS ast
  INNER JOIN profiles AS p ON ast.profile_id = p.id
  WHERE p.referred_by IS NOT NULL
    AND (ast.referred_by IS NULL OR ast.referred_by != p.referred_by);
  
  RAISE NOTICE 'Stores already linked: %', v_before_count;
  RAISE NOTICE 'Stores that need fixing: %', v_stores_to_fix;
  
  -- Show sample data that needs fixing
  IF v_stores_to_fix > 0 THEN
    RAISE NOTICE 'Sample stores to fix:';
    FOR rec IN 
      SELECT ast.id, ast.store_name, ast.profile_id, p.referred_by, ast.referred_by AS current_referred_by
      FROM affiliate_stores AS ast
      INNER JOIN profiles AS p ON ast.profile_id = p.id
      WHERE p.referred_by IS NOT NULL
        AND (ast.referred_by IS NULL OR ast.referred_by != p.referred_by)
      LIMIT 5
    LOOP
      RAISE NOTICE '  Store: % (profile_id: %, profile.referred_by: %, store.referred_by: %)', 
        rec.store_name, rec.profile_id, rec.referred_by, rec.current_referred_by;
    END LOOP;
  END IF;
  
  -- Update affiliate_stores that have a profile with referred_by but the store doesn't have referred_by set
  -- Use explicit UPDATE with proper WHERE clause
  UPDATE affiliate_stores
  SET referred_by = (
    SELECT p.referred_by
    FROM profiles p
    WHERE p.id = affiliate_stores.profile_id
      AND p.referred_by IS NOT NULL
  )
  WHERE EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = affiliate_stores.profile_id
      AND p.referred_by IS NOT NULL
      AND (affiliate_stores.referred_by IS NULL OR affiliate_stores.referred_by != p.referred_by)
  );
  
  GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
  RAISE NOTICE 'Rows updated: %', v_updated_rows;
  
  -- Count how many stores are now linked AFTER update
  SELECT COUNT(*) INTO v_after_count
  FROM affiliate_stores AS ast
  INNER JOIN profiles AS p ON ast.profile_id = p.id
  WHERE p.referred_by IS NOT NULL
    AND ast.referred_by = p.referred_by;
  
  v_fixed_count := v_after_count - v_before_count;
  
  RAISE NOTICE 'Total stores now linked to referrers: %', v_after_count;
  RAISE NOTICE 'Fixed % stores', v_fixed_count;
  RAISE NOTICE '=== Fix Complete ===';
END $$;

-- Create a SECURITY DEFINER function to fix referred stores (bypasses RLS)
CREATE OR REPLACE FUNCTION public.fix_referred_stores()
RETURNS TABLE(
  total_stores INTEGER,
  profiles_with_referred_by INTEGER,
  stores_to_fix INTEGER,
  stores_fixed INTEGER,
  total_linked INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_stores INTEGER;
  v_profiles_with_referred_by INTEGER;
  v_stores_to_fix INTEGER;
  v_before_count INTEGER;
  v_after_count INTEGER;
  v_updated_rows INTEGER;
BEGIN
  -- Count total stores
  SELECT COUNT(*) INTO v_total_stores FROM affiliate_stores;
  
  -- Count profiles with referred_by
  SELECT COUNT(*) INTO v_profiles_with_referred_by 
  FROM profiles 
  WHERE referred_by IS NOT NULL;
  
  -- Count stores already linked BEFORE update
  SELECT COUNT(*) INTO v_before_count
  FROM affiliate_stores AS ast
  INNER JOIN profiles AS p ON ast.profile_id = p.id
  WHERE p.referred_by IS NOT NULL
    AND ast.referred_by = p.referred_by;
  
  -- Count stores that need fixing
  SELECT COUNT(*) INTO v_stores_to_fix
  FROM affiliate_stores AS ast
  INNER JOIN profiles AS p ON ast.profile_id = p.id
  WHERE p.referred_by IS NOT NULL
    AND (ast.referred_by IS NULL OR ast.referred_by != p.referred_by);
  
  -- Update affiliate_stores
  UPDATE affiliate_stores
  SET referred_by = (
    SELECT p.referred_by
    FROM profiles p
    WHERE p.id = affiliate_stores.profile_id
      AND p.referred_by IS NOT NULL
  )
  WHERE EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = affiliate_stores.profile_id
      AND p.referred_by IS NOT NULL
      AND (affiliate_stores.referred_by IS NULL OR affiliate_stores.referred_by != p.referred_by)
  );
  
  GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
  
  -- Count how many stores are now linked AFTER update
  SELECT COUNT(*) INTO v_after_count
  FROM affiliate_stores AS ast
  INNER JOIN profiles AS p ON ast.profile_id = p.id
  WHERE p.referred_by IS NOT NULL
    AND ast.referred_by = p.referred_by;
  
  -- Return results
  RETURN QUERY SELECT 
    v_total_stores,
    v_profiles_with_referred_by,
    v_stores_to_fix,
    v_updated_rows,
    v_after_count;
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.create_affiliate_store IS 'Creates an affiliate store and automatically links it to the referrer if the profile has a referred_by value';
COMMENT ON FUNCTION public.fix_referred_stores IS 'Fixes referred_by in affiliate_stores based on profiles.referred_by. Returns statistics about the fix operation.';

