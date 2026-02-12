-- Fix the approved_by foreign key constraint
-- First, drop the existing constraint
ALTER TABLE public.products 
DROP CONSTRAINT IF EXISTS products_approved_by_fkey;

-- Add the correct constraint pointing to profiles table
ALTER TABLE public.products 
ADD CONSTRAINT products_approved_by_fkey 
FOREIGN KEY (approved_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.products.approved_by IS 'ID of the admin who approved the product';