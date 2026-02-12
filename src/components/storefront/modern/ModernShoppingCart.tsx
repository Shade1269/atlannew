import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { UnifiedButton } from '@/components/design-system';
import { UnifiedBadge } from '@/components/design-system';
import { UnifiedCard, UnifiedCardContent } from '@/components/design-system';
import { Plus, Minus, ShoppingBag, ArrowLeft, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CartItem {
  id: string;
  product_id: string;
  product_title: string;
  product_image_url?: string;
  quantity: number;
  unit_price_sar: number;
  total_price_sar: number;
  selected_variants?: Record<string, string>;
}

interface ModernShoppingCartProps {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  total: number;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onCheckout: () => void;
}

export const ModernShoppingCart = ({
  open,
  onClose,
  items,
  total,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout
}: ModernShoppingCartProps) => {
  const itemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col bg-background border-border" dir="rtl">
        {/* Header */}
        <SheetHeader className="px-6 py-5 border-b border-border bg-muted/50">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-2xl font-bold flex items-center gap-2 text-foreground">
              <ShoppingBag className="h-6 w-6 text-primary" />
              سلة المشتريات
            </SheetTitle>
            <UnifiedBadge variant="secondary" className="text-base px-3 py-1">
              {itemsCount} منتج
            </UnifiedBadge>
          </div>
        </SheetHeader>

        {/* Content */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-background">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-foreground">السلة فارغة</h3>
            <p className="text-muted-foreground mb-6">
              ابدأ بإضافة المنتجات لسلة المشتريات
            </p>
            <UnifiedButton onClick={onClose} variant="outline">
              <ArrowLeft className="h-5 w-5 ml-2" />
              العودة للتسوق
            </UnifiedButton>
          </div>
        ) : (
          <>
            {/* Items List */}
            <ScrollArea className="flex-1 px-6 py-4 bg-background">
              <div className="space-y-4">
                <AnimatePresence>
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <UnifiedCard variant="glass" className="overflow-hidden hover:shadow-md transition-shadow bg-card border-border">
                        <UnifiedCardContent className="p-4">
                          <div className="flex gap-4">
                            {/* Image */}
                            <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted border border-border">
                              <img
                                src={item.product_image_url || '/placeholder.svg'}
                                alt={item.product_title}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            {/* Details */}
                            <div className="flex-1 space-y-2 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-semibold text-sm line-clamp-2 text-foreground">
                                  {item.product_title}
                                </h4>
                                <UnifiedButton
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => onRemoveItem(item.id)}
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </UnifiedButton>
                              </div>

                              {/* Variants */}
                              {item.selected_variants && Object.keys(item.selected_variants).length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {Object.entries(item.selected_variants).map(([type, value]) => (
                                    <UnifiedBadge
                                      key={type}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {type === 'size' ? 'المقاس' : type === 'color' ? 'اللون' : type}: {value}
                                    </UnifiedBadge>
                                  ))}
                                </div>
                              )}

                              {/* Price & Quantity */}
                              <div className="flex items-center justify-between">
                                <span className="text-lg font-bold text-primary">
                                  {item.total_price_sar.toFixed(0)} ريال
                                </span>

                                <div className="flex items-center gap-1 bg-muted border border-border rounded-lg p-1">
                                  <UnifiedButton
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                                    className="h-7 w-7 hover:bg-background"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </UnifiedButton>
                                  <span className="w-8 text-center text-sm font-semibold text-foreground">
                                    {item.quantity}
                                  </span>
                                  <UnifiedButton
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                    className="h-7 w-7 hover:bg-background"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </UnifiedButton>
                                </div>
                              </div>
                            </div>
                          </div>
                        </UnifiedCardContent>
                      </UnifiedCard>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="border-t border-border bg-muted/50 p-6 space-y-4">
              {/* Total */}
              <div className="flex items-center justify-between text-lg">
                <span className="font-semibold text-foreground">المجموع الكلي:</span>
                <span className="text-2xl font-bold text-primary">
                  {total.toFixed(2)} ريال
                </span>
              </div>

              {/* Checkout Button */}
              <UnifiedButton
                onClick={onCheckout}
                variant="default"
                className="w-full h-12 text-lg shadow-lg"
                size="lg"
              >
                <ShoppingBag className="h-5 w-5 ml-2" />
                إتمام الطلب
              </UnifiedButton>

              {/* Continue Shopping */}
              <UnifiedButton
                onClick={onClose}
                variant="outline"
                className="w-full"
              >
                <ArrowLeft className="h-5 w-5 ml-2" />
                متابعة التسوق
              </UnifiedButton>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
