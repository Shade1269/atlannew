-- Fix wallet RLS policies to allow users to create and view their own wallets

-- Drop existing policies
DROP POLICY IF EXISTS "Users view their wallet balance" ON wallet_balances;
DROP POLICY IF EXISTS "Merchants view own wallet" ON merchant_wallet_balances;
DROP POLICY IF EXISTS "Admins view all wallets" ON merchant_wallet_balances;

-- Create comprehensive policies for wallet_balances (affiliates)
-- Allow users to view their own wallet based on their profile ID
CREATE POLICY "Affiliates view own wallet"
ON wallet_balances
FOR SELECT
TO public
USING (
  affiliate_profile_id IN (
    SELECT id FROM profiles WHERE auth_user_id = auth.uid()
  )
);

-- Allow users to create their own wallet
CREATE POLICY "Affiliates create own wallet"
ON wallet_balances
FOR INSERT
TO public
WITH CHECK (
  affiliate_profile_id IN (
    SELECT id FROM profiles WHERE auth_user_id = auth.uid()
  )
);

-- Allow users to update their own wallet (for withdrawal operations)
CREATE POLICY "Affiliates update own wallet"
ON wallet_balances
FOR UPDATE
TO public
USING (
  affiliate_profile_id IN (
    SELECT id FROM profiles WHERE auth_user_id = auth.uid()
  )
);

-- Create comprehensive policies for merchant_wallet_balances
-- Allow merchants to view their own wallet
CREATE POLICY "Merchants view own wallet"
ON merchant_wallet_balances
FOR SELECT
TO public
USING (
  merchant_id IN (
    SELECT id FROM profiles WHERE auth_user_id = auth.uid()
  )
);

-- Allow merchants to create their own wallet
CREATE POLICY "Merchants create own wallet"
ON merchant_wallet_balances
FOR INSERT
TO public
WITH CHECK (
  merchant_id IN (
    SELECT id FROM profiles WHERE auth_user_id = auth.uid()
  )
);

-- Allow merchants to update their own wallet
CREATE POLICY "Merchants update own wallet"
ON merchant_wallet_balances
FOR UPDATE
TO public
USING (
  merchant_id IN (
    SELECT id FROM profiles WHERE auth_user_id = auth.uid()
  )
);

-- Admin policies for both tables
CREATE POLICY "Admins manage all affiliate wallets"
ON wallet_balances
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE auth_user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admins manage all merchant wallets"
ON merchant_wallet_balances
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE auth_user_id = auth.uid() 
    AND role = 'admin'
  )
);