import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useShoppingCart } from '@/hooks/useShoppingCart';
import { ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface ShoppingCartDrawerProps {
  children?: React.ReactNode;
}

const ShoppingCartDrawer = ({ children }: ShoppingCartDrawerProps) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { 
    cart, 
    loading, 
    updateQuantity, 
    removeFromCart, 
    clearCart, 
    getCartTotals 
  } = useShoppingCart();

  const { subtotal, itemCount, totalItems } = getCartTotals;

  const handleCheckout = () => {
    if (!cart?.items.length) {
      toast.error('العربة فارغة');
      return;
    }
    
    setIsOpen(false);
    navigate('/checkout');
  };

  const handleItemQuantityChange = async (itemId: string, newQuantity: number) => {
    await updateQuantity(itemId, newQuantity);
  };

  const handleRemoveItem = async (itemId: string) => {
    await removeFromCart(itemId);
  };

  const handleClearCart = async () => {
    if (window.confirm('هل تريد إفراغ العربة؟')) {
      await clearCart();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="relative">
            <ShoppingCart className="h-4 w-4" />
            {totalItems > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {totalItems}
              </Badge>
            )}
          </Button>
        )}
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>عربة التسوق</span>
            <Badge variant="secondary">{itemCount} منتج</Badge>
          </SheetTitle>
          <SheetDescription>
            مراجعة العناصر المضافة قبل إتمام الطلب
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col h-full pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : !cart?.items.length ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">العربة فارغة</h3>
              <p className="text-muted-foreground mb-4">ابدأ بإضافة منتجات إلى عربة التسوق</p>
              <Button onClick={() => setIsOpen(false)} variant="outline">
                تصفح المنتجات
              </Button>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="flex-1 overflow-auto space-y-4">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    {item.product_image_url && (
                      <img
                        src={item.product_image_url}
                        alt={item.product_title}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{item.product_title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {item.unit_price_sar} ريال × {item.quantity}
                      </p>
                      <p className="font-semibold text-primary">
                        {item.total_price_sar} ريال
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(item.id)}
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleItemQuantityChange(item.id, item.quantity - 1)}
                          className="h-6 w-6 p-0"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        
                        <span className="mx-2 min-w-[2rem] text-center text-sm">
                          {item.quantity}
                        </span>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleItemQuantityChange(item.id, item.quantity + 1)}
                          className="h-6 w-6 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              {/* Cart Footer */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">المجموع الفرعي:</span>
                  <span className="font-semibold">{subtotal} ريال</span>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleClearCart}
                    className="flex-1"
                    disabled={loading}
                  >
                    إفراغ العربة
                  </Button>
                  <Button
                    onClick={handleCheckout}
                    className="flex-1"
                    disabled={loading}
                  >
                    إتمام الطلب
                  </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  الشحن والضرائب ستحسب في صفحة الدفع
                </p>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ShoppingCartDrawer;