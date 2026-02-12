-- Add commission amount column to product_library table
ALTER TABLE public.product_library 
ADD COLUMN commission_amount NUMERIC DEFAULT 0 NOT NULL;