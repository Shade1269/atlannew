-- حذف الview الحالي وإعادة إنشاءه بطريقة آمنة
DROP VIEW merchant_orders_view;

-- إنشاء view بدون استخدام auth.uid() في التعريف
CREATE VIEW merchant_orders_view AS
SELECT 
  o.id,
  o.shop_id,
  o.customer_name,
  o.customer_phone,
  o.shipping_address,
  o.payment_method,
  o.status,
  o.subtotal_sar,
  o.vat_sar,
  o.total_sar,
  o.created_at,
  o.updated_at,
  o.order_number,
  o.customer_profile_id,
  o.shipping_sar,
  o.tax_sar,
  o.tracking_number,
  o.delivered_at,
  -- إخفاء affiliate_store_id وإظهار إشارة فقط إذا كان الطلب من مسوق
  CASE 
    WHEN o.affiliate_store_id IS NOT NULL THEN true 
    ELSE false 
  END as is_affiliate_order
FROM orders o;

-- تفعيل RLS على الview
ALTER VIEW merchant_orders_view ENABLE ROW LEVEL SECURITY;

-- إضافة policy للview
CREATE POLICY "Merchants can view their orders without affiliate details"
ON merchant_orders_view
FOR SELECT
USING (shop_id IN (
  SELECT s.id
  FROM shops s
  JOIN profiles p ON p.id = s.owner_id
  WHERE p.auth_user_id = auth.uid()
));