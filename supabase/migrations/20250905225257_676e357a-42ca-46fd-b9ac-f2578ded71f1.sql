-- Allow public to view visible product library items
CREATE POLICY "Public can view visible product_library" 
ON public.product_library
FOR SELECT
USING (is_visible = true);