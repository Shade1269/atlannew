import { useState } from "react";
import { Star, ThumbsUp, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title: string;
  content: string;
  date: string;
  images?: string[];
  helpful: number;
  verified: boolean;
}

export interface ReviewStats {
  average: number;
  total: number;
  distribution: Record<number, number>;
}

interface LuxuryProductReviewsProps {
  reviews: Review[];
  stats: ReviewStats;
  canReview: boolean;
  onSubmitReview: (data: { rating: number; title: string; content: string; images?: File[] }) => void;
  onHelpful: (reviewId: string) => void;
}

export function LuxuryProductReviews({
  reviews,
  stats,
  canReview,
  onSubmitReview,
  onHelpful,
}: LuxuryProductReviewsProps) {
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [hoverRating, setHoverRating] = useState(0);
  const [sortBy, setSortBy] = useState<"newest" | "helpful" | "rating">("newest");

  const handleSubmit = () => {
    onSubmitReview({ rating, title, content });
    setShowForm(false);
    setRating(5);
    setTitle("");
    setContent("");
  };

  const sortedReviews = [...reviews].sort((a, b) => {
    switch (sortBy) {
      case "helpful":
        return b.helpful - a.helpful;
      case "rating":
        return b.rating - a.rating;
      default:
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
  });

  return (
    <div className="py-12" dir="rtl">
      {/* Header & Stats */}
      <div className="flex flex-col lg:flex-row gap-8 mb-10">
        {/* Overall Rating */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-card rounded-2xl p-6 border border-border lg:w-72 flex-shrink-0"
        >
          <div className="text-center mb-6">
            <p className="text-5xl font-bold text-foreground mb-2">
              {stats.average.toFixed(1)}
            </p>
            <div className="flex justify-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    star <= stats.average
                      ? "text-primary fill-primary"
                      : "text-muted"
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              {stats.total} تقييم
            </p>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.distribution[rating] || 0;
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
              return (
                <div key={rating} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-3">{rating}</span>
                  <Star className="w-4 h-4 text-primary fill-primary" />
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-8">{count}</span>
                </div>
              );
            })}
          </div>

          {canReview && (
            <Button
              onClick={() => setShowForm(true)}
              className="w-full mt-6 bg-primary text-primary-foreground"
            >
              اكتب تقييم
            </Button>
          )}
        </motion.div>

        {/* Reviews List */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">
              التقييمات ({reviews.length})
            </h3>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-card border border-border rounded-lg px-4 py-2 text-sm focus:border-primary outline-none"
            >
              <option value="newest">الأحدث</option>
              <option value="helpful">الأكثر فائدة</option>
              <option value="rating">الأعلى تقييماً</option>
            </select>
          </div>

          {/* Review Form */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 overflow-hidden"
              >
                <div className="bg-card rounded-xl p-6 border border-primary/30">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-foreground">اكتب تقييمك</h4>
                    <button onClick={() => setShowForm(false)}>
                      <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-sm text-muted-foreground">تقييمك:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(star)}
                        >
                          <Star
                            className={`w-7 h-7 transition-colors ${
                              star <= (hoverRating || rating)
                                ? "text-primary fill-primary"
                                : "text-muted"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="عنوان التقييم"
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 mb-4 focus:border-primary outline-none"
                  />

                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="اكتب تقييمك هنا..."
                    rows={4}
                    className="bg-background border-border mb-4"
                  />

                  <div className="flex gap-3">
                    <Button
                      onClick={handleSubmit}
                      disabled={!title || !content}
                      className="bg-primary text-primary-foreground"
                    >
                      نشر التقييم
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowForm(false)}
                      className="border-border"
                    >
                      إلغاء
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reviews */}
          {sortedReviews.length === 0 ? (
            <div className="text-center py-12">
              <Star className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد تقييمات بعد</p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedReviews.map((review, index) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card rounded-xl p-5 border border-border"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                        {review.userAvatar ? (
                          <img
                            src={review.userAvatar}
                            alt={review.userName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">
                            {review.userName}
                          </span>
                          {review.verified && (
                            <span className="bg-success/10 text-success text-xs px-2 py-0.5 rounded-full">
                              مشتري موثق
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3 h-3 ${
                                  star <= review.rating
                                    ? "text-primary fill-primary"
                                    : "text-muted"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {review.date}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <h4 className="font-medium text-foreground mb-2">{review.title}</h4>
                  <p className="text-muted-foreground text-sm mb-4">{review.content}</p>

                  {/* Images */}
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 mb-4 flex-wrap">
                      {review.images.map((img, i) => (
                        <img
                          key={i}
                          src={img}
                          alt=""
                          className="w-16 h-16 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        />
                      ))}
                    </div>
                  )}

                  {/* Helpful */}
                  <button
                    onClick={() => onHelpful(review.id)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span>مفيد ({review.helpful})</span>
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
