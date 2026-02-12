import React, { useState } from 'react';
import { Star, ThumbsUp, User, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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

interface ProductReviewsProps {
  productId: string;
  reviews: Review[];
  onReviewAdded?: () => void;
}

export const ProductReviews: React.FC<ProductReviewsProps> = ({
  productId,
  reviews,
  onReviewAdded
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [loading, setLoading] = useState(false);

  // حساب متوسط التقييم
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  // حساب توزيع التقييمات
  const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    percentage: reviews.length > 0 
      ? (reviews.filter(r => r.rating === star).length / reviews.length) * 100 
      : 0
  }));

  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast.error('الرجاء اختيار تقييم');
      return;
    }

    // التحقق من تسجيل الدخول
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('يجب تسجيل الدخول لإضافة تقييم');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('product_reviews')
        .insert({
          product_id: productId,
          user_id: user.id,
          rating,
          title: reviewTitle || null,
          comment: reviewText || null,
          is_approved: false
        });

      if (error) throw error;

      toast.success('تم إرسال تقييمك بنجاح! سيظهر بعد الموافقة عليه');
      setIsDialogOpen(false);
      resetForm();
      onReviewAdded?.();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('حدث خطأ أثناء إرسال التقييم');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setRating(0);
    setReviewTitle('');
    setReviewText('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* ملخص التقييمات */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-xl text-foreground">تقييمات المنتج</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-8">
            {/* المتوسط */}
            <div className="text-center md:text-right">
              <div className="text-5xl font-bold text-primary mb-2">
                {averageRating.toFixed(1)}
              </div>
              <div className="flex justify-center md:justify-start gap-1 mb-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    className={cn(
                      'h-5 w-5',
                      star <= Math.round(averageRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    )}
                  />
                ))}
              </div>
              <div className="text-sm text-muted-foreground">
                {reviews.length} تقييم
              </div>
            </div>

            {/* توزيع التقييمات */}
            <div className="flex-1 space-y-2">
              {ratingDistribution.map(({ star, count, percentage }) => (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-8">{star} ★</span>
                  <Progress value={percentage} className="flex-1 h-2" />
                  <span className="text-sm text-muted-foreground w-8">{count}</span>
                </div>
              ))}
            </div>

            {/* زر إضافة تقييم */}
            <div className="flex items-center justify-center md:justify-end">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="default" className="gap-2">
                    <Star className="h-4 w-4" />
                    أضف تقييمك
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>أضف تقييمك</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {/* اختيار التقييم */}
                    <div className="flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            className={cn(
                              'h-8 w-8 transition-colors',
                              star <= (hoverRating || rating)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-muted-foreground'
                            )}
                          />
                        </button>
                      ))}
                    </div>

                    <Input
                      placeholder="عنوان التقييم (اختياري)"
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                    />

                    <Textarea
                      placeholder="اكتب تقييمك هنا... (اختياري)"
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      rows={4}
                    />

                    <Button
                      onClick={handleSubmitReview}
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? 'جاري الإرسال...' : 'إرسال التقييم'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* قائمة التقييمات */}
      <AnimatePresence>
        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-foreground">
                            عميل
                          </span>
                          {review.is_verified && (
                            <span className="flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                              <CheckCircle className="h-3 w-3" />
                              مشتري موثق
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star
                                key={star}
                                className={cn(
                                  'h-4 w-4',
                                  star <= review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-muted-foreground'
                                )}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(review.created_at)}
                          </span>
                        </div>
                        {review.title && (
                          <h4 className="font-medium text-foreground mb-1">
                            {review.title}
                          </h4>
                        )}
                        {review.comment && (
                          <p className="text-muted-foreground text-sm">
                            {review.comment}
                          </p>
                        )}
                        {review.helpful_count > 0 && (
                          <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                            <ThumbsUp className="h-3 w-3" />
                            <span>{review.helpful_count} وجدوا هذا مفيداً</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="border-border/50">
            <CardContent className="py-12 text-center">
              <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                لا توجد تقييمات بعد. كن أول من يقيّم هذا المنتج!
              </p>
            </CardContent>
          </Card>
        )}
      </AnimatePresence>
    </div>
  );
};
