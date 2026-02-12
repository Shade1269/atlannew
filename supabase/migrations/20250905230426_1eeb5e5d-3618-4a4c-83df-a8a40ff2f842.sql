-- Create product_variants table for sizes, colors, and stock management
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  variant_type TEXT NOT NULL, -- 'size', 'color', etc.
  variant_value TEXT NOT NULL, -- 'M', 'L', 'Red', 'Blue', etc.
  stock INTEGER NOT NULL DEFAULT 0,
  price_modifier DECIMAL(10,2) DEFAULT 0, -- Additional price for this variant
  sku TEXT, -- Stock Keeping Unit for this variant
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraint
ALTER TABLE public.product_variants 
ADD CONSTRAINT fk_product_variants_product_id 
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

-- Create unique constraint to prevent duplicate variant combinations
ALTER TABLE public.product_variants 
ADD CONSTRAINT unique_product_variant 
UNIQUE (product_id, variant_type, variant_value);

-- Enable RLS
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Create policies for product variants
CREATE POLICY "Public can view active product variants" 
ON public.product_variants 
FOR SELECT 
USING (
  product_id IN (
    SELECT id FROM public.products WHERE is_active = true
  )
);

CREATE POLICY "Merchant can manage product variants" 
ON public.product_variants 
FOR ALL 
USING (
  product_id IN (
    SELECT p.id 
    FROM products p
    JOIN merchants m ON m.id = p.merchant_id
    JOIN profiles pr ON pr.id = m.profile_id
    WHERE pr.auth_user_id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_product_variants_updated_at
BEFORE UPDATE ON public.product_variants
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();