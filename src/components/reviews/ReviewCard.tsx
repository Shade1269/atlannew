import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, ThumbsUp, ThumbsDown, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  images: string[];
  is_verified: boolean;
  helpful_count: number;
  created_at: string;
  customer_profile_id: string;
  profiles: {
    full_name: string;
  };
  user_vote?: {
    is_helpful: boolean;
  } | null;
}

interface ReviewCardProps {
  review: Review;
  onVote: (reviewId: string, isHelpful: boolean) => void;
  currentUserId?: string;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review, onVote, currentUserId }) => {
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);

  return (
    <Card className="border-0 bg-card/50 backdrop-blur-sm" dir="rtl">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="font-semibold">{review.profiles.full_name}</span>
              {review.is_verified && (
                <Badge className="bg-success/10 text-success border-success/20">
                  <CheckCircle className="h-3 w-3 ml-1" />
                  عميل موثّق
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= review.rating
                        ? 'fill-warning text-warning'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {format(new Date(review.created_at), 'dd MMMM yyyy', { locale: ar })}
              </span>
            </div>
          </div>
        </div>

        {review.comment && (
          <p className="text-foreground leading-relaxed mb-4">{review.comment}</p>
        )}

        {review.images && review.images.length > 0 && (
          <div className="flex gap-2 mb-4 overflow-x-auto">
            {review.images.map((imageUrl, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                className="relative w-20 h-20 rounded-lg overflow-hidden cursor-pointer flex-shrink-0"
                onClick={() => setSelectedImage(imageUrl)}
              >
                <img
                  src={imageUrl}
                  alt={`صورة المراجعة ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </motion.div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onVote(review.id, true)}
            disabled={!currentUserId}
            className={review.user_vote?.is_helpful ? 'text-success' : ''}
          >
            <ThumbsUp className="h-4 w-4 ml-1" />
            مفيد ({review.helpful_count})
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onVote(review.id, false)}
            disabled={!currentUserId}
            className={review.user_vote && !review.user_vote.is_helpful ? 'text-destructive' : ''}
          >
            <ThumbsDown className="h-4 w-4 ml-1" />
            غير مفيد
          </Button>
        </div>

        {selectedImage && (
          <div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <img
              src={selectedImage}
              alt="صورة المراجعة"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
