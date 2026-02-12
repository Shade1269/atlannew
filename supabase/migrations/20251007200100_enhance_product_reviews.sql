
ALTER TABLE public.product_reviews 
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.review_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES public.product_reviews(id) ON DELETE CASCADE,
    voter_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_helpful BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(review_id, voter_profile_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_is_verified ON public.product_reviews(is_verified);
CREATE INDEX IF NOT EXISTS idx_product_reviews_is_hidden ON public.product_reviews(is_hidden);
CREATE INDEX IF NOT EXISTS idx_review_votes_review_id ON public.review_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_votes_voter_profile_id ON public.review_votes(voter_profile_id);

ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view review votes" ON public.review_votes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote on reviews" ON public.review_votes
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        voter_profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    );

CREATE POLICY "Users can update their own votes" ON public.review_votes
    FOR UPDATE USING (
        voter_profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    );

CREATE POLICY "Users can delete their own votes" ON public.review_votes
    FOR DELETE USING (
        voter_profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    );

DROP TRIGGER IF EXISTS update_product_reviews_updated_at ON public.product_reviews;
CREATE TRIGGER update_product_reviews_updated_at
    BEFORE UPDATE ON public.product_reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.get_product_rating_stats(p_product_id UUID)
RETURNS TABLE (
    average_rating DECIMAL(3,2),
    total_reviews INTEGER,
    rating_distribution JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ROUND(AVG(rating)::NUMERIC, 2) as average_rating,
        COUNT(*)::INTEGER as total_reviews,
        jsonb_build_object(
            '5', COUNT(*) FILTER (WHERE rating = 5),
            '4', COUNT(*) FILTER (WHERE rating = 4),
            '3', COUNT(*) FILTER (WHERE rating = 3),
            '2', COUNT(*) FILTER (WHERE rating = 2),
            '1', COUNT(*) FILTER (WHERE rating = 1)
        ) as rating_distribution
    FROM public.product_reviews
    WHERE product_id = p_product_id
      AND is_verified = true
      AND is_hidden = false;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.update_review_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE public.product_reviews
        SET helpful_count = (
            SELECT COUNT(*) FROM public.review_votes
            WHERE review_id = NEW.review_id AND is_helpful = true
        )
        WHERE id = NEW.review_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.product_reviews
        SET helpful_count = (
            SELECT COUNT(*) FROM public.review_votes
            WHERE review_id = OLD.review_id AND is_helpful = true
        )
        WHERE id = OLD.review_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_review_helpful_count_trigger ON public.review_votes;
CREATE TRIGGER update_review_helpful_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.review_votes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_review_helpful_count();

INSERT INTO storage.buckets (id, name, public)
VALUES ('review-images', 'review-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can upload review images" ON storage.objects;
DROP POLICY IF EXISTS "Review images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their review images" ON storage.objects;

CREATE POLICY "Authenticated users can upload review images"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'review-images' AND
    auth.uid() IS NOT NULL
);

CREATE POLICY "Review images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'review-images');

CREATE POLICY "Users can delete their review images"
ON storage.objects
FOR DELETE
USING (
    bucket_id = 'review-images' AND
    auth.uid() IS NOT NULL
);
