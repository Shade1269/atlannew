import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckoutFlow } from './CheckoutFlow';

const testCart = [
  {
    product: {
      id: 'test-1',
      title: 'منتج تجريبي',
      price_sar: 100,
      final_price: 100,
      image_urls: ['https://via.placeholder.com/300x300']
    },
    quantity: 1
  }
];

export const CheckoutTest = () => {
  const [showCheckout, setShowCheckout] = useState(false);
  const [completed, setCompleted] = useState(false);

  if (completed) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-semibold text-success mb-2">تم الاختبار بنجاح!</h3>
          <p className="text-sm text-muted-foreground mb-4">CheckoutFlow يعمل بشكل صحيح</p>
          <Button onClick={() => {
            setCompleted(false);
            setShowCheckout(false);
          }}>
            اختبار مرة أخرى
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (showCheckout) {
    return (
      <div className="fixed inset-0 bg-background z-50 overflow-auto">
        <div className="container mx-auto px-4 py-8">
          <CheckoutFlow
            cart={testCart}
            shopId="test-shop-id"
            onCancel={() => setShowCheckout(false)}
            onOrderComplete={(_orderNumber) => {
              setCompleted(true);
              setShowCheckout(false);
            }}
            storeSettings={{ payment_providers: [], shipping_companies: [] }}
          />
        </div>
      </div>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>اختبار صفحة الدفع</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          هذا اختبار لصفحة الدفع للتأكد من أنها تعمل بشكل صحيح
        </p>
        <Button
          onClick={() => {
            setShowCheckout(true);
          }}
          className="w-full"
        >
          اختبار صفحة الدفع
        </Button>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• منتج تجريبي: 100 ر.س</p>
          <p>• الكمية: 1</p>
          <p>• معرف المتجر: test-shop-id</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CheckoutTest;