-- Critical Security Fix: Remove public access to sensitive data
-- This addresses the most severe security vulnerabilities

-- 1. Remove public access from profiles table
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- 2. Create secure profile access policy  
CREATE POLICY "Secure profile access" 
ON public.profiles 
FOR SELECT 
USING (
  auth_user_id = auth.uid() OR 
  get_current_user_role() = 'admin'
);

-- 3. Remove public cart access
DROP POLICY IF EXISTS "Public cart items access" ON public.cart_items;

-- 4. Secure cart items access
CREATE POLICY "Secure cart items access" 
ON public.cart_items 
FOR ALL 
USING (
  cart_id IN (
    SELECT id FROM shopping_carts 
    WHERE user_id = auth.uid() OR session_id IS NOT NULL
  )
);