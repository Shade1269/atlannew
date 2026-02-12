import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  X, 
  Image as ImageIcon,
  Video,
  Star,
  Move,
  Eye,
  AlertCircle
} from 'lucide-react';
import { ProductMedia } from '@/hooks/useAdvancedProductManagement';
import { useToast } from '@/hooks/use-toast';

interface MediaManagerProps {
  media: ProductMedia[];
  onMediaChange: (media: ProductMedia[]) => void;
  validationError?: string;
}

const MediaManager: React.FC<MediaManagerProps> = ({
  media,
  onMediaChange,
  validationError
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // فلترة الوسائط
  const coverImage = media.find(m => m.media_type === 'cover_image');
  const galleryImages = media.filter(m => m.media_type === 'gallery').sort((a, b) => a.sort_order - b.sort_order);

  const handleVideoAdd = () => {
    const url = videoUrlInput.trim();
    if (url) {
      onMediaChange([...media, {
        product_id: "",
        media_type: 'video' as const,
        media_url: url,
        sort_order: media.length,
      }]);
      setVideoUrlInput('');
    }
  };

  

  // رفع الصور
  const handleFileUpload = async (files: FileList, type: 'cover_image' | 'gallery') => {
    const validFiles = Array.from(files).filter(file => {
      // التحقق من النوع
      if (!file.type.startsWith('image/')) {
        toast({
          title: "نوع ملف غير صحيح",
          description: "يرجى اختيار صور فقط (JPG, PNG, WEBP)",
          variant: "destructive"
        });
        return false;
      }

      // التحقق من الحجم (2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "حجم الملف كبير",
          description: `الملف ${file.name} أكبر من 2MB`,
          variant: "destructive"
        });
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) return;

    // محاكاة رفع الصور (في التطبيق الحقيقي سيتم رفعها للخادم)
    const newMedia: ProductMedia[] = [];

    for (const file of validFiles) {
      // ضغط الصورة (محاكاة)
      const compressedUrl = URL.createObjectURL(file);
      
      const mediaItem: ProductMedia = {
        product_id: '',
        media_type: type,
        media_url: compressedUrl,
        alt_text: file.name.replace(/\.[^/.]+$/, ""),
        sort_order: type === 'gallery' ? galleryImages.length + newMedia.length : 0,
        file_size: file.size,
        dimensions: await getImageDimensions(file)
      };

      newMedia.push(mediaItem);
    }

    // تحديث قائمة الوسائط
    if (type === 'cover_image') {
      // استبدال الصورة الرئيسية
      const updatedMedia = media.filter(m => m.media_type !== 'cover_image');
      onMediaChange([...updatedMedia, newMedia[0]]);
    } else {
      // إضافة إلى المعرض (حد أقصى 12 صورة)
      const currentGalleryCount = galleryImages.length;
      const canAdd = Math.min(newMedia.length, 12 - currentGalleryCount);
      
      if (canAdd < newMedia.length) {
        toast({
          title: "تم تجاوز الحد الأقصى",
          description: `يمكن إضافة ${canAdd} صور فقط (الحد الأقصى 12 صورة)`,
          variant: "destructive"
        });
      }

      onMediaChange([...media, ...newMedia.slice(0, canAdd)]);
    }

    toast({
      title: "تم رفع الصور",
      description: `تم رفع ${newMedia.length} صور بنجاح`,
    });
  };

  // الحصول على أبعاد الصورة
  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.src = URL.createObjectURL(file);
    });
  };

  // حذف وسائط
  const removeMedia = (index: number, type: 'cover_image' | 'gallery') => {
    if (type === 'cover_image') {
      onMediaChange(media.filter(m => m.media_type !== 'cover_image'));
    } else {
      const itemToRemove = galleryImages[index];
      onMediaChange(media.filter(m => m !== itemToRemove));
    }
  };

  // تحديث النص البديل
  const updateAltText = (mediaItem: ProductMedia, altText: string) => {
    const updatedMedia = media.map(m => 
      m === mediaItem ? { ...m, alt_text: altText } : m
    );
    onMediaChange(updatedMedia);
  };

  // إعادة ترتيب الصور
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null) return;

    const newGalleryImages = [...galleryImages];
    const draggedItem = newGalleryImages[draggedIndex];
    
    newGalleryImages.splice(draggedIndex, 1);
    newGalleryImages.splice(dropIndex, 0, draggedItem);

    // تحديث sort_order
    const updatedGalleryImages = newGalleryImages.map((img, index) => ({
      ...img,
      sort_order: index
    }));

    // دمج مع باقي الوسائط
    const otherMedia = media.filter(m => m.media_type !== 'gallery');
    onMediaChange([...otherMedia, ...updatedGalleryImages]);

    setDraggedIndex(null);
  };

  // حذف الفيديو
  const removeVideo = () => {
    onMediaChange(media.filter(m => m.media_type !== 'video'));
    setVideoUrlInput('');
  };

  return (
    <div className="space-y-6">
      {/* الصورة الرئيسية */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-warning" />
            الصورة الرئيسية *
          </CardTitle>
          <CardDescription>
            اختر صورة رئيسية عالية الجودة للمنتج (مطلوبة)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {coverImage ? (
              <div className="relative group">
                <img
                  src={coverImage.media_url}
                  alt={coverImage.alt_text ?? ''}
                  className="w-full h-64 object-cover rounded-lg border"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPreviewUrl(coverImage.media_url)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeMedia(0, 'cover_image')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Badge className="absolute top-2 right-2 bg-warning">
                  رئيسية
                </Badge>
              </div>
            ) : (
              <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors ${
                  validationError ? 'border-destructive' : 'border-border'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">اختر الصورة الرئيسية</p>
                <p className="text-sm text-muted-foreground">
                  JPG, PNG, WEBP - حد أقصى 2MB
                </p>
              </div>
            )}

            {validationError && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                {validationError}
              </div>
            )}

            {coverImage && (
              <div className="space-y-2">
                <Label>النص البديل</Label>
                <Input
                  value={coverImage.alt_text || ''}
                  onChange={(e) => updateAltText(coverImage, e.target.value)}
                  placeholder="وصف الصورة للمكفوفين"
                />
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files, 'cover_image')}
              className="hidden"
            />

            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {coverImage ? 'تغيير الصورة الرئيسية' : 'اختر الصورة الرئيسية'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* معرض الصور */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            معرض الصور
            <Badge variant="secondary">{galleryImages.length}/12</Badge>
          </CardTitle>
          <CardDescription>
            أضف حتى 12 صورة إضافية للمنتج (اختياري)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {galleryImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {galleryImages.map((image, index) => (
                  <div
                    key={index}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    className="relative group cursor-move"
                  >
                    <img
                      src={image.media_url}
                      alt={image.alt_text ?? ''}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setPreviewUrl(image.media_url)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeMedia(index, 'gallery')}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-1 absolute top-1 left-1">
                      <Move className="h-3 w-3 text-white" />
                      <Badge variant="secondary" className="text-xs">
                        {index + 1}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {galleryImages.length < 12 && (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files, 'gallery')}
                  className="hidden"
                  id="gallery-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('gallery-upload')?.click()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  إضافة صور للمعرض ({12 - galleryImages.length} متبقية)
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* الفيديو */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            فيديو المنتج
          </CardTitle>
          <CardDescription>
            أضف رابط فيديو من يوتيوب أو فيميو (اختياري)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {media.find(m => m.media_type === 'video') && (
              <div className="relative">
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <Video className="h-12 w-12 text-muted-foreground" />
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={removeVideo}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="flex gap-2">
              <Input
                value={videoUrlInput}
                onChange={(e) => setVideoUrlInput(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="flex-1"
              />
              <Button
                type="button"
                onClick={handleVideoAdd}
                disabled={!videoUrlInput.trim()}
              >
                إضافة
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* معاينة الصورة */}
      {previewUrl && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setPreviewUrl('')}
        >
          <div className="max-w-4xl max-h-full p-4">
            <img
              src={previewUrl}
              alt="معاينة"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaManager;