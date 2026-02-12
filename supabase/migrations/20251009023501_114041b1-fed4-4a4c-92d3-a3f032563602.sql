-- Enable RLS on shipping_rates if not already enabled
ALTER TABLE shipping_rates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public can view active shipping rates" ON shipping_rates;
DROP POLICY IF EXISTS "Admins can manage shipping rates" ON shipping_rates;

-- Allow public to view active shipping rates
CREATE POLICY "Public can view active shipping rates"
ON shipping_rates
FOR SELECT
USING (true);

-- Allow admins to manage all shipping rates
CREATE POLICY "Admins can manage shipping rates"
ON shipping_rates
FOR ALL
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');