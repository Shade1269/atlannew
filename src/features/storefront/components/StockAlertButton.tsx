import React, { useState } from 'react';
import { Bell, BellRing, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface StockAlertButtonProps {
  productId: string;
  productName: string;
  storeId: string;
  isOutOfStock: boolean;
  className?: string;
}

export const StockAlertButton: React.FC<StockAlertButtonProps> = ({
  productId,
  productName,
  storeId,
  isOutOfStock,
  className
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = async () => {
    if (!email.trim() && !phone.trim()) {
      toast.error('الرجاء إدخال البريد الإلكتروني أو رقم الجوال');
      return;
    }

    // التحقق من صحة البريد الإلكتروني
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('الرجاء إدخال بريد إلكتروني صحيح');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('stock_alerts')
        .insert({
          product_id: productId,
          affiliate_store_id: storeId,
          customer_email: email || 'no-email@placeholder.com',
          customer_phone: phone || null
        });

      if (error) throw error;

      toast.success('سيتم إشعارك عند توفر المنتج');
      setIsSubscribed(true);
      setIsDialogOpen(false);
      setEmail('');
      setPhone('');
    } catch (error) {
      console.error('Error subscribing to stock alert:', error);
      toast.error('حدث خطأ أثناء التسجيل للتنبيه');
    } finally {
      setLoading(false);
    }
  };

  // لا نعرض الزر إذا المنتج متوفر
  if (!isOutOfStock) return null;

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'gap-2 border-primary/50 text-primary hover:bg-primary/10',
            isSubscribed && 'bg-primary/10',
            className
          )}
          disabled={isSubscribed}
        >
          {isSubscribed ? (
            <>
              <BellRing className="h-4 w-4" />
              مُسجّل للتنبيه
            </>
          ) : (
            <>
              <Bell className="h-4 w-4" />
              أبلغني عند التوفر
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            تنبيه توفر المنتج
          </DialogTitle>
          <DialogDescription>
            سنرسل لك إشعاراً فور توفر "{productName}"
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="relative">
            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="البريد الإلكتروني"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pr-10"
              dir="ltr"
            />
          </div>
          
          <div className="relative flex items-center gap-2">
            <span className="text-sm text-muted-foreground">أو</span>
          </div>

          <div className="relative">
            <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="tel"
              placeholder="رقم الجوال (اختياري)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="pr-10"
              dir="ltr"
            />
          </div>

          <Button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full gap-2"
          >
            {loading ? (
              'جاري التسجيل...'
            ) : (
              <>
                <Bell className="h-4 w-4" />
                تنبيهني عند التوفر
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            لن نشارك بياناتك مع أي جهة خارجية
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
