import React, { useState } from 'react';
import { CheckoutSteps } from './CheckoutSteps';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle, Package, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface CartItem {
  product: any;
  quantity: number;
  variant?: any;
}

interface CheckoutFlowProps {
  cart: CartItem[];
  onOrderComplete: (orderNumber: string) => void;
  onCancel: () => void;
  shopId: string;
  storeSettings: any;
  affiliateStoreId?: string; // إضافة معرف متجر المسوق
  customerSessionId?: string; // إضافة معرف جلسة العميل
}

export const CheckoutFlow: React.FC<CheckoutFlowProps> = ({
  cart,
  onOrderComplete,
  onCancel,
  shopId,
  storeSettings,
  affiliateStoreId,
  customerSessionId
}) => {
  const [loading, setLoading] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [_paymentUrl, setPaymentUrl] = useState('');
  const [showSteps, setShowSteps] = useState(true);

  // Mark setPaymentUrl as used
  void setPaymentUrl;

  const handleStepsComplete = async (orderData: any) => {
    setShowSteps(false);
    setOrderNumber(orderData.orderNumber);
    await processOrder(orderData);
  };

  const processOrder = async (orderData: any) => {
    const { customerInfo, cart, selectedPayment, subtotal, shippingCost, totalPrice, orderNumber } = orderData;

    setLoading(true);
    
    try {
      const affiliateCommission = affiliateStoreId ? totalPrice * 0.1 : 0;

      const { data: order, error: orderError } = await supabase
        .from('ecommerce_orders')
        .insert({
          shop_id: shopId,
          affiliate_store_id: affiliateStoreId,
          customer_name: customerInfo.name,
          customer_phone: customerInfo.phone,
          customer_email: customerInfo.email || null,
          session_id: customerSessionId || null, // حفظ معرف الجلسة
          shipping_address: {
            address: customerInfo.address,
            city: customerInfo.city,
            area: customerInfo.area,
            email: customerInfo.email,
          },
          subtotal_sar: subtotal,
          shipping_sar: shippingCost,
          tax_sar: 0,
          total_sar: totalPrice,
          payment_method: selectedPayment,
          payment_status: 'PENDING',
          status: 'PENDING',
          order_number: orderNumber,
          affiliate_commission_sar: affiliateCommission,
        })
        .select('id, order_number')
        .maybeSingle();

      if (orderError) {
        console.error('Error creating order:', orderError);
        throw new Error('فشل في إنشاء الطلب');
      }

      if (!order) {
        throw new Error('فشل في إنشاء الطلب');
      }

      // NOTE: total_price_sar is GENERATED ALWAYS column - auto-calculated
      const orderItems = cart.map((item: CartItem) => ({
        order_id: order.id,
        product_id: item.product.id,
        product_title: item.product.title,
        quantity: item.quantity,
        unit_price_sar: item.product.final_price || item.product.price_sar,
      }));

      const { error: itemsError } = await supabase
        .from('ecommerce_order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Error creating order items:', itemsError);
        throw new Error('فشل في حفظ عناصر الطلب');
      }

      await supabase
        .from('ecommerce_payment_transactions')
        .insert({
          order_id: order.id,
          transaction_id: `COD-${order.id.slice(-6)}`,
          payment_method: selectedPayment,
          payment_status: 'PENDING',
          amount_sar: totalPrice,
          currency: 'SAR',
          gateway_name: 'Cash on Delivery',
        });

      // Handle non-payment gateway orders (COD, etc.)
      toast({
        title: "جاري معالجة الطلب",
        description: "يرجى الانتظار..."
      });
      
      // تأخير قصير لضمان إكتمال الـ INSERT قبل الـ UPDATE
      // هذا يضمن أن trigger الـ UPDATE يعمل بشكل صحيح
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // For cash on delivery, update payment transaction FIRST to trigger order update
      // The trigger trg_tx_to_order_paid will update order payment_status to PAID
      const { error: txError } = await supabase
        .from('ecommerce_payment_transactions')
        .update({ payment_status: 'COMPLETED' as const })
        .eq('order_id', order.id);

      if (txError) {
        console.error('Error updating payment transaction:', txError);
        // Fallback: update order directly if transaction update fails
        await supabase
          .from('ecommerce_orders')
          .update({ 
            status: 'CONFIRMED' as const,
            payment_status: 'PAID' as const
          })
          .eq('id', order.id);
      } else {
        // Also update order status to CONFIRMED
        await supabase
          .from('ecommerce_orders')
          .update({ status: 'CONFIRMED' as const })
          .eq('id', order.id);
      }

      // Inventory reservations/fulfillment now run inside the database triggers

      // Simulate payment processing for other methods
      setTimeout(() => {
        setOrderCompleted(true);
        
        toast({
          title: "تم إنشاء الطلب بنجاح!",
          description: `رقم الطلب: ${orderNumber}`,
        });
        
        if (onOrderComplete) {
          onOrderComplete(orderNumber);
        }
      }, 2000);
    } catch (error: any) {
      console.error('CheckoutFlow: Order processing error:', error);
      toast({
        title: "خطأ في معالجة الطلب",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
          <h3 className="text-lg font-semibold mb-2">جاري معالجة طلبك</h3>
          <p className="text-muted-foreground text-center">
            يرجى الانتظار...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (showSteps) {
    return (
      <CheckoutSteps
        cart={cart}
        onComplete={handleStepsComplete}
        onCancel={onCancel}
        shopSettings={storeSettings}
      />
    );
  }

  if (orderCompleted) {
    return (
      <Card className="w-full max-w-md mx-auto" dir="rtl">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-success/10 rounded-full p-4 mb-6">
            <CheckCircle className="h-12 w-12 text-success" />
          </div>
          
          <h3 className="text-xl font-bold text-success mb-2">
            تم إنشاء طلبك بنجاح!
          </h3>
          
          <div className="bg-muted/50 rounded-lg p-4 mb-6 w-full">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Package className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">رقم الطلب</span>
            </div>
            <p className="text-lg font-mono font-bold text-primary">
              {orderNumber}
            </p>
          </div>

          {_paymentUrl && (
            <div className="w-full space-y-4">
              <p className="text-sm text-muted-foreground">
                سيتم فتح صفحة الدفع في نافذة جديدة خلال لحظات
              </p>
              <Button 
                onClick={() => window.open(_paymentUrl, '_blank')}
                className="w-full bg-primary hover:bg-primary/90"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                إكمال الدفع الآن
              </Button>
            </div>
          )}

          <p className="text-sm text-muted-foreground mt-4">
            شكراً لك! سنتواصل معك قريباً لتأكيد طلبك.
          </p>
          
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="mt-4"
          >
            إغلاق
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default CheckoutFlow;