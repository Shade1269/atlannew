-- Enable Row Level Security on payments table
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view payments for orders from their own shops
CREATE POLICY "users_view_own_shop_payments" ON public.payments
  FOR SELECT 
  USING (
    order_id IN (
      SELECT o.id 
      FROM orders o
      JOIN shops s ON s.id = o.shop_id
      JOIN profiles p ON p.id = s.owner_id
      WHERE p.auth_user_id = auth.uid()
    )
  );

-- Policy: Admins can view all payments
CREATE POLICY "admins_view_all_payments" ON public.payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE auth_user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Policy: System can insert payments (for webhook/payment processing)
CREATE POLICY "system_insert_payments" ON public.payments
  FOR INSERT
  WITH CHECK (true);

-- Policy: Users can update payment status for their own shop orders (if needed)
CREATE POLICY "users_update_own_shop_payments" ON public.payments
  FOR UPDATE
  USING (
    order_id IN (
      SELECT o.id 
      FROM orders o
      JOIN shops s ON s.id = o.shop_id
      JOIN profiles p ON p.id = s.owner_id
      WHERE p.auth_user_id = auth.uid()
    )
  );