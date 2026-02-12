-- إصلاح سياسات RLS لمحفظة التاجر لتستخدم merchants.id بدلاً من profiles.id

-- حذف السياسات القديمة
DROP POLICY IF EXISTS "Merchants view own wallet" ON merchant_wallet_balances;
DROP POLICY IF EXISTS "Merchants create own wallet" ON merchant_wallet_balances;
DROP POLICY IF EXISTS "Merchants update own wallet" ON merchant_wallet_balances;

-- إنشاء سياسات جديدة صحيحة
CREATE POLICY "Merchants view own wallet" ON merchant_wallet_balances
FOR SELECT USING (
  merchant_id IN (
    SELECT m.id FROM merchants m
    JOIN profiles p ON p.id = m.profile_id
    WHERE p.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Merchants create own wallet" ON merchant_wallet_balances
FOR INSERT WITH CHECK (
  merchant_id IN (
    SELECT m.id FROM merchants m
    JOIN profiles p ON p.id = m.profile_id
    WHERE p.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Merchants update own wallet" ON merchant_wallet_balances
FOR UPDATE USING (
  merchant_id IN (
    SELECT m.id FROM merchants m
    JOIN profiles p ON p.id = m.profile_id
    WHERE p.auth_user_id = auth.uid()
  )
);

-- إصلاح سياسات merchant_transactions
DROP POLICY IF EXISTS "Merchants view own transactions" ON merchant_transactions;

CREATE POLICY "Merchants view own transactions" ON merchant_transactions
FOR SELECT USING (
  merchant_id IN (
    SELECT m.id FROM merchants m
    JOIN profiles p ON p.id = m.profile_id
    WHERE p.auth_user_id = auth.uid()
  )
);