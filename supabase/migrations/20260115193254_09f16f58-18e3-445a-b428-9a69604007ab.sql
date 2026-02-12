-- Create wishlist table for storing user's favorite products
CREATE TABLE public.user_wishlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.affiliate_stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, store_id, product_id)
);

-- Create compare list table for storing products to compare
CREATE TABLE public.user_compare_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.affiliate_stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, store_id, product_id)
);

-- Enable RLS
ALTER TABLE public.user_wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_compare_lists ENABLE ROW LEVEL SECURITY;

-- Wishlist policies - users can only manage their own wishlist
CREATE POLICY "Users can view their own wishlist"
ON public.user_wishlists FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their own wishlist"
ON public.user_wishlists FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their own wishlist"
ON public.user_wishlists FOR DELETE
USING (auth.uid() = user_id);

-- Compare list policies - users can only manage their own compare list
CREATE POLICY "Users can view their own compare list"
ON public.user_compare_lists FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their own compare list"
ON public.user_compare_lists FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their own compare list"
ON public.user_compare_lists FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_user_wishlists_user_store ON public.user_wishlists(user_id, store_id);
CREATE INDEX idx_user_compare_lists_user_store ON public.user_compare_lists(user_id, store_id);