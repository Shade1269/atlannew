-- ============================================
-- Fix referral tracking - ensure stores are counted for referrer
-- إصلاح تتبع الإحالة - التأكد من حساب المتاجر للمحيل
-- ============================================

-- Step 1: Update create_affiliate_store to ensure referred_by is set correctly
-- تحديث create_affiliate_store للتأكد من تعيين referred_by بشكل صحيح
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

  -- Get profile and referred_by
  SELECT id, referred_by INTO v_profile_id, v_referred_by 
  FROM profiles 
  WHERE auth_user_id = v_user_id;
  
  IF v_profile_id IS NULL THEN
    -- Create minimal profile if missing
    INSERT INTO profiles (auth_user_id, email, full_name, role, is_active, points)
    VALUES (v_user_id, NULL, NULL, 'affiliate', true, 0)
    RETURNING id, referred_by INTO v_profile_id, v_referred_by;
  END IF;
  
  -- Log for debugging
  RAISE NOTICE 'Creating store for profile % (referred_by: %)', v_profile_id, v_referred_by;

  -- Build slug
  IF p_store_slug IS NULL OR length(trim(p_store_slug)) = 0 THEN
    v_slug := lower(regexp_replace(p_store_name, '[^a-zA-Z0-9\u0600-\u06FF\s-]', '', 'g'));
    v_slug := regexp_replace(v_slug, '\s+', '-', 'g');
    v_slug := regexp_replace(v_slug, '-+', '-', 'g');
    v_slug := trim(v_slug, '-');
    v_slug := left(v_slug, 50) || '-' || substr(gen_random_uuid()::text, 1, 6);
  ELSE
    v_slug := p_store_slug;
  END IF;

  -- Check if user already has a store
  IF EXISTS (SELECT 1 FROM affiliate_stores WHERE profile_id = v_profile_id) THEN
    RAISE EXCEPTION 'User already has a store. Each profile can only have one affiliate store.';
  END IF;

  -- Ensure slug is unique
  WHILE EXISTS (SELECT 1 FROM affiliate_stores WHERE store_slug = v_slug) LOOP
    v_slug := left(regexp_replace(p_store_name, '[^a-zA-Z0-9\u0600-\u06FF\s-]', '', 'g'), 45) || '-' || substr(gen_random_uuid()::text, 1, 8);
  END LOOP;

  -- Insert store with referred_by explicitly set
  INSERT INTO affiliate_stores (profile_id, store_name, store_slug, bio, is_active, referred_by)
  VALUES (v_profile_id, p_store_name, v_slug, p_bio, true, v_referred_by)
  RETURNING id INTO v_new_id;
  
  -- Verify referred_by was set correctly
  IF v_referred_by IS NOT NULL THEN
    -- Double-check and update if needed
    UPDATE affiliate_stores 
    SET referred_by = v_referred_by 
    WHERE id = v_new_id AND (referred_by IS NULL OR referred_by != v_referred_by);
    
    RAISE NOTICE 'Store % created with referred_by: %', v_new_id, v_referred_by;
  ELSE
    RAISE NOTICE 'Store % created without referred_by', v_new_id;
  END IF;
  
  RETURN v_new_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create affiliate store: %', SQLERRM;
END;
$function$;

-- Step 2: Ensure trigger link_store_to_referrer is working correctly
-- التأكد من أن trigger link_store_to_referrer يعمل بشكل صحيح
CREATE OR REPLACE FUNCTION link_store_to_referrer()
RETURNS TRIGGER AS $$
DECLARE
  v_referred_by UUID;
BEGIN
  -- Get the referred_by from the profile that created the store
  IF NEW.profile_id IS NOT NULL THEN
    SELECT referred_by INTO v_referred_by
    FROM public.profiles 
    WHERE id = NEW.profile_id;

    -- Set referred_by if it exists and is not already set
    IF v_referred_by IS NOT NULL AND (NEW.referred_by IS NULL OR NEW.referred_by != v_referred_by) THEN
      NEW.referred_by := v_referred_by;
      RAISE NOTICE 'Trigger: Set referred_by to % for store %', v_referred_by, NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS trigger_link_store_to_referrer ON public.affiliate_stores;
CREATE TRIGGER trigger_link_store_to_referrer
  BEFORE INSERT ON public.affiliate_stores
  FOR EACH ROW
  EXECUTE FUNCTION link_store_to_referrer();

-- Step 3: Fix existing stores that should be linked but aren't
-- إصلاح المتاجر الموجودة التي يجب ربطها ولكنها غير مربوطة
DO $$
DECLARE
  v_updated_rows INTEGER;
BEGIN
  RAISE NOTICE '=== Fixing Referred Stores ===';
  
  -- Update affiliate_stores that have a profile with referred_by but the store doesn't have referred_by set
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
  RAISE NOTICE 'Fixed % stores', v_updated_rows;
  RAISE NOTICE '=== Fix Complete ===';
END $$;

-- Step 4: Add comment
COMMENT ON FUNCTION public.create_affiliate_store IS 'Creates an affiliate store and automatically links it to the referrer if the profile has a referred_by value. Each profile can only have one store.';
