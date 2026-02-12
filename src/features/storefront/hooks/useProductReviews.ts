import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Review {
  id: string;
  user_id?: string;
  rating: number;
  title?: string;
  comment?: string;
  is_verified: boolean;
  helpful_count: number;
  created_at: string;
}

export const useProductReviews = (productId: string) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  const fetchReviews = useCallback(async () => {
    if (!productId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const reviewsData = (data || []).map(r => ({
        id: r.id,
        user_id: r.user_id ?? undefined,
        rating: r.rating,
        title: r.title ?? undefined,
        comment: r.comment ?? undefined,
        is_verified: r.is_verified ?? false,
        helpful_count: r.helpful_count ?? 0,
        created_at: r.created_at
      }));

      setReviews(reviewsData);
      setTotalReviews(reviewsData.length);
      
      if (reviewsData.length > 0) {
        const avg = reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length;
        setAverageRating(avg);
      } else {
        setAverageRating(0);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return {
    reviews,
    loading,
    averageRating,
    totalReviews,
    refetch: fetchReviews
  };
};
