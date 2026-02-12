-- Enable RLS on affiliate_products table
ALTER TABLE public.affiliate_products ENABLE ROW LEVEL SECURITY;

-- Create policies for affiliate_products
CREATE POLICY "Users can view visible affiliate products" ON public.affiliate_products
FOR SELECT USING (is_visible = true);

CREATE POLICY "Affiliates can manage their store products" ON public.affiliate_products
FOR ALL USING (
  affiliate_store_id IN (
    SELECT id FROM affiliate_stores 
    WHERE profile_id IN (
      SELECT id FROM profiles WHERE auth_user_id = auth.uid()
    )
  )
);

-- Enable RLS on affiliate_stores table
ALTER TABLE public.affiliate_stores ENABLE ROW LEVEL SECURITY;

-- Create policies for affiliate_stores
CREATE POLICY "Public can view active affiliate stores" ON public.affiliate_stores
FOR SELECT USING (is_active = true);

CREATE POLICY "Affiliates can manage their own stores" ON public.affiliate_stores
FOR ALL USING (
  profile_id IN (
    SELECT id FROM profiles WHERE auth_user_id = auth.uid()
  )
);