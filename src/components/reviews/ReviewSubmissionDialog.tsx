import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, Upload, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface ReviewSubmissionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productTitle: string;
  orderItemId: string;
  customerProfileId: string;
}

export const ReviewSubmissionDialog: React.FC<ReviewSubmissionDialogProps> = ({
  isOpen,
  onClose,
  productId,
  productTitle,
  orderItemId,
  customerProfileId
}) => {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 3) {
      toast.error('يمكنك رفع 3 صور كحد أقصى');
      return;
    }

    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name}: حجم الملف كبير جداً (الحد الأقصى 5MB)`);
        return false;
      }
      return true;
    });

    setImages([...images, ...validFiles]);
    
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const file of images) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${customerProfileId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('review-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('review-images')
        .getPublicUrl(fileName);

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (rating === 0) {
        throw new Error('يجب اختيار تقييم');
      }

      setIsUploading(true);
      const imageUrls = images.length > 0 ? await uploadImages() : [];

      const { error } = await (supabase
        .from('product_reviews') as any)
        .insert({
          product_id: productId,
          customer_profile_id: customerProfileId,
          order_item_id: orderItemId,
          rating: rating,
          comment: comment.trim() || null,
          images: imageUrls,
          is_verified: true
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['product-rating-stats', productId] });
      toast.success('تم إضافة مراجعتك بنجاح! شكراً لك');
      onClose();
      setRating(0);
      setComment('');
      setImages([]);
      setImagePreviews([]);
    },
    onError: (error: any) => {
      toast.error(error.message || 'حدث خطأ في إضافة المراجعة');
    },
    onSettled: () => {
      setIsUploading(false);
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle>تقييم المنتج</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground mb-2">{productTitle}</p>
          </div>

          <div>
            <Label>التقييم *</Label>
            <div className="flex items-center gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                  key={star}
                  type="button"
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={`h-8 w-8 cursor-pointer transition-colors ${
                      star <= (hoveredRating || rating)
                        ? 'fill-warning text-warning'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                </motion.button>
              ))}
              {rating > 0 && (
                <span className="text-sm text-muted-foreground mr-2">
                  {rating === 5 ? 'ممتاز' : rating === 4 ? 'جيد جداً' : rating === 3 ? 'جيد' : rating === 2 ? 'مقبول' : 'ضعيف'}
                </span>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="comment">المراجعة (اختياري)</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="شارك تجربتك مع هذا المنتج..."
              className="mt-2 min-h-32"
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {comment.length}/1000 حرف
            </p>
          </div>

          <div>
            <Label>صور المنتج (اختياري - حتى 3 صور)</Label>
            <div className="mt-2">
              {imagePreviews.length < 3 && (
                <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                  <div className="text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      اضغط لرفع الصور
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG حتى 5MB
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                </label>
              )}

              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => submitMutation.mutate()}
              disabled={rating === 0 || submitMutation.isPending || isUploading}
              className="flex-1"
            >
              {isUploading ? 'جاري رفع الصور...' : submitMutation.isPending ? 'جاري الإرسال...' : 'إرسال المراجعة'}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={submitMutation.isPending || isUploading}
            >
              إلغاء
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
