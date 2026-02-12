-- Create secure function to add product to affiliate store
CREATE OR REPLACE FUNCTION public.add_affiliate_product(
  p_store_id uuid,
  p_product_id uuid,
  p_is_visible boolean DEFAULT true,
  p_sort_order integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id uuid;
  v_exists boolean := false;
  v_row_id uuid;
BEGIN
  -- Ensure authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify the store belongs to current user
  SELECT ast.profile_id INTO v_profile_id
  FROM affiliate_stores ast
  JOIN profiles p ON p.id = ast.profile_id
  WHERE ast.id = p_store_id
    AND p.auth_user_id = auth.uid();

  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized store access';
  END IF;

  -- Try to insert, ignore if already exists
  INSERT INTO affiliate_products (affiliate_store_id, product_id, is_visible, sort_order)
  VALUES (p_store_id, p_product_id, p_is_visible, p_sort_order)
  ON CONFLICT (affiliate_store_id, product_id) DO NOTHING
  RETURNING id INTO v_row_id;

  IF v_row_id IS NULL THEN
    -- Already exists
    v_exists := true;
    SELECT id INTO v_row_id
    FROM affiliate_products
    WHERE affiliate_store_id = p_store_id
      AND product_id = p_product_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'already_exists', v_exists,
    'id', v_row_id
  );
END;
$$;