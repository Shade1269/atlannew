import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { safeJsonParse } from '@/lib/utils';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface SimpleCartProps {
  shopSlug?: string;
  onCheckout?: () => void;
}

export const SimpleCart: React.FC<SimpleCartProps> = ({ 
  shopSlug = 'default',
  onCheckout 
}) => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem(`cart_${shopSlug}`);
    const parsedCart = safeJsonParse<CartItem[]>(savedCart, []);
    setCartItems(parsedCart);
  }, [shopSlug]);

  // Save cart to localStorage
  const saveCart = (items: CartItem[]) => {
    localStorage.setItem(`cart_${shopSlug}`, JSON.stringify(items));
    setCartItems(items);
  };

  const addItemToCart = (product: Omit<CartItem, 'quantity'>) => {
    const existingItem = cartItems.find(item => item.id === product.id);
    
    if (existingItem) {
      updateQuantity(product.id, existingItem.quantity + 1);
    } else {
      const newItems = [...cartItems, { ...product, quantity: 1 }];
      saveCart(newItems);
      toast.success(`تم إضافة ${product.name} للسلة`);
    }
  };

  // Export function for external use
  void addItemToCart;

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }

    const updatedItems = cartItems.map(item =>
      item.id === id ? { ...item, quantity } : item
    );
    saveCart(updatedItems);
  };

  const removeFromCart = (id: string) => {
    const updatedItems = cartItems.filter(item => item.id !== id);
    saveCart(updatedItems);
    toast.success('تم حذف المنتج من السلة');
  };

  const clearCart = () => {
    saveCart([]);
    toast.success('تم تفريغ السلة');
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.error('السلة فارغة');
      return;
    }
    
    if (onCheckout) {
      onCheckout();
    } else {
      // Default checkout navigation using navigate
      navigate(`/${shopSlug}/checkout`);
    }
  };

  // Cart Icon with badge
  const CartIcon = () => (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setIsOpen(true)}
      className="relative"
    >
      <ShoppingCart className="h-5 w-5" />
      {getTotalItems() > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
        >
          {getTotalItems()}
        </Badge>
      )}
    </Button>
  );

  // Cart Modal/Drawer
  if (isOpen) {
    return (
      <>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 z-40" 
          onClick={() => setIsOpen(false)}
        />
        
        {/* Cart Drawer */}
        <div className="fixed top-0 right-0 h-full w-full max-w-md bg-background z-50 shadow-xl">
          <Card className="h-full rounded-none border-0">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  السلة ({getTotalItems()} منتج)
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="p-0 flex flex-col h-full">
              {cartItems.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center py-8">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">السلة فارغة</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      أضف بعض المنتجات لتبدأ التسوق
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Cart Items */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        {item.image && (
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{item.name}</h4>
                          <p className="text-primary font-semibold">
                            {item.price} ريال
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          
                          <span className="w-8 text-center font-medium">
                            {item.quantity}
                          </span>
                          
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive/80"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Cart Summary & Actions */}
                  <div className="p-4 border-t bg-muted/30">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">المجموع:</span>
                        <span className="text-lg font-bold text-primary">
                          {getTotalPrice()} ريال
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <Button 
                          onClick={handleCheckout}
                          className="w-full"
                          size="lg"
                        >
                          الدفع عند الاستلام
                        </Button>
                        
                        <Button 
                          variant="outline"
                          onClick={clearCart}
                          className="w-full"
                          size="sm"
                        >
                          تفريغ السلة
                        </Button>
                      </div>
                      
                      <div className="text-xs text-center text-muted-foreground">
                        <p>الدفع عند الاستلام • شحن مجاني</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // Return just the cart icon when closed
  return <CartIcon />;
};

// Hook for using cart functionality
export const useSimpleCart = (shopSlug: string = 'default') => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const savedCart = localStorage.getItem(`cart_${shopSlug}`);
    const parsedCart = safeJsonParse<CartItem[]>(savedCart, []);
    setCartItems(parsedCart);
  }, [shopSlug]);

  const addToCart = (product: Omit<CartItem, 'quantity'>) => {
    const existingItem = cartItems.find(item => item.id === product.id);
    let newItems: CartItem[];
    
    if (existingItem) {
      newItems = cartItems.map(item =>
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      newItems = [...cartItems, { ...product, quantity: 1 }];
    }
    
    localStorage.setItem(`cart_${shopSlug}`, JSON.stringify(newItems));
    setCartItems(newItems);
    toast.success(`تم إضافة ${product.name} للسلة`);
  };

  const clearCart = () => {
    localStorage.setItem(`cart_${shopSlug}`, JSON.stringify([]));
    setCartItems([]);
    toast.success('تم تفريغ السلة');
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  return {
    cartItems,
    addToCart,
    clearCart,
    getTotalItems,
    getTotalPrice
  };
};