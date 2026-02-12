ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.user_profiles(id),
ADD COLUMN IF NOT EXISTS approval_notes TEXT,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.products 
DROP CONSTRAINT IF EXISTS products_approval_status_check;

ALTER TABLE public.products 
ADD CONSTRAINT products_approval_status_check 
CHECK (approval_status IN ('pending', 'approved', 'rejected'));

ALTER TABLE public.affiliate_products
ADD COLUMN IF NOT EXISTS custom_price_sar DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS price_set_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_products_approval_status ON public.products(approval_status);

DROP POLICY IF EXISTS "Merchants can view own products" ON public.products;
CREATE POLICY "Merchants can view own products" ON public.products
  FOR SELECT USING (
    merchant_id IN (
      SELECT id FROM public.merchants WHERE user_profile_id = public.get_current_user_profile_id()
    )
  );

DROP POLICY IF EXISTS "Merchants can insert products" ON public.products;
CREATE POLICY "Merchants can insert products" ON public.products
  FOR INSERT WITH CHECK (
    merchant_id IN (
      SELECT id FROM public.merchants WHERE user_profile_id = public.get_current_user_profile_id()
    )
  );

DROP POLICY IF EXISTS "Merchants can update own pending products" ON public.products;
CREATE POLICY "Merchants can update own pending products" ON public.products
  FOR UPDATE USING (
    merchant_id IN (
      SELECT id FROM public.merchants WHERE user_profile_id = public.get_current_user_profile_id()
    ) AND approval_status = 'pending'
  );

DROP POLICY IF EXISTS "Affiliates can view approved products" ON public.products;
CREATE POLICY "Affiliates can view approved products" ON public.products
  FOR SELECT USING (
    approval_status = 'approved' AND is_active = true
  );

DROP POLICY IF EXISTS "Admins can manage all products" ON public.products;
CREATE POLICY "Admins can manage all products" ON public.products
  FOR ALL USING (
    public.get_current_user_role() = 'admin'
  );

CREATE OR REPLACE FUNCTION public.add_affiliate_product(
  p_store_id UUID,
  p_product_id UUID,
  p_is_visible BOOLEAN DEFAULT true,
  p_sort_order INTEGER DEFAULT 0,
  p_custom_price DECIMAL(10,2) DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.affiliate_products
    WHERE affiliate_store_id = p_store_id AND product_id = p_product_id
  ) THEN
    RETURN jsonb_build_object('already_exists', true, 'success', false);
  END IF;

  INSERT INTO public.affiliate_products (
    affiliate_store_id,
    product_id,
    is_visible,
    sort_order,
    custom_price_sar,
    price_set_at
  ) VALUES (
    p_store_id,
    p_product_id,
    p_is_visible,
    p_sort_order,
    p_custom_price,
    CASE WHEN p_custom_price IS NOT NULL THEN NOW() ELSE NULL END
  );

  RETURN jsonb_build_object('already_exists', false, 'success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON COLUMN public.products.approval_status IS 'Product approval status: pending, approved, rejected';
COMMENT ON COLUMN public.affiliate_products.custom_price_sar IS 'Custom selling price set by affiliate (overrides product base price)';
