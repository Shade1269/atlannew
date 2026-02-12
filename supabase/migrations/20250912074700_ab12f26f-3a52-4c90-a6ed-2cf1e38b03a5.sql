-- إنشاء view للطلبات للتجار بدون كشف معلومات المسوقين
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

-- إضافة RLS للview
ALTER VIEW merchant_orders_view SET (security_invoker = true);

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

-- إنشاء جدول لطلبات الادمن لإدارة الطلبات المرسلة من المسوقين
CREATE TABLE admin_order_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  affiliate_store_id UUID REFERENCES affiliate_stores(id),
  merchant_id UUID NOT NULL REFERENCES merchants(id),
  admin_notes TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT admin_order_reviews_status_check 
  CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'FORWARDED_TO_MERCHANT'))
);

-- تفعيل RLS
ALTER TABLE admin_order_reviews ENABLE ROW LEVEL SECURITY;

-- إضافة policies
CREATE POLICY "Admins can manage order reviews" 
ON admin_order_reviews 
FOR ALL 
USING (get_current_user_role() = 'admin');

CREATE POLICY "Merchants can view their forwarded orders"
ON admin_order_reviews
FOR SELECT
USING (
  merchant_id IN (
    SELECT m.id 
    FROM merchants m 
    JOIN profiles p ON p.id = m.profile_id 
    WHERE p.auth_user_id = auth.uid()
  )
  AND status = 'FORWARDED_TO_MERCHANT'
);

-- إضافة trigger للتحديث التلقائي
CREATE TRIGGER update_admin_order_reviews_updated_at
BEFORE UPDATE ON admin_order_reviews
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();