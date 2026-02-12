import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UnifiedCard, UnifiedCardContent } from '@/components/design-system';
import { UnifiedButton } from '@/components/design-system';
import { Separator } from '@/components/ui/separator';
import { Download, Printer, Store, MapPin, Phone, CreditCard, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';

interface ModernInvoiceProps {
  orderId: string;
  onClose: () => void;
}

export const ModernInvoice = ({ orderId, onClose: _onClose }: ModernInvoiceProps) => {
  const invoiceRef = useRef<HTMLDivElement>(null);

  const { data: orderData, isLoading } = useQuery({
    queryKey: ['order-invoice', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            title_snapshot,
            quantity,
            unit_price_sar,
            line_total_sar
          ),
          affiliate_stores!orders_affiliate_store_id_fkey (
            store_name,
            bio,
            logo_url
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });

  const handlePrint = () => {
    if (invoiceRef.current && orderData) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const htmlContent = `
          <!DOCTYPE html>
          <html dir="rtl">
          <head>
            <meta charset="UTF-8">
            <title>فاتورة ${orderData.order_number}</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; direction: rtl; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { padding: 12px; border: 1px solid #e0e0e0; text-align: right; }
              th { background-color: #f5f5f5; font-weight: bold; }
              @media print { body { margin: 0; } button { display: none; } }
            </style>
          </head>
          <body>
            ${invoiceRef.current.innerHTML}
          </body>
          </html>
        `;
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleDownload = () => {
    toast.info('جاري تحضير الفاتورة...');
    handlePrint();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto"></div>
        <p className="text-muted-foreground mt-4">جاري تحميل الفاتورة...</p>
      </div>
    );
  }

  if (!orderData) {
    return <div className="text-center py-20"><p className="text-muted-foreground">لم يتم العثور على الطلب</p></div>;
  }

  const store = orderData.affiliate_stores;

  return (
    <div className="space-y-6 bg-background text-foreground" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">فاتورة #{orderData.order_number}</h2>
        <div className="flex gap-2">
          <UnifiedButton onClick={handlePrint} variant="outline">
            <Printer className="h-4 w-4 ml-2" />طباعة
          </UnifiedButton>
          <UnifiedButton onClick={handleDownload}>
            <Download className="h-4 w-4 ml-2" />تحميل PDF
          </UnifiedButton>
        </div>
      </div>

      <UnifiedCard className="bg-card border-border">
        <UnifiedCardContent className="p-8" ref={invoiceRef}>
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-4">
              {store?.logo_url ? (
                <img src={store.logo_url} alt={store.store_name} className="h-20 w-20 rounded-full object-cover ring-2 ring-primary/20" />
              ) : (
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/20">
                  <Store className="h-10 w-10 text-primary" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-foreground">{store?.store_name}</h1>
                {store?.bio && <p className="text-sm text-muted-foreground mt-1">{store.bio}</p>}
              </div>
            </div>
            <div className="text-left">
              <div className="text-4xl font-bold text-primary mb-2">فاتورة</div>
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-foreground">رقم الفاتورة: {orderData.order_number}</p>
                <p className="text-muted-foreground">التاريخ: {format(new Date(orderData.created_at), 'dd/MM/yyyy', { locale: ar })}</p>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-foreground">
                <Package className="h-5 w-5 text-primary" />معلومات العميل
              </h3>
              <div className="space-y-2 text-sm text-foreground">
                <p><span className="font-medium">الاسم:</span> {orderData.customer_name}</p>
                <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{orderData.customer_phone}</p>
                {orderData.shipping_address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                    <div>
                      <p>{(orderData.shipping_address as any).street || ''}</p>
                      <p>{(orderData.shipping_address as any).district}, {(orderData.shipping_address as any).city}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-foreground">
                <CreditCard className="h-5 w-5 text-primary" />معلومات الطلب
              </h3>
              <div className="space-y-2 text-sm text-foreground">
                <p><span className="font-medium">حالة الطلب:</span> {orderData.status}</p>
                <p><span className="font-medium">طريقة الدفع:</span> {orderData.payment_method}</p>
                {orderData.tracking_number && (<p><span className="font-medium">رقم التتبع:</span> {orderData.tracking_number}</p>)}
              </div>
            </div>
          </div>

          <div className="mb-8">
            <table className="w-full">
              <thead>
                <tr className="bg-muted">
                  <th className="p-3 text-right text-foreground">#</th>
                  <th className="p-3 text-right text-foreground">المنتج</th>
                  <th className="p-3 text-center text-foreground">الكمية</th>
                  <th className="p-3 text-left text-foreground">السعر</th>
                  <th className="p-3 text-left text-foreground">المجموع</th>
                </tr>
              </thead>
              <tbody>
                {orderData.order_items?.map((item: any, index: number) => (
                  <tr key={item.id} className="border-b border-border">
                    <td className="p-3 text-foreground">{index + 1}</td>
                    <td className="p-3 text-foreground">{item.title_snapshot}</td>
                    <td className="p-3 text-center text-foreground">{item.quantity}</td>
                    <td className="p-3 text-left text-foreground">{item.unit_price_sar.toFixed(2)} ريال</td>
                    <td className="p-3 text-left font-medium text-foreground">{item.line_total_sar.toFixed(2)} ريال</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <div className="w-full max-w-sm space-y-2">
              <div className="flex justify-between text-sm text-foreground">
                <span>المجموع الفرعي:</span>
                <span className="font-medium">{orderData.subtotal_sar.toFixed(2)} ريال</span>
              </div>
              {orderData.shipping_sar && (
                <div className="flex justify-between text-sm text-foreground">
                  <span>الشحن:</span>
                  <span className="font-medium">{orderData.shipping_sar.toFixed(2)} ريال</span>
                </div>
              )}
              {orderData.vat_sar && (
                <div className="flex justify-between text-sm text-foreground">
                  <span>ضريبة القيمة المضافة:</span>
                  <span className="font-medium">{orderData.vat_sar.toFixed(2)} ريال</span>
                </div>
              )}
              <Separator className="bg-border" />
              <div className="flex justify-between text-lg font-bold text-foreground">
                <span>الإجمالي:</span>
                <span className="text-primary">{orderData.total_sar.toFixed(2)} ريال</span>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t text-center text-sm text-muted-foreground">
            <p>شكراً لتسوقكم معنا</p>
          </div>
        </UnifiedCardContent>
      </UnifiedCard>
    </div>
  );
};
