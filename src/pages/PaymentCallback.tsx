import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, FileText, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { UnifiedButton, UnifiedCard } from '@/components/design-system';

interface OrderDetails {
  id: string;
  order_number: string;
  total_sar: number;
  subtotal_sar: number;
  shipping_sar: number;
  vat_sar: number;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  shipping_address: any;
  items: Array<{
    title_snapshot: string;
    quantity: number;
    unit_price_sar: number;
    line_total_sar: number;
  }>;
}

export const PaymentCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('جاري معالجة الدفع...');
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      try {
        // الحصول على البيانات من URL parameters
        const orderId = searchParams.get('orderId') || searchParams.get('merchantReferenceId');
        const sessionId = searchParams.get('sessionId');
        const paymentStatus = searchParams.get('status');
        const paymentId = searchParams.get('paymentId');
        const detailedResponseCode = searchParams.get('detailedResponseCode');
        const detailedResponseMessage = searchParams.get('detailedResponseMessage');
        const amount = searchParams.get('amount');
        const currency = searchParams.get('currency') || 'SAR';

        // التحقق من حالة الإلغاء
        if (paymentStatus === 'CANCELLED' || paymentStatus === 'cancelled' || 
            detailedResponseCode === 'CANCELLED' || detailedResponseMessage?.toLowerCase().includes('cancel')) {
          setStatus('failed');
          setMessage('تم إلغاء عملية الدفع. السلة لم يتم تفريغها.');
          // لا يتم تفريغ السلة عند الإلغاء
          return;
        }

        if (!orderId) {
          setStatus('failed');
          setMessage('خطأ: لم يتم العثور على رقم الطلب');
          return;
        }

        // استدعاء Edge Function لمعالجة النتيجة
        const { data, error } = await supabase.functions.invoke('process-geidea-callback', {
          body: {
            orderId,
            sessionId,
            status: paymentStatus,
            amount: amount ? parseFloat(amount) : 0,
            currency,
            paymentId,
            detailedResponseCode,
            detailedResponseMessage,
          },
        });

        if (error) {
          console.error('Error processing callback:', error);
          setStatus('failed');
          setMessage('حدث خطأ أثناء معالجة الدفع');
          return;
        }

        if (data.success) {
          // التحقق من حالة الإلغاء مرة أخرى من response
          if (data.status === 'CANCELLED' || data.status === 'CANCELED' || 
              (data.status === 'FAILED' && data.message?.toLowerCase().includes('cancel'))) {
            setStatus('failed');
            setMessage('تم إلغاء عملية الدفع. السلة لم يتم تفريغها.');
            // لا يتم تفريغ السلة عند الإلغاء
            return;
          }
          
          if (data.status === 'COMPLETED' || data.status === 'PAID') {
            setStatus('success');
            setMessage('تم الدفع بنجاح! شكراً لك.');
            
            // جلب تفاصيل الطلب
            const { data: orderData, error: orderError } = await supabase
              .from('orders')
              .select(`
                id,
                order_number,
                total_sar,
                subtotal_sar,
                shipping_sar,
                vat_sar,
                created_at,
                customer_name,
                customer_phone,
                shipping_address,
                order_items (
                  title_snapshot,
                  quantity,
                  unit_price_sar,
                  line_total_sar
                )
              `)
              .eq('id', orderId)
              .single();

            if (!orderError && orderData) {
              setOrderDetails({
                ...orderData,
                items: orderData.order_items || []
              } as OrderDetails);
            }
          } else {
            setStatus('failed');
            setMessage(data.message || 'فشل الدفع');
          }
        } else {
          setStatus('failed');
          setMessage(data.error || 'فشل الدفع');
        }

      } catch (error) {
        console.error('Callback processing error:', error);
        setStatus('failed');
        setMessage('حدث خطأ غير متوقع');
      }
    };

    processCallback();
  }, [searchParams]);

  if (status === 'loading') {
    return (
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-4">
        <UnifiedCard className="w-full max-w-xl border border-[color:var(--glass-border)] bg-[color:var(--glass-bg)]/85 p-8 text-center">
          <Loader2 className="h-16 w-16 mx-auto mb-4 text-[color:var(--accent)] animate-spin" />
          <h1 className="text-2xl font-semibold text-[color:var(--glass-fg)] mb-2">
            جاري معالجة الدفع...
          </h1>
          <p className="text-[color:var(--fg-muted)]">
            {message}
          </p>
        </UnifiedCard>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  if (status === 'success') {
    return (
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-4 py-8">
        {/* رسالة النجاح */}
        <UnifiedCard className="w-full border border-success/20 bg-[color:var(--glass-bg)]/85 p-6 text-center">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-success" />
          <h1 className="text-2xl font-semibold text-[color:var(--glass-fg)] mb-2">
            تم الدفع بنجاح!
          </h1>
          <p className="text-[color:var(--fg-muted)]">
            تمت عملية الدفع بنجاح. شكراً لثقتك بنا.
          </p>
        </UnifiedCard>

        {/* الفاتورة */}
        {orderDetails && (
          <UnifiedCard className="w-full border border-[color:var(--glass-border)] bg-[color:var(--glass-bg)]/85 p-8" id="invoice">
            {/* رأس الفاتورة */}
            <div className="flex items-start justify-between mb-8 pb-6 border-b border-[color:var(--glass-border)]">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-6 w-6 text-[color:var(--accent)]" />
                  <h2 className="text-2xl font-bold text-[color:var(--glass-fg)]">فاتورة</h2>
                </div>
                <p className="text-sm text-[color:var(--fg-muted)]">
                  رقم الطلب: <span className="font-mono text-[color:var(--glass-fg)]">{orderDetails.order_number}</span>
                </p>
                <p className="text-sm text-[color:var(--fg-muted)]">
                  التاريخ: {new Date(orderDetails.created_at).toLocaleDateString('ar-SA')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-[color:var(--fg-muted)] mb-1">الإجمالي</p>
                <p className="text-3xl font-bold text-[color:var(--accent)]">
                  {orderDetails.total_sar.toFixed(2)} ر.س
                </p>
              </div>
            </div>

            {/* معلومات العميل */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-[color:var(--glass-fg)] mb-3">معلومات العميل</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[color:var(--fg-muted)]">الاسم</p>
                  <p className="text-[color:var(--glass-fg)] font-medium">{orderDetails.customer_name}</p>
                </div>
                {orderDetails.customer_phone && (
                  <div>
                    <p className="text-[color:var(--fg-muted)]">الهاتف</p>
                    <p className="text-[color:var(--glass-fg)] font-medium">{orderDetails.customer_phone}</p>
                  </div>
                )}
                {orderDetails.shipping_address && (
                  <div>
                    <p className="text-[color:var(--fg-muted)]">عنوان التوصيل</p>
                    <p className="text-[color:var(--glass-fg)] font-medium">
                      {orderDetails.shipping_address.street || ''} {orderDetails.shipping_address.city || ''}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* جدول المنتجات */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-[color:var(--glass-fg)] mb-3">تفاصيل الطلب</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-[color:var(--glass-border)]">
                    <tr className="text-[color:var(--fg-muted)]">
                      <th className="text-right py-2 px-2">المنتج</th>
                      <th className="text-center py-2 px-2">الكمية</th>
                      <th className="text-center py-2 px-2">السعر</th>
                      <th className="text-center py-2 px-2">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[color:var(--glass-border)]">
                    {orderDetails.items.map((item, index) => (
                      <tr key={index} className="text-[color:var(--glass-fg)]">
                        <td className="py-3 px-2">{item.title_snapshot}</td>
                        <td className="text-center py-3 px-2">{item.quantity}</td>
                        <td className="text-center py-3 px-2">{item.unit_price_sar.toFixed(2)}</td>
                        <td className="text-center py-3 px-2 font-medium">{item.line_total_sar.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* الملخص المالي */}
            <div className="space-y-2 pt-4 border-t border-[color:var(--glass-border)]">
              <div className="flex justify-between text-sm">
                <span className="text-[color:var(--fg-muted)]">المجموع الفرعي</span>
                <span className="text-[color:var(--glass-fg)] font-medium">
                  {orderDetails.subtotal_sar.toFixed(2)} ر.س
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[color:var(--fg-muted)]">الشحن</span>
                <span className="text-[color:var(--glass-fg)] font-medium">
                  {orderDetails.shipping_sar.toFixed(2)} ر.س
                </span>
              </div>
              {orderDetails.vat_sar > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[color:var(--fg-muted)]">ضريبة القيمة المضافة</span>
                  <span className="text-[color:var(--glass-fg)] font-medium">
                    {orderDetails.vat_sar.toFixed(2)} ر.س
                  </span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-[color:var(--glass-border)]">
                <span className="text-[color:var(--glass-fg)]">الإجمالي</span>
                <span className="text-[color:var(--accent)]">
                  {orderDetails.total_sar.toFixed(2)} ر.س
                </span>
              </div>
            </div>

            {/* أزرار الإجراءات */}
            <div className="flex gap-3 mt-8 print:hidden">
              <UnifiedButton variant="outline" onClick={handlePrint} className="flex-1 gap-2">
                <Download className="h-4 w-4" />
                طباعة الفاتورة
              </UnifiedButton>
              <UnifiedButton variant="primary" onClick={() => navigate('/orders')} className="flex-1">
                عرض طلباتي
              </UnifiedButton>
              <UnifiedButton variant="ghost" onClick={() => navigate('/')}>
                الصفحة الرئيسية
              </UnifiedButton>
            </div>
          </UnifiedCard>
        )}

        {/* إذا لم تُحمل تفاصيل الطلب */}
        {!orderDetails && (
          <UnifiedCard className="w-full border border-[color:var(--glass-border)] bg-[color:var(--glass-bg)]/85 p-8 text-center">
            <p className="text-[color:var(--fg-muted)] mb-6">
              تمت عملية الدفع بنجاح. سيتم معالجة طلبك قريباً.
            </p>
            <div className="flex gap-3 justify-center">
              <UnifiedButton variant="primary" onClick={() => navigate('/orders')}>
                عرض طلباتي
              </UnifiedButton>
              <UnifiedButton variant="ghost" onClick={() => navigate('/')}>
                الصفحة الرئيسية
              </UnifiedButton>
            </div>
          </UnifiedCard>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-4">
      <UnifiedCard className="w-full max-w-xl border border-[color:var(--glass-border)] bg-[color:var(--glass-bg)]/85 p-8 text-center">
        <XCircle className="h-16 w-16 mx-auto mb-4 text-destructive" />
        <h1 className="text-2xl font-semibold text-[color:var(--glass-fg)] mb-2">
          فشل الدفع
        </h1>
        <p className="text-[color:var(--fg-muted)] mb-6">
          لم تكتمل عملية الدفع. يرجى المحاولة مرة أخرى.
        </p>
        <div className="flex gap-3 justify-center">
          <UnifiedButton variant="primary" onClick={() => navigate('/checkout')}>
            إعادة المحاولة
          </UnifiedButton>
          <UnifiedButton variant="ghost" onClick={() => navigate('/')}>
            الصفحة الرئيسية
          </UnifiedButton>
        </div>
      </UnifiedCard>
    </div>
  );
};
